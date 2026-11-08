import {
  SUPPORTED_POLICY_DOCUMENT_TYPES,
  validateEligibilityCriteria,
  type PublishedEligibilityCriterion,
} from "@/lib/scholarshipVerificationPolicy";

export const AI_VERIFICATION_TIMEOUT_MS = 75_000;
export const AI_DISPATCH_EXECUTION_BUDGET_MS = 100_000;
export const AI_MAX_DOCUMENTS = 5;
export const AI_MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const AI_MAX_IMAGE_PIXELS = 20_000_000;
export const AI_VERIFICATION_ENDPOINT_PATH = "/api/v1/verifications";

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const supportedDocumentTypes = new Set<string>(
  SUPPORTED_POLICY_DOCUMENT_TYPES,
);
const fastApiDocumentTypeByPrismaType: Readonly<Record<string, string>> = {
  INCOME_CERTIFICATE: "INCOME_CERT",
  CASTE_CERTIFICATE: "ST_CASTE_CERT",
};
const maximumResponseBytes = 2 * 1024 * 1024;

export type AiVerificationOutcome =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "NEEDS_REVIEW"
  | "FAILED";

export type AiVerificationCriterion = PublishedEligibilityCriterion;

export type AiVerificationStoredDocument = {
  id: string;
  applicationId: string;
  type: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
};

export type AiVerificationInput = {
  applicationId: string;
  idempotencyKey: string;
  applicationData: Record<string, unknown>;
  criteria: readonly AiVerificationCriterion[];
  requiredDocumentTypes: readonly string[];
  aiEligibleDocumentTypes: readonly string[];
  documentIds: readonly string[];
};

export type AiVerificationResult = {
  applicationId: string;
  outcome: AiVerificationOutcome;
  reasons: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  httpStatus: number;
};

export type AiVerificationAdapterDependencies = {
  env: Record<string, string | undefined>;
  findDocuments: (
    applicationId: string,
    documentIds: readonly string[],
    signal?: AbortSignal,
  ) => Promise<readonly AiVerificationStoredDocument[]>;
  downloadDocument: (storagePath: string, signal?: AbortSignal) => Promise<Uint8Array>;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

export type AiVerificationAdapterErrorCode =
  | "CONFIGURATION_MISSING"
  | "CONFIGURATION_INVALID"
  | "CRITERIA_UNAVAILABLE"
  | "CRITERIA_INVALID"
  | "DOCUMENTS_INVALID"
  | "DOCUMENTS_UNSUPPORTED"
  | "STORAGE_ACCESS"
  | "EXECUTION_TIMEOUT"
  | "REQUEST_TIMEOUT"
  | "NETWORK_FAILURE"
  | "HTTP_FAILURE"
  | "RESPONSE_INVALID";

export class AiVerificationAdapterError extends Error {
  constructor(
    readonly code: AiVerificationAdapterErrorCode,
    message: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    this.name = "AiVerificationAdapterError";
  }
}

function timeoutError(code: "EXECUTION_TIMEOUT" | "REQUEST_TIMEOUT"): AiVerificationAdapterError {
  return new AiVerificationAdapterError(
    code,
    code === "REQUEST_TIMEOUT"
      ? "AI verification request timed out; do not automatically resubmit this job."
      : "AI verification dispatch exceeded its execution budget.",
  );
}

function awaitWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(timeoutError("EXECUTION_TIMEOUT"));

  return new Promise<T>((resolve, reject) => {
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const onAbort = () => {
      cleanup();
      reject(timeoutError("EXECUTION_TIMEOUT"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

type ServiceConfiguration = {
  url: string;
  token: string;
};

type ImageInfo = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function toFastApiDocumentType(type: string): string {
  return fastApiDocumentTypeByPrismaType[type] ?? type;
}

function isJsonValue(value: unknown, depth = 0): boolean {
  if (depth > 20) return false;
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item, depth + 1));
  }
  if (isRecord(value)) {
    return Object.values(value).every((item) => isJsonValue(item, depth + 1));
  }
  return false;
}

function readServiceConfiguration(
  env: Record<string, string | undefined>,
): ServiceConfiguration {
  const configuredUrl = env.FELLOWSHIFT_AI_SERVICE_URL?.trim();
  const token = env.FELLOWSHIFT_AI_SERVICE_TOKEN?.trim();
  if (!configuredUrl || !token) {
    throw new AiVerificationAdapterError(
      "CONFIGURATION_MISSING",
      "AI verification service URL and token must be configured.",
    );
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new AiVerificationAdapterError(
      "CONFIGURATION_INVALID",
      "AI verification service URL must be a valid HTTPS URL.",
    );
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new AiVerificationAdapterError(
      "CONFIGURATION_INVALID",
      "AI verification service URL must be HTTPS and must not contain credentials, query parameters, or a fragment.",
    );
  }

  url.pathname = AI_VERIFICATION_ENDPOINT_PATH;
  return { url: url.toString(), token };
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;
  while (offset < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;

    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) return null;

    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }
    offset += segmentLength;
  }
  return null;
}

function imageInfo(bytes: Uint8Array): ImageInfo | null {
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a &&
    bytes[12] === 0x49 &&
    bytes[13] === 0x48 &&
    bytes[14] === 0x44 &&
    bytes[15] === 0x52
  ) {
    const width =
      bytes[16] * 0x1000000 +
      bytes[17] * 0x10000 +
      bytes[18] * 0x100 +
      bytes[19];
    const height =
      bytes[20] * 0x1000000 +
      bytes[21] * 0x10000 +
      bytes[22] * 0x100 +
      bytes[23];
    return { mimeType: "image/png", width, height };
  }

  const jpeg = jpegDimensions(bytes);
  if (jpeg) return { mimeType: "image/jpeg", ...jpeg };

  if (
    bytes.length >= 25 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (chunk === "VP8X" && bytes.length >= 30) {
      return {
        mimeType: "image/webp",
        width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      };
    }
    if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
      return {
        mimeType: "image/webp",
        width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
        height:
          1 +
          ((bytes[22] & 0xc0) >> 6) +
          (bytes[23] << 2) +
          ((bytes[24] & 0x0f) << 10),
      };
    }
    if (
      chunk === "VP8 " &&
      bytes.length >= 30 &&
      bytes[23] === 0x9d &&
      bytes[24] === 0x01 &&
      bytes[25] === 0x2a
    ) {
      return {
        mimeType: "image/webp",
        width: ((bytes[26] | (bytes[27] << 8)) & 0x3fff),
        height: ((bytes[28] | (bytes[29] << 8)) & 0x3fff),
      };
    }
  }

  return null;
}

