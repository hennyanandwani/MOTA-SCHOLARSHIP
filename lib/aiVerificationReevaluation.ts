import {
  AI_MAX_DOCUMENTS,
  AI_MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/aiVerificationAdapterCore";
import type { DocumentSnapshotEntry } from "@/lib/aiVerificationDispatcherCore";
import type { VerificationDocumentType } from "@/lib/scholarshipVerificationPolicy";

const supportedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ReevaluationDocument = {
  id: string;
  type: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: Date | string;
};

export type ReevaluationDocumentResult =
  | {
      success: true;
      documentSnapshot: DocumentSnapshotEntry[];
      selectedDocumentIds: string[];
    }
  | {
      success: false;
      code:
        | "DOCUMENT_VERSION_STALE"
        | "DOCUMENT_SNAPSHOT_INVALID"
        | "REQUIRED_DOCUMENT_MISSING"
        | "AI_DOCUMENT_DUPLICATE"
        | "AI_DOCUMENT_FORMAT_UNSUPPORTED"
        | "AI_DOCUMENT_SIZE_INVALID"
        | "AI_DOCUMENT_LIMIT_EXCEEDED";
    };

function normalizedUpdatedAt(value: Date | string): string | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function buildDocumentVersionSnapshot(
  documents: readonly Pick<ReevaluationDocument, "id" | "type" | "updatedAt">[],
): DocumentSnapshotEntry[] {
  return documents
    .map((document) => ({
      id: document.id,
      type: document.type,
      updatedAt: normalizedUpdatedAt(document.updatedAt) ?? "",
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function validateReevaluationDocuments(input: {
  documents: readonly ReevaluationDocument[];
  expectedVersions: unknown;
  requiredDocumentTypes: readonly VerificationDocumentType[];
  aiEligibleDocumentTypes: readonly VerificationDocumentType[];
}): ReevaluationDocumentResult {
  if (!Array.isArray(input.expectedVersions)) {
    return { success: false, code: "DOCUMENT_SNAPSHOT_INVALID" };
  }
  const expected = input.expectedVersions as DocumentSnapshotEntry[];
  if (
    expected.length > 100 ||
    expected.some((entry) =>
      typeof entry !== "object" ||
      entry === null ||
      typeof entry.id !== "string" ||
      typeof entry.type !== "string" ||
      typeof entry.updatedAt !== "string" ||
      Object.keys(entry).length !== 3 ||
      !normalizedUpdatedAt(entry.updatedAt),
    ) ||
    new Set(expected.map((entry) => entry.id)).size !== expected.length
  ) {
    return { success: false, code: "DOCUMENT_SNAPSHOT_INVALID" };
  }

  const documentSnapshot = buildDocumentVersionSnapshot(input.documents);
  if (
    documentSnapshot.some((entry) => !entry.updatedAt) ||
    JSON.stringify(documentSnapshot) !==
      JSON.stringify(
        [...expected]
          .map((entry) => ({
            ...entry,
            updatedAt: normalizedUpdatedAt(entry.updatedAt) ?? "",
          }))
          .sort((left, right) => left.id.localeCompare(right.id)),
      )
  ) {
    return { success: false, code: "DOCUMENT_VERSION_STALE" };
  }

  for (const type of input.requiredDocumentTypes) {
    if (!input.documents.some((document) => document.type === type)) {
      return { success: false, code: "REQUIRED_DOCUMENT_MISSING" };
    }
  }
  if (input.aiEligibleDocumentTypes.length > AI_MAX_DOCUMENTS) {
    return { success: false, code: "AI_DOCUMENT_LIMIT_EXCEEDED" };
  }

  const selected: ReevaluationDocument[] = [];
  for (const type of input.aiEligibleDocumentTypes) {
    const matches = input.documents.filter((document) => document.type === type);
    if (matches.length > 1) {
      return { success: false, code: "AI_DOCUMENT_DUPLICATE" };
    }
    if (matches.length !== 1) {
      return { success: false, code: "REQUIRED_DOCUMENT_MISSING" };
    }
    const document = matches[0];
    if (!supportedImageMimeTypes.has(document.mimeType)) {
      return { success: false, code: "AI_DOCUMENT_FORMAT_UNSUPPORTED" };
    }
    if (
      !Number.isSafeInteger(document.sizeBytes) ||
      document.sizeBytes <= 0 ||
      document.sizeBytes > AI_MAX_DOCUMENT_SIZE_BYTES
    ) {
      return { success: false, code: "AI_DOCUMENT_SIZE_INVALID" };
    }
    selected.push(document);
  }
  if (selected.length > AI_MAX_DOCUMENTS) {
    return { success: false, code: "AI_DOCUMENT_LIMIT_EXCEEDED" };
  }

  return {
    success: true,
    documentSnapshot,
    selectedDocumentIds: selected.map((document) => document.id),
  };
}
