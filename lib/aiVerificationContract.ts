import { createHmac, timingSafeEqual } from "node:crypto";

export type AiCallbackOutcome = "ELIGIBLE" | "INELIGIBLE" | "FAILED";
export type AiDocumentOutcome = "VALID" | "INVALID" | "NEEDS_REVIEW";
export type AiStudentReasonCode =
  | "MISSING_DOCUMENT"
  | "DOCUMENT_UNREADABLE"
  | "ELIGIBILITY_CRITERIA_NOT_MET"
  | "OTHER";

export function getStudentSafeAiReason(
  code: AiStudentReasonCode | null,
): string | null {
  switch (code) {
    case "MISSING_DOCUMENT":
      return "One or more required documents were missing.";
    case "DOCUMENT_UNREADABLE":
      return "One or more documents could not be verified. Please review the document requirements.";
    case "ELIGIBILITY_CRITERIA_NOT_MET":
      return "The submitted information did not meet the published eligibility criteria.";
    case "OTHER":
      return "The application did not meet the automated verification checks. Contact support for assistance.";
    default:
      return null;
  }
}

export type AiVerificationCallback = {
  contractVersion: 1;
  jobId: string;
  idempotencyKey: string;
  inputVersion: number;
  outcome: AiCallbackOutcome;
  explanation: string;
  studentReasonCode: AiStudentReasonCode | null;
  modelVersion: string;
  confidence: number | null;
  documentResults: {
    documentId: string;
    outcome: AiDocumentOutcome;
    explanation: string | null;
  }[];
};

export function buildAiJobIdempotencyKey(
  applicationId: string,
  inputVersion: number,
): string {
  if (!applicationId.trim() || !Number.isSafeInteger(inputVersion) || inputVersion < 0) {
    throw new Error("A valid application ID and non-negative input version are required.");
  }
  return `${applicationId}:${inputVersion}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(
  value: unknown,
  maximum: number,
  allowEmpty = false,
): value is string {
  return (
    typeof value === "string" &&
    value.length <= maximum &&
    (allowEmpty || value.trim().length > 0)
  );
}

export function parseAiVerificationCallback(
  value: unknown,
): AiVerificationCallback | null {
  if (!isRecord(value)) return null;
  const {
    contractVersion,
    jobId,
    idempotencyKey,
    inputVersion,
    outcome,
    explanation,
    studentReasonCode,
    modelVersion,
    confidence,
    documentResults,
  } = value;

  if (
    contractVersion !== 1 ||
    !boundedString(jobId, 120) ||
    !boundedString(idempotencyKey, 200) ||
    !Number.isSafeInteger(inputVersion) ||
    (inputVersion as number) < 0 ||
    !["ELIGIBLE", "INELIGIBLE", "FAILED"].includes(String(outcome)) ||
    !boundedString(explanation, 10000) ||
    !(studentReasonCode === undefined || studentReasonCode === null ||
      ["MISSING_DOCUMENT", "DOCUMENT_UNREADABLE", "ELIGIBILITY_CRITERIA_NOT_MET", "OTHER"].includes(String(studentReasonCode))) ||
    !boundedString(modelVersion, 120) ||
    !(confidence === null || (typeof confidence === "number" && Number.isFinite(confidence) && confidence >= 0 && confidence <= 100)) ||
    !Array.isArray(documentResults) ||
    documentResults.length > 30
  ) {
    return null;
  }

  const parsedDocuments: AiVerificationCallback["documentResults"] = [];
  const seenDocumentIds = new Set<string>();
  for (const result of documentResults) {
    if (
      !isRecord(result) ||
      !boundedString(result.documentId, 120) ||
      seenDocumentIds.has(result.documentId) ||
      !["VALID", "INVALID", "NEEDS_REVIEW"].includes(String(result.outcome)) ||
      !(result.explanation === undefined || result.explanation === null || boundedString(result.explanation, 2000, true))
    ) {
      return null;
    }
    seenDocumentIds.add(result.documentId);
    parsedDocuments.push({
      documentId: result.documentId,
      outcome: result.outcome as AiDocumentOutcome,
      explanation: typeof result.explanation === "string" ? result.explanation : null,
    });
  }
  if (outcome === "INELIGIBLE" &&
    (typeof studentReasonCode !== "string" ||
      !["MISSING_DOCUMENT", "DOCUMENT_UNREADABLE", "ELIGIBILITY_CRITERIA_NOT_MET", "OTHER"].includes(studentReasonCode))) {
    return null;
  }

  return {
    contractVersion: 1,
    jobId,
    idempotencyKey,
    inputVersion: inputVersion as number,
    outcome: outcome as AiCallbackOutcome,
    explanation,
    studentReasonCode: typeof studentReasonCode === "string"
      ? studentReasonCode as AiStudentReasonCode
      : null,
    modelVersion,
    confidence: confidence as number | null,
    documentResults: parsedDocuments,
  };
}

export function verifyAiCallbackSignature(input: {
  secret: string;
  timestamp: string;
  rawBody: string;
  signature: string;
  nowMilliseconds?: number;
}): boolean {
  if (!/^\d{10}$/.test(input.timestamp) || !/^[a-f0-9]{64}$/i.test(input.signature)) {
    return false;
  }
  const timestampMilliseconds = Number(input.timestamp) * 1000;
  const nowMilliseconds = input.nowMilliseconds ?? Date.now();
  if (Math.abs(nowMilliseconds - timestampMilliseconds) > 5 * 60 * 1000) {
    return false;
  }

  const expected = createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.rawBody}`, "utf8")
    .digest();
  const provided = Buffer.from(input.signature, "hex");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function aiIntegrationReadiness(env: Record<string, string | undefined>) {
  const missing = [
    !env.FELLOWSHIFT_AI_CONTRACT_VERSION && "FELLOWSHIFT_AI_CONTRACT_VERSION",
    !env.FELLOWSHIFT_AI_SERVICE_URL && "FELLOWSHIFT_AI_SERVICE_URL",
    !env.FELLOWSHIFT_AI_SERVICE_TOKEN && "FELLOWSHIFT_AI_SERVICE_TOKEN",
    !env.AI_VERIFICATION_CALLBACK_SECRET && "AI_VERIFICATION_CALLBACK_SECRET",
  ].filter((value): value is string => Boolean(value));

  return {
    configured: false as const,
    adapterImplemented: false as const,
    missing,
  };
}