function fileExtension(mimeType: ImageInfo["mimeType"]): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

function validateInput(input: AiVerificationInput): void {
  if (!input.applicationId.trim() || !input.idempotencyKey.trim()) {
    throw new AiVerificationAdapterError(
      "DOCUMENTS_INVALID",
      "Application ID and the existing verification job idempotency key are required.",
    );
  }
  if (!isRecord(input.applicationData) || !isJsonValue(input.applicationData)) {
    throw new AiVerificationAdapterError(
      "DOCUMENTS_INVALID",
      "Application data must be a JSON object.",
    );
  }
  if (!Array.isArray(input.criteria) || input.criteria.length === 0) {
    throw new AiVerificationAdapterError(
      "CRITERIA_UNAVAILABLE",
      "Authoritative scheme eligibility criteria are required; no verification request was sent.",
    );
  }
  const criteriaValidation = validateEligibilityCriteria(input.criteria, {
    requirePublicationMetadata: true,
  });
  if (!criteriaValidation.success || !input.criteria.every(isJsonValue)) {
    throw new AiVerificationAdapterError(
      "CRITERIA_INVALID",
      "Eligibility criteria must include valid reason codes and explanations.",
    );
  }
  if (
    !Array.isArray(input.requiredDocumentTypes) ||
    input.requiredDocumentTypes.length > SUPPORTED_POLICY_DOCUMENT_TYPES.length ||
    input.requiredDocumentTypes.some(
      (type) =>
        typeof type !== "string" ||
        !supportedDocumentTypes.has(type),
    ) ||
    new Set(input.requiredDocumentTypes).size !== input.requiredDocumentTypes.length
  ) {
    throw new AiVerificationAdapterError(
      "DOCUMENTS_INVALID",
      "Required document types must be unique supported scholarship document types.",
    );
  }
  if (
    !Array.isArray(input.aiEligibleDocumentTypes) ||
    input.aiEligibleDocumentTypes.length > AI_MAX_DOCUMENTS ||
    input.aiEligibleDocumentTypes.some(
      (type) =>
        typeof type !== "string" ||
        !supportedDocumentTypes.has(type),
    ) ||
    new Set(input.aiEligibleDocumentTypes).size !==
      input.aiEligibleDocumentTypes.length ||
    input.aiEligibleDocumentTypes.some(
      (type) => !input.requiredDocumentTypes.includes(type),
    )
  ) {
    throw new AiVerificationAdapterError(
      "DOCUMENTS_UNSUPPORTED",
      "AI-eligible document types must be unique, required, and limited to five.",
    );
  }
  if (
    !Array.isArray(input.documentIds) ||
    input.documentIds.length > AI_MAX_DOCUMENTS ||
    input.documentIds.some((id) => typeof id !== "string" || !id.trim()) ||
    new Set(input.documentIds).size !== input.documentIds.length
  ) {
    throw new AiVerificationAdapterError(
      "DOCUMENTS_UNSUPPORTED",
      "The request must contain at most five unique document IDs.",
    );
  }
}

