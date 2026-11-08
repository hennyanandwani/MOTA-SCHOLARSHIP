import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { requiredApplicationDocumentTypes } from "../lib/applicationRequirements";
import {
  SUPPORTED_POLICY_DOCUMENT_TYPES,
  assertVerificationPolicyIsEditable,
  buildAiVerificationJobPolicyData,
  createDraftFromPublishedPolicy,
  createVerificationPolicySnapshot,
  getPolicyJobAssessment,
  validateEligibilityCriteria,
  validateVerificationPolicyDraft,
  validateVerificationPolicyForPublication,
  type ScholarshipVerificationPolicyRecord,
} from "../lib/scholarshipVerificationPolicy";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const validPolicyDraft = {
  eligibilityCriteria: [
    {
      field: "annual_income",
      operator: "lte",
      value: 250000,
      reason_code: "INCOME_LIMIT",
      explanation: "Annual family income must not exceed INR 250000.",
    },
    {
      field: "personal.category",
      operator: "eq",
      value: "Scheduled Tribe",
      reason_code: "CATEGORY_MATCH",
      explanation: "Applicant category must match the scheme.",
    },
    {
      field: "academic.academicLevel",
      operator: "in",
      value: ["Post-Matric", "Undergraduate"],
      reason_code: "ACADEMIC_LEVEL",
      explanation: "Applicant must be enrolled at an eligible academic level.",
    },
  ],
  requiredDocumentTypes: [...requiredApplicationDocumentTypes],
  aiEligibleDocumentTypes: ["CASTE_CERTIFICATE", "INCOME_CERTIFICATE"],
  officialGuidelineReference: "Official guideline reference",
  guidelineRevision: "2026-27 revision",
};

const publishedPolicy: ScholarshipVerificationPolicyRecord = {
  id: "policy-1",
  schemeId: "scheme-1",
  version: 3,
  status: "PUBLISHED",
  isSynthetic: false,
  eligibilityCriteria: [
    {
      field: "annual_income",
      operator: "lte",
      value: 250000,
      reason_code: "INCOME_LIMIT",
      explanation: "Annual family income must not exceed INR 250000.",
    },
  ],
  requiredDocumentTypes: [...requiredApplicationDocumentTypes],
  aiEligibleDocumentTypes: ["INCOME_CERTIFICATE"],
  officialGuidelineReference: "Official guideline reference",
  guidelineRevision: "2026-27 revision",
  publishedById: "admin-1",
  publishedAt: new Date("2026-11-05T00:00:00.000Z"),
};

test("validates typed criteria and supported scalar and array operators", () => {
  const result = validateEligibilityCriteria(validPolicyDraft.eligibilityCriteria);
  assert.deepEqual(result, {
    success: true,
    value: validPolicyDraft.eligibilityCriteria,
  });
  assert.equal(validateEligibilityCriteria([
    { field: "personal.dateOfBirth", operator: "gte", value: "2000-01-01" },
  ]).success, true);
  assert.equal(validateEligibilityCriteria([
    { field: "family.annualIncome", operator: "in", value: [100000, 200000] },
  ]).success, true);
  for (const operator of ["ne", "lt", "lte", "gt", "gte"] as const) {
    assert.equal(validateEligibilityCriteria([
      { field: "family.annualIncome", operator, value: 100000 },
    ]).success, true);
  }
  assert.equal(validateEligibilityCriteria([
    { field: "personal.category", operator: "not_in", value: ["ST", "Other"] },
  ]).success, true);
  assert.equal(validateEligibilityCriteria([
    {
      field: "annual_income",
      operator: "lte",
      value: 250000,
      reason_code: "INCOME_LIMIT",
      explanation: "Annual family income must not exceed INR 250000.",
    },
  ], { requirePublicationMetadata: true }).success, true);
});

test("publication requires valid reason codes and non-empty bounded explanations", () => {
  const [complete] = validPolicyDraft.eligibilityCriteria;
  for (const criterion of [
    { ...complete, reason_code: undefined },
    { ...complete, explanation: undefined },
    { ...complete, reason_code: "not-safe" },
    { ...complete, reason_code: "A".repeat(65) },
    { ...complete, explanation: "  " },
    { ...complete, explanation: "x".repeat(1001) },
    { ...complete, extra: "unsupported" },
  ]) {
    assert.equal(
      validateEligibilityCriteria([criterion], {
        requirePublicationMetadata: true,
      }).success,
      false,
    );
    assert.equal(
      validateVerificationPolicyForPublication({
        ...validPolicyDraft,
        eligibilityCriteria: [criterion],
      }).success,
      false,
    );
  }
  assert.equal(
    validateEligibilityCriteria([
      { field: "annual_income", operator: "contains", value: 250000 },
    ]).success,
    false,
  );
  assert.equal(
    validateEligibilityCriteria([
      { field: "annual_income.extra", operator: "lte", value: 250000 },
    ]).success,
    false,
  );
});

