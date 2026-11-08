import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  assertVerificationPolicyIsEditable,
  validateVerificationPolicyDraft,
  validateVerificationPolicyForPublication,
  type EligibilityCriterion,
  type ScholarshipVerificationPolicyRecord,
} from "../lib/scholarshipVerificationPolicy";
import {
  buildDraftPolicyData,
  buildNewDraftVersionData,
  buildPublishedPolicyData,
  buildUpdatedDraftPolicyData,
  parsePolicyMutation,
} from "../lib/adminScholarshipPolicy";
import {
  SYNTHETIC_POLICY_LABEL,
  SYNTHETIC_AI_DOCUMENT_TYPES,
  SYNTHETIC_REQUIRED_DOCUMENT_TYPES,
  canCreateSyntheticPolicy,
  createSyntheticPolicyInput,
  isSyntheticPolicyConfiguration,
} from "../lib/syntheticVerificationPolicy";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const validPayload = {
  eligibilityCriteria: [{
    field: "annual_income",
    operator: "lte",
    value: 250000,
    reason_code: "INCOME_LIMIT",
    explanation: "Annual family income must not exceed INR 250000.",
  } satisfies EligibilityCriterion],
  requiredDocumentTypes: ["INCOME_CERTIFICATE", "IDENTITY_PROOF"],
  aiEligibleDocumentTypes: ["INCOME_CERTIFICATE"],
  officialGuidelineReference: "https://example.gov/scheme-guidelines",
  guidelineRevision: "2026-27",
};

const publishedRecord: ScholarshipVerificationPolicyRecord = {
  id: "policy-2",
  schemeId: "scheme-1",
  version: 2,
  status: "PUBLISHED",
  isSynthetic: false,
  eligibilityCriteria: validPayload.eligibilityCriteria,
  requiredDocumentTypes: ["INCOME_CERTIFICATE", "IDENTITY_PROOF"],
  aiEligibleDocumentTypes: ["INCOME_CERTIFICATE"],
  officialGuidelineReference: validPayload.officialGuidelineReference,
  guidelineRevision: validPayload.guidelineRevision,
  publishedById: "admin-1",
  publishedAt: new Date("2026-11-05T00:00:00.000Z"),
};

test("policy mutation accepts valid drafts and produces persisted draft/update data", () => {
  const parsed = parsePolicyMutation(validPayload);
  assert.equal(parsed.success, true);
  if (!parsed.success) return;

  const created = buildDraftPolicyData("scheme-1", 1, parsed.value);
  assert.equal(created.status, "DRAFT");
  assert.equal(created.version, 1);
  assert.equal(created.schemeId, "scheme-1");

  const updated = buildUpdatedDraftPolicyData(parsed.value);
  assert.deepEqual(updated.requiredDocumentTypes, ["INCOME_CERTIFICATE", "IDENTITY_PROOF"]);
  assert.deepEqual(updated.aiEligibleDocumentTypes, ["INCOME_CERTIFICATE"]);
});

test("rejects malformed, unsupported and invalid policy input before persistence", () => {
  assert.equal(parsePolicyMutation({ ...validPayload, status: "PUBLISHED" }).success, false);
  assert.equal(parsePolicyMutation({ ...validPayload, criteria: [] }).success, false);
  assert.equal(parsePolicyMutation({
    ...validPayload,
    eligibilityCriteria: [{ ...validPayload.eligibilityCriteria[0], operator: "contains" }],
  }).success, false);
  assert.equal(validateVerificationPolicyDraft({
    ...validPayload,
    aiEligibleDocumentTypes: ["PHOTOGRAPH"],
  }).success, false);
});

test("publication requires guideline, criteria metadata and required document configuration", () => {
  assert.equal(validateVerificationPolicyForPublication({
    ...validPayload,
    officialGuidelineReference: "",
  }).success, false);
  assert.equal(validateVerificationPolicyForPublication({
    ...validPayload,
    requiredDocumentTypes: [],
    aiEligibleDocumentTypes: [],
  }).success, false);
  assert.equal(validateVerificationPolicyForPublication(validPayload).success, true);
});

test("published policies cannot be edited and publisher metadata comes from the server", () => {
  assert.throws(() => assertVerificationPolicyIsEditable("PUBLISHED"), /immutable/);
  const parsed = validateVerificationPolicyForPublication(validPayload);
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  const published = buildPublishedPolicyData(
    parsed.value,
    "authenticated-admin-id",
    new Date("2026-11-05T01:00:00.000Z"),
  );
  assert.equal(published.status, "PUBLISHED");
  assert.equal(published.publishedById, "authenticated-admin-id");
  assert.equal(published.publishedAt.toISOString(), "2026-11-05T01:00:00.000Z");
});

test("new draft versions copy published configuration without changing the source", () => {
  const draft = buildNewDraftVersionData(publishedRecord, 5);
  assert.equal(draft.status, "DRAFT");
  assert.equal(draft.version, 5);
  assert.equal(draft.schemeId, publishedRecord.schemeId);
  assert.equal(draft.publishedById, null);
  assert.equal(draft.publishedAt, null);
  assert.deepEqual(draft.eligibilityCriteria, publishedRecord.eligibilityCriteria);
  assert.deepEqual(draft.aiEligibleDocumentTypes, publishedRecord.aiEligibleDocumentTypes);
});