function normalizeResponse(
  value: unknown,
  expectedApplicationId: string,
  httpStatus: number,
): AiVerificationResult {
  if (
    !isRecord(value) ||
    value.application_id !== expectedApplicationId ||
    !["ELIGIBLE", "INELIGIBLE", "NEEDS_REVIEW", "FAILED"].includes(
      String(value.outcome),
    ) ||
    !Array.isArray(value.reasons) ||
    !Array.isArray(value.documents) ||
    value.reasons.length > 1000 ||
    value.documents.length > AI_MAX_DOCUMENTS ||
    !value.reasons.every(isRecord) ||
    !value.documents.every(isRecord) ||
    !isJsonValue(value.reasons) ||
    !isJsonValue(value.documents)
  ) {
    throw new AiVerificationAdapterError(
      "RESPONSE_INVALID",
      "AI verification service returned a response that does not match the supported contract.",
      httpStatus,
    );
  }

  return {
    applicationId: expectedApplicationId,
    outcome: value.outcome as AiVerificationOutcome,
    reasons: value.reasons,
    documents: value.documents,
    httpStatus,
  };
}

export function createAiVerificationAdapter(
  dependencies: AiVerificationAdapterDependencies,
) {
  const fetcher = dependencies.fetcher ?? fetch;
  const timeoutMs = dependencies.timeoutMs ?? AI_VERIFICATION_TIMEOUT_MS;

  return {
    async verify(
      input: AiVerificationInput,
      dispatchSignal?: AbortSignal,
    ): Promise<AiVerificationResult> {
      validateInput(input);
      const configuration = readServiceConfiguration(dependencies.env);
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 65_000) {
        throw new AiVerificationAdapterError(
          "CONFIGURATION_INVALID",
          "AI verification timeout must exceed the backend processing budget.",
        );
      }

      let storedDocuments: readonly AiVerificationStoredDocument[];
      try {
        storedDocuments = await awaitWithSignal(
          dependencies.findDocuments(
            input.applicationId,
            input.documentIds,
            dispatchSignal,
          ),
          dispatchSignal,
        );
      } catch {
        if (dispatchSignal?.aborted) {
          throw timeoutError("EXECUTION_TIMEOUT");
        }
        throw new AiVerificationAdapterError(
          "STORAGE_ACCESS",
          "Unable to load documents owned by this application.",
        );
      }

      if (
        storedDocuments.length !== input.documentIds.length ||
        storedDocuments.some(
          (document, index) =>
            document.applicationId !== input.applicationId ||
            document.id !== input.documentIds[index] ||
            !input.aiEligibleDocumentTypes.includes(document.type) ||
            !document.storagePath,
        ) ||
        new Set(storedDocuments.map((document) => document.type)).size !==
          storedDocuments.length
      ) {
        throw new AiVerificationAdapterError(
          "DOCUMENTS_INVALID",
          "One or more documents do not belong to this application.",
        );
      }
      const aiDocumentPriority = new Map(
        input.aiEligibleDocumentTypes.map((type, index) => [type, index]),
      );
      storedDocuments = [...storedDocuments].sort(
        (left, right) =>
          (aiDocumentPriority.get(left.type) ?? Number.MAX_SAFE_INTEGER) -
          (aiDocumentPriority.get(right.type) ?? Number.MAX_SAFE_INTEGER),
      );
      const requestDocuments = storedDocuments.map((document) => ({
        document,
        type: toFastApiDocumentType(document.type),
      }));

      const form = new FormData();
      form.append(
        "application_data",
        JSON.stringify({
          application_id: input.applicationId,
          application_data: input.applicationData,
        }),
      );
      form.append("criteria", JSON.stringify(input.criteria));
      form.append(
        "required_document_types",
        JSON.stringify(input.requiredDocumentTypes.map(toFastApiDocumentType)),
      );
      form.append(
        "document_types",
        JSON.stringify(requestDocuments.map(({ type }) => type)),
      );

      for (const [index, { document }] of requestDocuments.entries()) {
        if (
          !Number.isSafeInteger(document.sizeBytes) ||
          document.sizeBytes < 1 ||
          document.sizeBytes > AI_MAX_DOCUMENT_SIZE_BYTES ||
          !supportedImageTypes.has(document.mimeType)
        ) {
          throw new AiVerificationAdapterError(
            "DOCUMENTS_UNSUPPORTED",
            "Only JPEG, PNG, and WebP files up to 10 MiB can be sent for AI verification.",
          );
        }

        let bytes: Uint8Array;
        try {
          bytes = await awaitWithSignal(
            dependencies.downloadDocument(document.storagePath, dispatchSignal),
            dispatchSignal,
          );
        } catch {
          if (dispatchSignal?.aborted) {
            throw timeoutError("EXECUTION_TIMEOUT");
          }
          throw new AiVerificationAdapterError(
            "STORAGE_ACCESS",
            "Unable to retrieve a private application document.",
          );
        }
        if (
          bytes.byteLength !== document.sizeBytes ||
          bytes.byteLength < 1 ||
          bytes.byteLength > AI_MAX_DOCUMENT_SIZE_BYTES
        ) {
          throw new AiVerificationAdapterError(
            "DOCUMENTS_UNSUPPORTED",
            "A stored document is empty or exceeds the 10 MiB service limit.",
          );
        }

        const info = imageInfo(bytes);
        if (
          !info ||
          info.mimeType !== document.mimeType ||
          info.width < 1 ||
          info.height < 1 ||
          info.width * info.height > AI_MAX_IMAGE_PIXELS
        ) {
          throw new AiVerificationAdapterError(
            "DOCUMENTS_UNSUPPORTED",
            "A stored document is not a supported image or exceeds the 20 megapixel limit.",
          );
        }

        const fileBuffer = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(fileBuffer).set(bytes);
        const blob = new Blob([fileBuffer], { type: info.mimeType });
        form.append(
          "documents",
          blob,
          `document-${index + 1}.${fileExtension(info.mimeType)}`,
        );
      }

      if (dispatchSignal?.aborted) {
        throw timeoutError("EXECUTION_TIMEOUT");
      }

      let response: Response;
      const requestSignal = AbortSignal.any([
        ...(dispatchSignal ? [dispatchSignal] : []),
        AbortSignal.timeout(timeoutMs),
      ]);
      try {
        response = await awaitWithSignal(
          fetcher(configuration.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${configuration.token}`,
              "Idempotency-Key": input.idempotencyKey,
            },
            body: form,
            signal: requestSignal,
            cache: "no-store",
            redirect: "error",
          }),
          requestSignal,
        );
      } catch (error) {
        if (
          requestSignal.aborted ||
          error instanceof Error &&
          (error.name === "TimeoutError" || error.name === "AbortError")
        ) {
          throw timeoutError("REQUEST_TIMEOUT");
        }
        throw new AiVerificationAdapterError(
          "NETWORK_FAILURE",
          "AI verification service could not be reached; retry using the same job idempotency key.",
        );
      }

      if (!response.ok && response.status !== 503) {
        throw new AiVerificationAdapterError(
          "HTTP_FAILURE",
          "AI verification service returned an unsuccessful HTTP status.",
          response.status,
        );
      }

      let responseText: string;
      try {
        responseText = await awaitWithSignal(response.text(), requestSignal);
      } catch {
        if (requestSignal.aborted) throw timeoutError("REQUEST_TIMEOUT");
        throw new AiVerificationAdapterError(
          "NETWORK_FAILURE",
          "AI verification response could not be read.",
          response.status,
        );
      }
      if (responseText.length > maximumResponseBytes) {
        throw new AiVerificationAdapterError(
          "RESPONSE_INVALID",
          "AI verification service response exceeded the supported size.",
          response.status,
        );
      }

      let responseValue: unknown;
      try {
        responseValue = JSON.parse(responseText);
      } catch {
        throw new AiVerificationAdapterError(
          "RESPONSE_INVALID",
          "AI verification service returned malformed JSON.",
          response.status,
        );
      }
      const normalized = normalizeResponse(
        responseValue,
        input.applicationId,
        response.status,
      );
      if (response.status === 503 && normalized.outcome !== "FAILED") {
        throw new AiVerificationAdapterError(
          "HTTP_FAILURE",
          "AI verification service returned HTTP 503 without a FAILED outcome.",
          response.status,
        );
      }
      return normalized;
    },
  };
}