test("legacy draft criteria remain valid but cannot be published without metadata", () => {
  const legacyCriterion = {
    field: "family.annualIncome",
    operator: "lte",
    value: 250000,
  };
  assert.equal(validateEligibilityCriteria([legacyCriterion]).success, true);
  assert.equal(validateEligibilityCriteria([legacyCriterion], {
    requirePublicationMetadata: true,
  }).success, false);
  assert.equal(validateVerificationPolicyDraft({
    ...validPolicyDraft,
    eligibilityCriteria: [legacyCriterion],
  }).success, true);
  assert.equal(validateVerificationPolicyForPublication({
    ...validPolicyDraft,
    eligibilityCriteria: [legacyCriterion],
  }).success, false);
});

test("rejects unknown and unsupported operators", () => {
  for (const operator of ["contains", "=", "execute", "eq || true"]) {
    const result = validateEligibilityCriteria([
      { field: "personal.category", operator, value: "ST" },
    ]);
    assert.equal(result.success, false, `accepted operator ${operator}`);
  }
});

test("rejects unknown paths, path expressions, and sensitive fields", () => {
  for (const field of [
    "personal.unknown",
    "personal.category.name",
    "personal.category || true",
    "personal.residentialStatus",
    "bank.accountNumber",
    "personal.identityNumber",
  ]) {
    assert.equal(validateEligibilityCriteria([
      { field, operator: "eq", value: "ST" },
    ]).success, false);
  }
});

test("rejects wrong scalar and array value types and invalid numbers", () => {
  const invalidCriteria = [
    { field: "family.annualIncome", operator: "lte", value: "250000" },
    { field: "personal.category", operator: "eq", value: 12 },
    { field: "personal.category", operator: "eq", value: { $ne: "ST" } },
    { field: "family.annualIncome", operator: "in", value: [1, "2"] },
    { field: "family.annualIncome", operator: "in", value: [] },
    { field: "family.annualIncome", operator: "in", value: [1, 1] },
    { field: "family.annualIncome", operator: "eq", value: Number.NaN },
    { field: "family.annualIncome", operator: "eq", value: Number.POSITIVE_INFINITY },
    { field: "personal.dateOfBirth", operator: "eq", value: "2026-02-31" },
  ];
  for (const criterion of invalidCriteria) {
    assert.equal(validateEligibilityCriteria([criterion]).success, false);
  }
});

test("rejects malformed criteria, arbitrary executable values, and extra fields", () => {
  const invalidValues: unknown[] = [
    null,
    {},
    "family.annualIncome <= 250000",
    [{ field: "family.annualIncome", operator: "lte", value: 1, expression: "x" }],
    [{ field: "family.annualIncome", operator: "lte", value: "process.exit()" }],
    [{ field: "personal.category", operator: "eq", value: "process.exit()" }],
    [{ field: "personal.category", operator: "eq", value: "${process.env.SECRET}" }],
    [{ field: "personal.category", operator: "eq", value: "<script>alert(1)</script>" }],
    [{ field: "family.annualIncome", operator: "lte" }],
  ];
  for (const criteria of invalidValues) {
    assert.equal(validateEligibilityCriteria(criteria).success, false);
  }
});

test("rejects duplicate document types and preserves the configured AI order", () => {
  assert.equal(validateVerificationPolicyDraft({
    ...validPolicyDraft,
    requiredDocumentTypes: ["MARKSHEET", "MARKSHEET"],
  }).success, false);
  assert.equal(validateVerificationPolicyDraft({
    ...validPolicyDraft,
    aiEligibleDocumentTypes: ["MARKSHEET", "MARKSHEET"],
  }).success, false);
  assert.equal(validateVerificationPolicyDraft({
    ...validPolicyDraft,
    requiredDocumentTypes: ["CASTE_CERTIFICATE"],
    aiEligibleDocumentTypes: ["INCOME_CERTIFICATE"],
  }).success, false);

  const ordered = validateVerificationPolicyDraft({
    ...validPolicyDraft,
    aiEligibleDocumentTypes: ["MARKSHEET", "CASTE_CERTIFICATE"],
  });
  assert.equal(ordered.success, true);
  if (ordered.success) {
    assert.deepEqual(ordered.value.aiEligibleDocumentTypes, [
      "MARKSHEET",
      "CASTE_CERTIFICATE",
    ]);
  }
});

test("rejects more than five AI-eligible document types", () => {
  assert.equal(SUPPORTED_POLICY_DOCUMENT_TYPES.length, 7);
  assert.equal(validateVerificationPolicyDraft({
    ...validPolicyDraft,
    aiEligibleDocumentTypes: SUPPORTED_POLICY_DOCUMENT_TYPES.slice(0, 6),
  }).success, false);
});

test("requires a guideline reference and criteria for publication", () => {
  const noReference = validateVerificationPolicyForPublication({
    ...validPolicyDraft,
    officialGuidelineReference: "",
  });
  assert.equal(noReference.success, false);
  if (!noReference.success) {
    assert.ok(noReference.errors.some((error) => /guideline reference/.test(error)));
  }
  assert.equal(validateVerificationPolicyForPublication({
    ...validPolicyDraft,
    eligibilityCriteria: [],
  }).success, false);
  assert.equal(validateVerificationPolicyForPublication(validPolicyDraft).success, true);
});

