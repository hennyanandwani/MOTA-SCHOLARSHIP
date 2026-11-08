import type { VerificationPolicyDraftInput } from "@/lib/scholarshipVerificationPolicy";

export const SYNTHETIC_POLICY_LABEL =
  "SYNTHETIC TEST POLICY — NOT FOR REAL SCHOLARSHIP DECISIONS";

export const SYNTHETIC_REQUIRED_DOCUMENT_TYPES = [
  "INCOME_CERTIFICATE",
  "CASTE_CERTIFICATE",
  "MARKSHEET",
] as const;

export const SYNTHETIC_AI_DOCUMENT_TYPES = [
  "INCOME_CERTIFICATE",
  "CASTE_CERTIFICATE",
  "MARKSHEET",
] as const;

const syntheticPolicyInput: VerificationPolicyDraftInput = {
  eligibilityCriteria: [{
    field: "category",
    operator: "eq",
    value: "Scheduled Tribe",
    reason_code: "SYNTHETIC_TEST_ONLY",
    explanation: "Synthetic-only test criterion, not an eligibility rule.",
  }],
  requiredDocumentTypes: [...SYNTHETIC_REQUIRED_DOCUMENT_TYPES],
  aiEligibleDocumentTypes: [...SYNTHETIC_AI_DOCUMENT_TYPES],
  officialGuidelineReference: "Synthetic test fixture; no official guideline.",
  guidelineRevision: "SYNTHETIC-TEST-ONLY",
};

export function isSyntheticTestSchemeName(name: string): boolean {
  return name.startsWith("E2E-TEST-") || name.startsWith("TEST_PHASE6_");
}

export function canCreateSyntheticPolicy(
  nodeEnvironment: string | undefined,
  schemeName: string,
): boolean {
  return nodeEnvironment === "development" && isSyntheticTestSchemeName(schemeName);
}

export function createSyntheticPolicyInput(): VerificationPolicyDraftInput {
  return structuredClone(syntheticPolicyInput);
}

export function isSyntheticPolicyConfiguration(
  value: VerificationPolicyDraftInput,
): boolean {
  if (
    JSON.stringify(value.requiredDocumentTypes) !==
      JSON.stringify(syntheticPolicyInput.requiredDocumentTypes) ||
    JSON.stringify(value.aiEligibleDocumentTypes) !==
      JSON.stringify(syntheticPolicyInput.aiEligibleDocumentTypes) ||
    value.officialGuidelineReference !==
      syntheticPolicyInput.officialGuidelineReference ||
    value.guidelineRevision !== syntheticPolicyInput.guidelineRevision ||
    !Array.isArray(value.eligibilityCriteria) ||
    value.eligibilityCriteria.length !== 1
  ) {
    return false;
  }
  const criterion = value.eligibilityCriteria[0];
  if (typeof criterion !== "object" || criterion === null || Array.isArray(criterion)) {
    return false;
  }
  const candidate = criterion as Record<string, unknown>;
  return (
    candidate.field === "category" &&
    candidate.operator === "eq" &&
    candidate.value === "Scheduled Tribe" &&
    candidate.reason_code === "SYNTHETIC_TEST_ONLY" &&
    candidate.explanation === "Synthetic-only test criterion, not an eligibility rule." &&
    Object.keys(candidate).length === 5
  );
}

export function syntheticDecisionBlocked(
  currentJobIsSyntheticOrSnapshot: unknown,
): boolean {
  if (currentJobIsSyntheticOrSnapshot === true) return true;
  if (
    typeof currentJobIsSyntheticOrSnapshot === "object" &&
    currentJobIsSyntheticOrSnapshot !== null &&
    "isSynthetic" in currentJobIsSyntheticOrSnapshot
  ) {
    return currentJobIsSyntheticOrSnapshot.isSynthetic === true;
  }
  return false;
}
