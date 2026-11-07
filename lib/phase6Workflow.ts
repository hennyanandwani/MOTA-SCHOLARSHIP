import { isAiOutcomeAvailableForManualReview } from "@/lib/adminWorkflow";

export type Phase6AiStatus =
  | "NOT_REQUESTED"
  | "WAITING_FOR_CONFIGURATION"
  | "QUEUED"
  | "IN_PROGRESS"
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "FAILED"
  | "NEEDS_ATTENTION";

export type Phase6ManualReviewStatus =
  | "NOT_READY"
  | "PENDING"
  | "IN_PROGRESS"
  | "VERIFIED"
  | "REJECTED"
  | "NEEDS_ATTENTION";

export type Phase6SelectionOutcome =
  | "SELECTED"
  | "WAITLISTED"
  | "NOT_RECOMMENDED";

export type Phase6ApprovalStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "RETURNED_FOR_REVIEW";

const selectionTransitions: Record<
  Phase6SelectionOutcome | "NONE",
  readonly Phase6SelectionOutcome[]
> = {
  NONE: ["SELECTED", "WAITLISTED", "NOT_RECOMMENDED"],
  WAITLISTED: ["SELECTED", "NOT_RECOMMENDED"],
  SELECTED: ["WAITLISTED", "NOT_RECOMMENDED"],
  NOT_RECOMMENDED: [],
};

const approvalTransitions: Record<
  Phase6ApprovalStatus,
  readonly Phase6ApprovalStatus[]
> = {
  PENDING_APPROVAL: ["APPROVED", "RETURNED_FOR_REVIEW"],
  APPROVED: [],
  RETURNED_FOR_REVIEW: ["PENDING_APPROVAL"],
};

export function getSelectionTransitionFailure(input: {
  applicationStatus: string;
  submittedAt: Date | string | null;
  aiStatus: Phase6AiStatus;
  aiAttemptCount: number;
  manualReviewStatus: Phase6ManualReviewStatus;
  documents: readonly { type: string; verificationStatus: string }[];
  requiredDocumentTypes: readonly string[];
  currentOutcome: Phase6SelectionOutcome | null;
  expectedOutcome: Phase6SelectionOutcome | null;
  nextOutcome: Phase6SelectionOutcome;
  currentApproval: Phase6ApprovalStatus | null;
}): string | null {
  if (!input.submittedAt || input.applicationStatus === "DRAFT") {
    return "Application is not submitted.";
  }
  if (
    !isAiOutcomeAvailableForManualReview(input.aiStatus, input.aiAttemptCount) ||
    input.applicationStatus === "REJECTED_BY_AI"
  ) {
    return "AI eligibility or a manually reviewed outcome is required before selection.";
  }
  if (
    input.manualReviewStatus !== "VERIFIED" ||
    input.applicationStatus !== "RECOMMENDED_FOR_APPROVAL"
  ) {
    return "Completed manual verification and recommendation are required.";
  }
  if (
    input.requiredDocumentTypes.some(
      (type) =>
        !input.documents.some(
          (document) =>
            document.type === type &&
            document.verificationStatus === "VERIFIED",
        ),
    ) ||
    input.documents.some((document) => document.verificationStatus !== "VERIFIED")
  ) {
    return "All required and attached documents must be verified.";
  }
  if (input.currentOutcome !== input.expectedOutcome) {
    return "Selection changed while this action was being prepared.";
  }
  if (
    input.currentApproval === "PENDING_APPROVAL" ||
    input.currentApproval === "APPROVED" ||
    !(selectionTransitions[input.currentOutcome ?? "NONE"] ?? []).includes(
      input.nextOutcome,
    )
  ) {
    return "This selection transition is not allowed.";
  }
  return null;
}

export function canTransitionApproval(
  current: Phase6ApprovalStatus,
  next: Phase6ApprovalStatus,
): boolean {
  return approvalTransitions[current].includes(next);
}

export function getStudentAiStatusLabel(
  status: Phase6AiStatus,
): string {
  switch (status) {
    case "NOT_REQUESTED": return "AI verification not requested";
    case "WAITING_FOR_CONFIGURATION": return "AI verification pending service configuration";
    case "QUEUED": return "AI verification pending";
    case "IN_PROGRESS": return "AI verification in progress";
    case "ELIGIBLE": return "AI eligible · awaiting manual verification";
    case "INELIGIBLE": return "AI ineligible";
    case "FAILED": return "AI verification failed · needs attention";
    case "NEEDS_ATTENTION": return "AI verification needs attention";
  }
}

export function getStudentAiReason(
  status: Phase6AiStatus,
  studentReason: string | null,
): string | null {
  return status === "INELIGIBLE" ? studentReason : null;
}
