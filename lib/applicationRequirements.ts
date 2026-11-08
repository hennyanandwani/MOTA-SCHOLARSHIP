import type { DocumentType } from "@/lib/generated/prisma/client";

export const requiredApplicationDocumentTypes = [
  "CASTE_CERTIFICATE",
  "INCOME_CERTIFICATE",
  "IDENTITY_PROOF",
  "MARKSHEET",
  "ADMISSION_PROOF",
  "BANK_PROOF",
  "PHOTOGRAPH",
] as const satisfies readonly DocumentType[];

export type ApplicationRequirementDocumentType =
  (typeof requiredApplicationDocumentTypes)[number];

const supportedDocumentTypes = new Set<string>(
  requiredApplicationDocumentTypes,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getEffectiveRequiredDocumentTypes(
  policyDocumentTypes: readonly string[] | null | undefined,
): ApplicationRequirementDocumentType[] {
  if (policyDocumentTypes == null) {
    return [...requiredApplicationDocumentTypes];
  }
  if (
    policyDocumentTypes.length === 0 ||
    policyDocumentTypes.some((type) => !supportedDocumentTypes.has(type)) ||
    new Set(policyDocumentTypes).size !== policyDocumentTypes.length
  ) {
    throw new Error("Published policy contains invalid required document types.");
  }
  return [...policyDocumentTypes] as ApplicationRequirementDocumentType[];
}

export function getRequiredDocumentTypesFromPolicySnapshot(
  snapshot: unknown,
): ApplicationRequirementDocumentType[] {
  if (snapshot == null) {
    return getEffectiveRequiredDocumentTypes(null);
  }
  if (
    !isRecord(snapshot) ||
    snapshot.schemaVersion !== 1 ||
    !Array.isArray(snapshot.requiredDocumentTypes) ||
    !snapshot.requiredDocumentTypes.every(
      (type): type is string => typeof type === "string",
    )
  ) {
    throw new Error("AI verification job contains an invalid policy snapshot.");
  }
  return getEffectiveRequiredDocumentTypes(snapshot.requiredDocumentTypes);
}

export const applicationDocumentLabels: Partial<
  Record<DocumentType, string>
> = {
  CASTE_CERTIFICATE: "ST Certificate",
  INCOME_CERTIFICATE: "Income Certificate",
  IDENTITY_PROOF: "Identity Document",
  MARKSHEET: "Academic Marksheet",
  ADMISSION_PROOF: "Admission or Bonafide Certificate",
  BANK_PROOF: "Bank Account Proof",
  PHOTOGRAPH: "Passport-size Photograph",
};

export function getApplicationDocumentLabel(type: string): string {
  if (!Object.prototype.hasOwnProperty.call(applicationDocumentLabels, type)) {
    return type;
  }
  return applicationDocumentLabels[type as DocumentType] ?? type;
}
