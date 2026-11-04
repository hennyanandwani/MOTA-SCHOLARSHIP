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