test("document constraints reject duplicate and more-than-five AI document selections", () => {
  assert.equal(validateVerificationPolicyDraft({
    ...validPayload,
    requiredDocumentTypes: ["INCOME_CERTIFICATE", "INCOME_CERTIFICATE"],
  }).success, false);
  assert.equal(validateVerificationPolicyDraft({
    ...validPayload,
    requiredDocumentTypes: [
      "CASTE_CERTIFICATE",
      "INCOME_CERTIFICATE",
      "IDENTITY_PROOF",
      "MARKSHEET",
      "ADMISSION_PROOF",
      "BANK_PROOF",
    ],
    aiEligibleDocumentTypes: [
      "CASTE_CERTIFICATE",
      "INCOME_CERTIFICATE",
      "IDENTITY_PROOF",
      "MARKSHEET",
      "ADMISSION_PROOF",
      "BANK_PROOF",
    ],
  }).success, false);
});

test("all policy endpoints require admin authorization and legacy schemes stay optional", () => {
  const routeFiles = [
    "app/api/admin/schemes/[schemeId]/verification-policies/route.ts",
    "app/api/admin/schemes/[schemeId]/verification-policies/[policyId]/route.ts",
    "app/api/admin/schemes/[schemeId]/verification-policies/[policyId]/publish/route.ts",
    "app/api/admin/schemes/[schemeId]/verification-policies/[policyId]/versions/route.ts",
  ];
  for (const path of routeFiles) {
    const source = read(path);
    assert.match(source, /requireAdmin/);
    assert.match(source, /if \(auth\.response\) return auth\.response/);
  }
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /verificationPolicies ScholarshipVerificationPolicy\[\]/);
  assert.match(schema, /policyId\s+String\?/);
  const schemeUi = read("components/admin/schemes/DatabaseSchemeManagement.tsx");
  const policyUi = read("components/admin/schemes/ScholarshipPolicyManagement.tsx");
  assert.match(schemeUi, /ScholarshipPolicyDisclosure/);
  assert.match(policyUi, /api\/admin\/schemes\/\$\{encodeURIComponent\(schemeId\)\}\/verification-policies/);
  assert.doesNotMatch(policyUi, /localStorage/);
});

test("synthetic policy fixtures are fixed, structurally validated, and development-only", () => {
  const fixture = createSyntheticPolicyInput();
  const validation = validateVerificationPolicyForPublication(fixture);
  if (!validation.success) throw new Error("Synthetic policy fixture is invalid.");
  const createdPolicy = buildDraftPolicyData(
    "synthetic-e2e-scheme",
    1,
    validation.value,
    true,
  );
  const expectedDocumentTypes = [
    "INCOME_CERTIFICATE",
    "CASTE_CERTIFICATE",
    "MARKSHEET",
  ];
  assert.equal(validation.success, true);
  assert.deepEqual(SYNTHETIC_REQUIRED_DOCUMENT_TYPES, expectedDocumentTypes);
  assert.deepEqual(SYNTHETIC_AI_DOCUMENT_TYPES, expectedDocumentTypes);
  assert.deepEqual(fixture.requiredDocumentTypes, expectedDocumentTypes);
  assert.deepEqual(fixture.aiEligibleDocumentTypes, expectedDocumentTypes);
  assert.equal(validation.value.eligibilityCriteria[0].field, "category");
  assert.equal(validation.value.eligibilityCriteria[0].value, "Scheduled Tribe");
  assert.equal(validation.value.eligibilityCriteria[0].reason_code, "SYNTHETIC_TEST_ONLY");
  assert.equal(createdPolicy.isSynthetic, true);
  assert.deepEqual(createdPolicy.requiredDocumentTypes, expectedDocumentTypes);
  assert.deepEqual(createdPolicy.aiEligibleDocumentTypes, expectedDocumentTypes);
  assert.equal(isSyntheticPolicyConfiguration(fixture), true);
  assert.equal(canCreateSyntheticPolicy("development", "E2E-TEST-SCHOLARSHIP"), true);
  assert.equal(canCreateSyntheticPolicy("production", "E2E-TEST-SCHOLARSHIP"), false);
  assert.equal(canCreateSyntheticPolicy("development", "REAL-SCHOLARSHIP"), false);
  assert.match(SYNTHETIC_POLICY_LABEL, /NOT FOR REAL SCHOLARSHIP DECISIONS/);
  const altered = {
    ...fixture,
    eligibilityCriteria: [{
      field: "category",
      operator: "eq",
      value: "Other",
      reason_code: "CATEGORY_MATCH",
      explanation: "Not the synthetic fixture.",
    }],
  };
  assert.equal(isSyntheticPolicyConfiguration(altered), false);

  const testPolicyRoute = read("app/api/admin/schemes/[schemeId]/verification-policies/test-policy/route.ts");
  assert.match(testPolicyRoute, /requireAdmin/);
  assert.match(testPolicyRoute, /process\.env\.NODE_ENV !== "development"/);
  assert.match(testPolicyRoute, /validateVerificationPolicyForPublication/);
  assert.match(testPolicyRoute, /createSyntheticPolicyInput/);
  assert.match(testPolicyRoute, /validation\.value,\s*true/);
  const publishRoute = read("app/api/admin/schemes/[schemeId]/verification-policies/[policyId]/publish/route.ts");
  assert.match(publishRoute, /OFFICIAL_POLICY_EXISTS/);
  assert.match(read("app/api/student/applications/[applicationId]/submit/route.ts"), /SYNTHETIC_POLICY_BLOCKED/);
  assert.match(read("app/api/admin/applications/[applicationNumber]/ai-review/route.ts"), /SYNTHETIC_POLICY_BLOCKED/);
  const policyRoute = read("app/api/admin/schemes/[schemeId]/verification-policies/[policyId]/route.ts");
  assert.match(policyRoute, /current\.isSynthetic/);
  assert.match(policyRoute, /SYNTHETIC_POLICY_IMMUTABLE/);
  assert.match(read("app/admin/schemes/page.tsx"), /process\.env\.NODE_ENV === 'development'/);
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /isSynthetic\s+Boolean\s+@default\(false\)/);
});
