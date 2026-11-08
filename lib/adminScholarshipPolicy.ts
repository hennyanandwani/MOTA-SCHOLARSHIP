import {
  createDraftFromPublishedPolicy,
  validateVerificationPolicyDraft,
  validateVerificationPolicyForPublication,
  type ScholarshipVerificationPolicyRecord,
  type ValidationResult,
  type ValidatedPublishedVerificationPolicyDraft,
  type ValidatedVerificationPolicyDraft,
  type VerificationPolicyDraftInput,
} from "@/lib/scholarshipVerificationPolicy";
import type { Prisma } from "@/lib/generated/prisma/client";

const policyInputKeys = new Set([
  "eligibilityCriteria",
  "requiredDocumentTypes",
  "aiEligibleDocumentTypes",
  "officialGuidelineReference",
  "guidelineRevision",
]);

export function parsePolicyMutation(
  body: unknown,
  publish = false,
): ValidationResult<
  ValidatedVerificationPolicyDraft | ValidatedPublishedVerificationPolicyDraft
> {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => !policyInputKeys.has(key)) ||
    [...policyInputKeys].some(
      (key) => !Object.prototype.hasOwnProperty.call(body, key),
    )
  ) {
    return {
      success: false,
      errors: ["Provide all supported verification policy fields and no additional properties."],
    };
  }

  const input = body as VerificationPolicyDraftInput;
  return publish
    ? validateVerificationPolicyForPublication(input)
    : validateVerificationPolicyDraft(input);
}

export function buildDraftPolicyData(
  schemeId: string,
  version: number,
  policy: ValidatedVerificationPolicyDraft,
  isSynthetic = false,
) {
  return {
    schemeId,
    version,
    status: "DRAFT" as const,
    isSynthetic,
    eligibilityCriteria: policy.eligibilityCriteria as Prisma.InputJsonValue,
    requiredDocumentTypes: policy.requiredDocumentTypes,
    aiEligibleDocumentTypes: policy.aiEligibleDocumentTypes,
    officialGuidelineReference: policy.officialGuidelineReference,
    guidelineRevision: policy.guidelineRevision,
  };
}

export function buildPublishedPolicyData(
  policy: ValidatedPublishedVerificationPolicyDraft,
  publisherId: string,
  publishedAt: Date,
) {
  return {
    eligibilityCriteria: policy.eligibilityCriteria as Prisma.InputJsonValue,
    requiredDocumentTypes: policy.requiredDocumentTypes,
    aiEligibleDocumentTypes: policy.aiEligibleDocumentTypes,
    officialGuidelineReference: policy.officialGuidelineReference,
    guidelineRevision: policy.guidelineRevision,
    status: "PUBLISHED" as const,
    publishedById: publisherId,
    publishedAt,
  };
}

export function buildUpdatedDraftPolicyData(
  policy: ValidatedVerificationPolicyDraft,
) {
  return {
    eligibilityCriteria: policy.eligibilityCriteria as Prisma.InputJsonValue,
    requiredDocumentTypes: policy.requiredDocumentTypes,
    aiEligibleDocumentTypes: policy.aiEligibleDocumentTypes,
    officialGuidelineReference: policy.officialGuidelineReference,
    guidelineRevision: policy.guidelineRevision,
  };
}

export function buildNewDraftVersionData(
  source: ScholarshipVerificationPolicyRecord,
  nextVersion: number,
) {
  return {
    ...createDraftFromPublishedPolicy(source),
    version: nextVersion,
    eligibilityCriteria: source.eligibilityCriteria as Prisma.InputJsonValue,
  };
}

export function isPolicyWriteConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2002" || error.code === "P2034")
  );
}
