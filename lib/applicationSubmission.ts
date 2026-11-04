import { getApplicationSubmissionErrors } from "./applicationDraft";

export type SubmissionAbortResult =
  | { kind: "not_found" }
  | { kind: "not_draft" }
  | { kind: "inactive_scheme" }
  | { kind: "invalid_application"; errors: string[] }
  | { kind: "missing_documents"; documents: string[] };

export type SubmissionValidationFailure = Extract<
  SubmissionAbortResult,
  { kind: "inactive_scheme" | "invalid_application" | "missing_documents" }
>;

export class SubmissionTransactionAbort extends Error {
  constructor(readonly result: SubmissionAbortResult) {
    super("Application submission transaction aborted.");
    this.name = "SubmissionTransactionAbort";
  }
}

export function getSubmissionFailureStatus(
  kind: SubmissionAbortResult["kind"],
): 404 | 409 | 422 {
  switch (kind) {
    case "not_found":
      return 404;
    case "not_draft":
    case "inactive_scheme":
      return 409;
    case "invalid_application":
    case "missing_documents":
      return 422;
  }
}

export function getSubmissionValidationFailure(input: {
  schemeIsActive: boolean;
  formData: unknown;
  currentStep: number;
  accountNumberConfirmed: boolean;
  declarations: readonly boolean[];
  documents: readonly { type: string; verificationStatus: string }[];
  requiredDocumentTypes: readonly string[];
  documentLabels: Readonly<Partial<Record<string, string>>>;
}): SubmissionValidationFailure | null {
  if (!input.schemeIsActive) return { kind: "inactive_scheme" };

  const validationErrors = getApplicationSubmissionErrors(input.formData);
  if (input.currentStep !== 4) {
    validationErrors.unshift("Complete all application steps before submitting.");
  }
  if (!input.accountNumberConfirmed) {
    validationErrors.push("Account numbers must match before submitting.");
  }
  if (input.declarations.some((accepted) => !accepted)) {
    validationErrors.push("Accept all required declarations before submitting.");
  }
  if (validationErrors.length > 0) {
    return { kind: "invalid_application", errors: validationErrors };
  }

  const missingDocuments = input.requiredDocumentTypes
    .filter((type) => !input.documents.some(
      (document) =>
        document.type === type &&
        document.verificationStatus !== "REJECTED" &&
        document.verificationStatus !== "FLAGGED",
    ))
    .map((type) => input.documentLabels[type] ?? type);

  if (missingDocuments.length > 0) {
    return { kind: "missing_documents", documents: missingDocuments };
  }

  return null;
}
