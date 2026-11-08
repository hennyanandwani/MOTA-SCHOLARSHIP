import type {
  ApplicationStatus,
  DocumentType,
  VerificationStatus,
} from "@/lib/generated/prisma/client";
import { requiredApplicationDocumentTypes } from "@/lib/applicationRequirements";

const appStatus = {
  SUBMITTED: "SUBMITTED",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  FLAGGED_FOR_MANUAL_REVIEW: "FLAGGED_FOR_MANUAL_REVIEW",
  RECOMMENDED_FOR_APPROVAL: "RECOMMENDED_FOR_APPROVAL",
  APPROVED_BY_OFFICER: "APPROVED_BY_OFFICER",
  REJECTED_BY_OFFICER: "REJECTED_BY_OFFICER",
  REJECTED_BY_AI: "REJECTED_BY_AI",
} as const satisfies Record<string, ApplicationStatus>;

const documentStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  FLAGGED: "FLAGGED",
  REJECTED: "REJECTED",
} as const satisfies Record<string, VerificationStatus>;

type ReviewedDocument = {
  type: DocumentType;
  verificationStatus: VerificationStatus;
};

export function isApplicationSubmitted(
  status: string,
  submittedAt: string | null | undefined,
): boolean {
  return status !== "DRAFT" && submittedAt != null;
}

export function isAiOutcomeAvailableForManualReview(
  aiStatus: string,
  aiAttemptCount: number,
): boolean {
  return (
    aiStatus === "ELIGIBLE" ||
    aiStatus === "NEEDS_ATTENTION" ||
    (aiStatus === "INELIGIBLE" && aiAttemptCount >= 4)
  );
}

const applicationTransitions: Partial<
  Record<ApplicationStatus, readonly ApplicationStatus[]>
> = {
  [appStatus.SUBMITTED]: [
    appStatus.PENDING_VERIFICATION,
    appStatus.FLAGGED_FOR_MANUAL_REVIEW,
    appStatus.REJECTED_BY_OFFICER,
  ],
  [appStatus.PENDING_VERIFICATION]: [
    appStatus.FLAGGED_FOR_MANUAL_REVIEW,
    appStatus.RECOMMENDED_FOR_APPROVAL,
    appStatus.REJECTED_BY_OFFICER,
  ],
  [appStatus.FLAGGED_FOR_MANUAL_REVIEW]: [
    appStatus.PENDING_VERIFICATION,
    appStatus.REJECTED_BY_OFFICER,
  ],
  [appStatus.RECOMMENDED_FOR_APPROVAL]: [
    appStatus.REJECTED_BY_OFFICER,
  ],
};

const documentTransitions: Partial<
  Record<VerificationStatus, readonly VerificationStatus[]>
> = {
  [documentStatus.PENDING]: [
    documentStatus.VERIFIED,
    documentStatus.FLAGGED,
    documentStatus.REJECTED,
  ],
  [documentStatus.FLAGGED]: [
    documentStatus.PENDING,
    documentStatus.VERIFIED,
    documentStatus.REJECTED,
  ],
  [documentStatus.REJECTED]: [
    documentStatus.PENDING,
    documentStatus.VERIFIED,
  ],
  [documentStatus.VERIFIED]: [
    documentStatus.FLAGGED,
    documentStatus.REJECTED,
  ],
};

export function getMissingVerifiedDocumentTypes(
  documents: readonly ReviewedDocument[],
  requiredDocumentTypes: readonly DocumentType[] = requiredApplicationDocumentTypes,
): DocumentType[] {
  return requiredDocumentTypes.filter(
    (type) =>
      !documents.some(
        (document) =>
          document.type === type &&
          document.verificationStatus === documentStatus.VERIFIED,
      ),
  );
}

export function areRequiredApplicationDocumentsVerified(
  documents: readonly ReviewedDocument[],
  requiredDocumentTypes: readonly DocumentType[] = requiredApplicationDocumentTypes,
): boolean {
  return (
    getMissingVerifiedDocumentTypes(documents, requiredDocumentTypes).length === 0 &&
    documents.every(
      (document) => document.verificationStatus === documentStatus.VERIFIED,
    )
  );
}

export function getAllowedApplicationDecisionTransitions(
  current: ApplicationStatus,
  documents: readonly ReviewedDocument[],
  requiredDocumentTypes: readonly DocumentType[] = requiredApplicationDocumentTypes,
): ApplicationStatus[] {
  return (applicationTransitions[current] ?? []).filter(
    (next) =>
      (next !== appStatus.RECOMMENDED_FOR_APPROVAL &&
        next !== appStatus.APPROVED_BY_OFFICER) ||
      areRequiredApplicationDocumentsVerified(documents, requiredDocumentTypes),
  );
}

export function getApplicationDecisionFailure(
  current: ApplicationStatus,
  next: ApplicationStatus,
  documents: readonly ReviewedDocument[],
  requiredDocumentTypes: readonly DocumentType[] = requiredApplicationDocumentTypes,
): "draft" | "invalid_transition" | "documents_not_verified" | null {
  if (current === "DRAFT") return "draft";
  if (!(applicationTransitions[current] ?? []).includes(next)) {
    return "invalid_transition";
  }
  if (
    (next === appStatus.RECOMMENDED_FOR_APPROVAL ||
      next === appStatus.APPROVED_BY_OFFICER) &&
    !areRequiredApplicationDocumentsVerified(documents, requiredDocumentTypes)
  ) {
    return "documents_not_verified";
  }
  return null;
}

export function isApplicationDocumentReviewable(
  status: ApplicationStatus,
): boolean {
  return (
    status === appStatus.SUBMITTED ||
    status === appStatus.PENDING_VERIFICATION ||
    status === appStatus.FLAGGED_FOR_MANUAL_REVIEW
  );
}

export function getAllowedDocumentVerificationTransitions(
  current: VerificationStatus,
): VerificationStatus[] {
  return [...(documentTransitions[current] ?? [])];
}

export function isSerializableAdminWorkflowConflict(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}