test("published policies are immutable and can only be edited through a new draft version", () => {
  assert.doesNotThrow(() => assertVerificationPolicyIsEditable("DRAFT"));
  assert.throws(
    () => assertVerificationPolicyIsEditable("PUBLISHED"),
    /immutable; create a new draft version/,
  );
  const draft = createDraftFromPublishedPolicy(publishedPolicy);
  assert.equal(draft.status, "DRAFT");
  assert.equal(draft.version, 4);
  assert.equal(draft.publishedById, null);
  assert.equal(draft.publishedAt, null);
  assert.equal(draft.schemeId, publishedPolicy.schemeId);
  assert.deepEqual(draft.eligibilityCriteria, publishedPolicy.eligibilityCriteria);
  assert.notEqual(draft.eligibilityCriteria, publishedPolicy.eligibilityCriteria);
  assert.throws(
    () => createDraftFromPublishedPolicy({ ...publishedPolicy, status: "DRAFT" }),
    /only be created from a published policy/,
  );
});

test("job snapshots are frozen and legacy jobs remain explicitly unassessed", () => {
  const snapshot = createVerificationPolicySnapshot(publishedPolicy);
  assert.equal(snapshot.policyVersion, 3);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.eligibilityCriteria), true);
  assert.equal(getPolicyJobAssessment(null, null), "LEGACY_UNASSESSED");
  assert.equal(getPolicyJobAssessment("policy-1", snapshot), "POLICY_SNAPSHOT_PRESENT");
  assert.equal(getPolicyJobAssessment("policy-1", null), "POLICY_SNAPSHOT_MISSING");
  assert.equal(getPolicyJobAssessment(null, snapshot), "POLICY_SNAPSHOT_MISSING");
});

test("new AI jobs capture the published policy version and preserve the no-policy legacy path", () => {
  const jobPolicyData = buildAiVerificationJobPolicyData(publishedPolicy);
  assert.equal(jobPolicyData.policyId, publishedPolicy.id);
  assert.equal(jobPolicyData.policySnapshot.policyVersion, publishedPolicy.version);
  assert.equal(jobPolicyData.policySnapshot.policyId, publishedPolicy.id);
  assert.deepEqual(buildAiVerificationJobPolicyData(null), {});

  const submissionRoute = read(
    "app/api/student/applications/[applicationId]/submit/route.ts",
  );
  const retryRoute = read(
    "app/api/admin/applications/[applicationNumber]/ai-review/route.ts",
  );
  for (const route of [submissionRoute, retryRoute]) {
    assert.match(route, /status: "PUBLISHED"/);
    assert.match(route, /orderBy: \{ version: "desc" \}/);
    assert.match(route, /buildAiVerificationJobPolicyData\(publishedPolicy\)/);
    assert.match(route, /\.\.\.policyJobData/);
    assert.match(route, /WAITING_FOR_CONFIGURATION/);
  }
});

test("schemes without policies and existing global document requirements remain supported", () => {
  assert.equal(getPolicyJobAssessment(null, null), "LEGACY_UNASSESSED");
  assert.deepEqual(requiredApplicationDocumentTypes, [
    "CASTE_CERTIFICATE",
    "INCOME_CERTIFICATE",
    "IDENTITY_PROOF",
    "MARKSHEET",
    "ADMISSION_PROOF",
    "BANK_PROOF",
    "PHOTOGRAPH",
  ]);
});

test("legacy jobs without policy association or snapshot are not reclassified", () => {
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /policyId\s+String\?/);
  assert.match(schema, /policySnapshot\s+Json\?/);
  assert.equal(getPolicyJobAssessment(undefined, undefined), "LEGACY_UNASSESSED");
});

test("illustrative localStorage rules are not imported as authoritative policy criteria", () => {
  const validator = read("lib/scholarshipVerificationPolicy.ts");
  const adminRules = read("lib/adminRuleData.ts");
  const ruleEditor = read("components/admin/rules/RuleConfigurationClient.tsx");
  assert.doesNotMatch(validator, /adminRuleData|ADMIN_RULES_STORAGE_KEY|localStorage/);
  assert.match(adminRules, /illustrative scheme ceiling/i);
  assert.match(ruleEditor, /localStorage\.setItem/);
});

test("schema and migration preserve existing schemes and only add nullable job links", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read(
    "prisma/migrations/20261105110000_scholarship_verification_policy/migration.sql",
  );
  assert.match(schema, /model ScholarshipVerificationPolicy/);
  assert.match(schema, /@@unique\(\[schemeId, version\]\)/);
  assert.match(schema, /policy\s+ScholarshipVerificationPolicy\?/);
  assert.match(migration, /"policyId" TEXT/);
  assert.match(migration, /"policySnapshot" JSONB/);
  assert.match(migration, /ON DELETE RESTRICT/);
  assert.doesNotMatch(migration, /UPDATE "ScholarshipApplication"|UPDATE "AiVerificationJob"/);
  assert.doesNotMatch(migration, /INSERT INTO "ScholarshipVerificationPolicy"/);
});
