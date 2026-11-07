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
