import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  AI_DISPATCH_EXECUTION_BUDGET_MS,
  AI_VERIFICATION_ENDPOINT_PATH,
  AI_VERIFICATION_TIMEOUT_MS,
  AiVerificationAdapterError,
  type AiVerificationInput,
  type AiVerificationResult,
} from "../lib/aiVerificationAdapterCore";
import {
  claimCandidateWithCompareAndSet,
  claimTargetedCandidate,
  classifyDispatchFailure,
  executeClaimedAiVerification,
  getAbandonedClaimFence,
  getDispatchCandidateStaleness,
  getProcessingClaimFence,
  isCurrentProcessingClaim,
  prepareAiVerificationInput,
  projectApplicationDataForCriteria,
  selectAiEligibleDocuments,
  type DispatchCandidate,
  type DispatchDocument,
} from "../lib/aiVerificationDispatcherCore";
import { isAuthorizedInternalBearer } from "../lib/internalServiceAuth";
import {
  createVerificationPolicySnapshot,
  type ScholarshipVerificationPolicyRecord,
} from "../lib/scholarshipVerificationPolicy";
import { requiredApplicationDocumentTypes } from "../lib/applicationRequirements";

const publishedPolicy: ScholarshipVerificationPolicyRecord = {
  id: "policy-1",
  schemeId: "scheme-1",
  version: 4,
  status: "PUBLISHED",
  isSynthetic: false,
  eligibilityCriteria: [
    {
      field: "annual_income",
      operator: "lte",
      value: 250000,
      reason_code: "INCOME_LIMIT",
      explanation: "Income must be within the scheme limit.",
    },
    {
      field: "category",
      operator: "eq",
      value: "ST",
      reason_code: "CATEGORY_MATCH",
      explanation: "Applicant category must match the scheme.",
    },
    {
      field: "academic_level",
      operator: "eq",
      value: "Undergraduate",
      reason_code: "ACADEMIC_LEVEL",
      explanation: "Applicant must be enrolled at an eligible academic level.",
    },
  ],
  requiredDocumentTypes: [...requiredApplicationDocumentTypes],
  aiEligibleDocumentTypes: ["INCOME_CERTIFICATE", "CASTE_CERTIFICATE"],
  officialGuidelineReference: "Official scheme guideline",
  guidelineRevision: "2026-27",
  publishedById: "admin-1",
  publishedAt: new Date("2026-11-06T00:00:00.000Z"),
};

const snapshot = createVerificationPolicySnapshot(publishedPolicy);

const imageDocument = (
  id: string,
  type: string,
  mimeType = "image/png",
): DispatchDocument => ({
  id,
  type,
  mimeType,
});

test("attemptCount fences responses from recovered and newer claims", () => {
  assert.deepEqual(
    getProcessingClaimFence("PROCESSING", candidate.claimAttemptCount),
    { status: "PROCESSING", attemptCount: 1 },
  );
  assert.equal(
    isCurrentProcessingClaim(candidate, {
      status: "FAILED",
      attemptCount: candidate.claimAttemptCount,
    }),
    false,
  );
  assert.equal(
    isCurrentProcessingClaim(candidate, {
      status: "PROCESSING",
      attemptCount: candidate.claimAttemptCount + 1,
    }),
    false,
  );
  assert.equal(
    isCurrentProcessingClaim(candidate, {
      status: "PROCESSING",
      attemptCount: candidate.claimAttemptCount,
    }),
    true,
  );
});

test("abandoned recovery fence is idempotent across repeated invocations", () => {
  const cutoff = new Date("2026-11-06T00:05:00.000Z");
  const fence = getAbandonedClaimFence("PROCESSING", 1, cutoff);
  const state = {
    status: "PROCESSING",
    attemptCount: 1,
    updatedAt: new Date("2026-11-06T00:00:00.000Z"),
  };
  let applicationFailureWrites = 0;
  const recover = () => {
    if (
      state.status !== fence.status ||
      state.attemptCount !== fence.attemptCount ||
      state.updatedAt >= fence.updatedAt.lt
    ) {
      return 0;
    }
    state.status = "FAILED";
    applicationFailureWrites += 1;
    return 1;
  };

  assert.equal(recover(), 1);
  assert.equal(recover(), 0);
  assert.equal(applicationFailureWrites, 1);
});

test("backend timeout and dispatch deadline preserve time for persistence", () => {
  assert.ok(AI_VERIFICATION_TIMEOUT_MS < AI_DISPATCH_EXECUTION_BUDGET_MS);
  assert.ok(AI_DISPATCH_EXECUTION_BUDGET_MS < 120_000);
});

const candidate: DispatchCandidate = {
  jobId: "job-1",
  applicationId: "application-1",
  inputVersion: 3,
  claimAttemptCount: 1,
  applicationStatus: "SUBMITTED",
  applicationInputVersion: 3,
  applicationAiStatus: "WAITING_FOR_CONFIGURATION",
  applicationSchemeId: "scheme-1",
  idempotencyKey: "application-1:3",
  policyId: "policy-1",
  policySnapshot: snapshot,
  applicationData: {
    personal: {
      firstName: "Private Name",
      category: "ST",
      emailAddress: "private@example.test",
      identityNumber: "private-id",
    },
    academic: {
      academicLevel: "Undergraduate",
    },
    family: {
      annualIncome: "180000",
      guardianName: "Private Guardian",
    },
    bank: { accountNumber: "private-account" },
  },
  documents: [
    imageDocument("income-image", "INCOME_CERTIFICATE"),
    imageDocument("caste-image", "CASTE_CERTIFICATE"),
    imageDocument("bank-pdf", "BANK_PROOF", "application/pdf"),
  ],
};

const targetDocumentTimestamp = "2026-11-06T00:00:00.000Z";
const targetedCandidate: DispatchCandidate = {
  ...candidate,
  documents: candidate.documents.map((document) => ({
    ...document,
    updatedAt: targetDocumentTimestamp,
  })),
  documentSnapshot: candidate.documents.map((document) => ({
    id: document.id,
    type: document.type,
    updatedAt: targetDocumentTimestamp,
  })),
};

const adapterResult: AiVerificationResult = {
  applicationId: candidate.applicationId,
  outcome: "ELIGIBLE",
  reasons: [],
  documents: [],
  httpStatus: 200,
};

test("claims a current waiting job with compare-and-set and permits only one concurrent claimant", async () => {
  let status = "WAITING_FOR_CONFIGURATION";
  const compareAndSet = async () => {
    await Promise.resolve();
    if (status !== "WAITING_FOR_CONFIGURATION") return false;
    status = "PROCESSING";
    return true;
  };

  const results = await Promise.all([
    claimCandidateWithCompareAndSet(candidate, compareAndSet),
    claimCandidateWithCompareAndSet(candidate, compareAndSet),
  ]);
  assert.deepEqual(results.sort(), ["already_claimed", "claimed"]);
  assert.equal(status, "PROCESSING");
});

test("targeted claims bind both identifiers and do not claim a different waiting job", async () => {
  let compareAndSetCalls = 0;
  const mismatchedJob = await claimTargetedCandidate(
    "another-job",
    candidate.applicationId,
    targetedCandidate,
    false,
    async () => {
      compareAndSetCalls += 1;
      return true;
    },
  );
  const mismatchedApplication = await claimTargetedCandidate(
    candidate.jobId,
    "another-application",
    targetedCandidate,
    false,
    async () => {
      compareAndSetCalls += 1;
      return true;
    },
  );

  assert.deepEqual(mismatchedJob, { kind: "association_mismatch" });
  assert.deepEqual(mismatchedApplication, { kind: "association_mismatch" });
  assert.equal(compareAndSetCalls, 0);
});

test("targeted stale-version and incomplete-snapshot checks do not mutate or claim the job", async () => {
  const historicalJob = {
    status: "WAITING_FOR_CONFIGURATION",
    attemptCount: 0,
    inputVersion: 1,
  };
  let compareAndSetCalls = 0;
  const stale = await claimTargetedCandidate(
    targetedCandidate.jobId,
    targetedCandidate.applicationId,
    { ...targetedCandidate, applicationInputVersion: 2 },
    false,
    async () => {
      compareAndSetCalls += 1;
      historicalJob.status = "PROCESSING";
      historicalJob.attemptCount += 1;
      return true;
    },
  );
  const missingPolicy = await claimTargetedCandidate(
    targetedCandidate.jobId,
    targetedCandidate.applicationId,
    { ...targetedCandidate, policySnapshot: null },
    false,
    async () => {
      compareAndSetCalls += 1;
      return true;
    },
  );
  const missingDocuments = await claimTargetedCandidate(
    targetedCandidate.jobId,
    targetedCandidate.applicationId,
    { ...targetedCandidate, documentSnapshot: null },
    false,
    async () => {
      compareAndSetCalls += 1;
      return true;
    },
  );

  assert.deepEqual(stale, { kind: "stale", code: "INPUT_VERSION_STALE" });
  assert.deepEqual(missingPolicy, { kind: "invalid", code: "POLICY_SNAPSHOT_MISSING" });
  assert.deepEqual(missingDocuments, { kind: "invalid", code: "DOCUMENT_SNAPSHOT_MISSING" });
  assert.equal(compareAndSetCalls, 0);
  assert.deepEqual(historicalJob, {
    status: "WAITING_FOR_CONFIGURATION",
    attemptCount: 0,
    inputVersion: 1,
  });
});

test("targeted compare-and-set prevents concurrent duplicate processing", async () => {
  let status = "WAITING_FOR_CONFIGURATION";
  const compareAndSet = async () => {
    await Promise.resolve();
    if (status !== "WAITING_FOR_CONFIGURATION") return false;
    status = "PROCESSING";
    return true;
  };
  const results = await Promise.all([
    claimTargetedCandidate(
      targetedCandidate.jobId,
      targetedCandidate.applicationId,
      targetedCandidate,
      false,
      compareAndSet,
    ),
    claimTargetedCandidate(
      targetedCandidate.jobId,
      targetedCandidate.applicationId,
      targetedCandidate,
      false,
      compareAndSet,
    ),
  ]);

  assert.deepEqual(results.map((result) => result.kind).sort(), ["already_claimed", "claimed"]);
  assert.equal(status, "PROCESSING");
});

test("targeted dispatch blocks synthetic jobs in production", async () => {
  let compareAndSetCalls = 0;
  const result = await claimTargetedCandidate(
    targetedCandidate.jobId,
    targetedCandidate.applicationId,
    { ...targetedCandidate, isSynthetic: true },
    true,
    async () => {
      compareAndSetCalls += 1;
      return true;
    },
  );

  assert.deepEqual(result, { kind: "synthetic_blocked" });
  assert.equal(compareAndSetCalls, 0);
});

test("targeted endpoint authenticates callers and never falls back to the global queue for a target", () => {
  const route = readFileSync(
    join(process.cwd(), "app/api/internal/ai-verification/dispatch/route.ts"),
    "utf8",
  );
  const dispatcher = readFileSync(
    join(process.cwd(), "lib/aiVerificationDispatcher.ts"),
    "utf8",
  );
  assert.ok(
    route.indexOf("if (!isAuthorizedInternalBearer") <
      route.indexOf("await dispatchAiVerificationJob"),
  );
  assert.match(route, /status: 401/);
  assert.match(route, /dispatchAiVerificationJob\(target\.jobId, target\.applicationId\)/);
  assert.match(route, /dispatchNextAiVerification\(\)/);
  assert.match(dispatcher, /findFirst\(\{\s*where: \{ id: jobId, applicationId \}/);
  assert.match(dispatcher, /export async function dispatchNextAiVerification/);
  assert.match(dispatcher, /export async function dispatchAiVerificationJob/);
});

test("rejects stale application versions and states before claiming", async () => {
  for (const stale of [
    { ...candidate, applicationInputVersion: 2 },
    { ...candidate, applicationStatus: "REJECTED_BY_AI" },
    { ...candidate, applicationAiStatus: "FAILED" },
  ]) {
    let compareAttempted = false;
    assert.ok(getDispatchCandidateStaleness(stale));
    assert.equal(
      await claimCandidateWithCompareAndSet(stale, async () => {
        compareAttempted = true;
        return true;
      }),
      "stale",
    );
    assert.equal(compareAttempted, false);
  }
});

test("request preparation uses only the job snapshot and projects criterion fields", () => {
  const input = prepareAiVerificationInput(candidate);
  assert.deepEqual(input.criteria, snapshot.eligibilityCriteria);
  assert.deepEqual(input.requiredDocumentTypes, snapshot.requiredDocumentTypes);
  assert.deepEqual(input.aiEligibleDocumentTypes, snapshot.aiEligibleDocumentTypes);
  assert.deepEqual(input.applicationData, {
    annual_income: 180000,
    category: "ST",
    academic_level: "Undergraduate",
  });
  assert.deepEqual(input.documentIds, ["income-image", "caste-image"]);
  assert.equal(input.idempotencyKey, candidate.idempotencyKey);
  assert.equal(AI_VERIFICATION_ENDPOINT_PATH, "/api/v1/verifications");
});

test("AI request sends only policy-selected documents when a scheme requires three types", () => {
  const policySnapshot = createVerificationPolicySnapshot({
    ...publishedPolicy,
    requiredDocumentTypes: [
      "INCOME_CERTIFICATE",
      "CASTE_CERTIFICATE",
      "MARKSHEET",
    ],
    aiEligibleDocumentTypes: [
      "INCOME_CERTIFICATE",
      "CASTE_CERTIFICATE",
    ],
  });
  const input = prepareAiVerificationInput({
    ...candidate,
    policySnapshot,
    documents: [
      imageDocument("income-image", "INCOME_CERTIFICATE"),
      imageDocument("caste-image", "CASTE_CERTIFICATE"),
      imageDocument("marksheet-image", "MARKSHEET"),
    ],
  });

  assert.deepEqual(input.requiredDocumentTypes, [
    "INCOME_CERTIFICATE",
    "CASTE_CERTIFICATE",
    "MARKSHEET",
  ]);
  assert.deepEqual(input.aiEligibleDocumentTypes, [
    "INCOME_CERTIFICATE",
    "CASTE_CERTIFICATE",
  ]);
  assert.deepEqual(input.documentIds, ["income-image", "caste-image"]);
});

test("date criteria require a valid submitted date value", () => {
  const datePolicy = createVerificationPolicySnapshot({
    ...publishedPolicy,
    eligibilityCriteria: [{
      field: "date_of_birth",
      operator: "gte",
      value: "2000-01-01",
      reason_code: "MINIMUM_AGE",
      explanation: "Applicant must meet the age requirement.",
    }],
  });
  assert.deepEqual(
    prepareAiVerificationInput({
      ...candidate,
      policySnapshot: datePolicy,
      applicationData: {
        personal: { dateOfBirth: "2005-08-12" },
      },
    }).applicationData,
    { date_of_birth: "2005-08-12" },
  );
  assert.throws(
    () => prepareAiVerificationInput({
      ...candidate,
      policySnapshot: datePolicy,
      applicationData: { personal: { dateOfBirth: "not-a-date" } },
    }),
    /CRITERION_VALUE_MISSING_OR_INVALID/,
  );
});

test("nested application paths project scalar values under exact criterion fields", () => {
  const projected = projectApplicationDataForCriteria(
    {
      personal: { category: "ST" },
      academic: { institutionName: "Example College" },
    },
    createVerificationPolicySnapshot({
      ...publishedPolicy,
      eligibilityCriteria: [
        {
          field: "category",
          operator: "eq",
          value: "ST",
          reason_code: "CATEGORY_MATCH",
          explanation: "Applicant category must match the scheme.",
        },
        {
          field: "institution_name",
          operator: "eq",
          value: "Example College",
          reason_code: "INSTITUTION_MATCH",
          explanation: "Applicant institution must match the scheme.",
        },
      ],
    }),
  );
  assert.deepEqual(projected, {
    category: "ST",
    institution_name: "Example College",
  });
  assert.ok(Object.values(projected).every((value) =>
    typeof value === "string" || typeof value === "number" || typeof value === "boolean",
  ));
});

test("rejects missing, mismatched, or invalid policy snapshots", () => {
  assert.throws(
    () => prepareAiVerificationInput({ ...candidate, policySnapshot: null }),
    /POLICY_SNAPSHOT_MISSING/,
  );
  assert.throws(
    () => prepareAiVerificationInput({
      ...candidate,
      policySnapshot: { ...snapshot, policyId: "different-policy" },
    }),
    /POLICY_SNAPSHOT_INVALID/,
  );
  assert.throws(
    () => prepareAiVerificationInput({ ...candidate, applicationSchemeId: "other-scheme" }),
    /POLICY_SNAPSHOT_INVALID/,
  );
});

test("document selection excludes manual-only documents and never selects PDFs", () => {
  const selected = selectAiEligibleDocuments(candidate.documents, snapshot);
  assert.deepEqual(
    selected.map((document) => document.id),
    ["income-image", "caste-image"],
  );
  assert.ok(selected.every((document) => document.type !== "BANK_PROOF"));
  assert.ok(selected.every((document) => document.mimeType !== "application/pdf"));
});

test("fails closed when an AI-eligible document is a PDF", () => {
  assert.throws(
    () => selectAiEligibleDocuments(
      [imageDocument("income-pdf", "INCOME_CERTIFICATE", "application/pdf")],
      snapshot,
    ),
    /AI_DOCUMENT_FORMAT_UNSUPPORTED/,
  );
});

test("dispatcher records ambiguous failures without automatically retrying", async () => {
  for (const [error, expectedCode] of [
    [
      new AiVerificationAdapterError("REQUEST_TIMEOUT", "timeout"),
      "REQUEST_TIMEOUT_AMBIGUOUS",
    ],
    [
      new AiVerificationAdapterError("HTTP_FAILURE", "conflict", 409),
      "IDEMPOTENCY_CONFLICT_AMBIGUOUS",
    ],
    [
      new AiVerificationAdapterError("HTTP_FAILURE", "unavailable", 503),
      "HTTP_FAILURE_AMBIGUOUS",
    ],
    [
      new AiVerificationAdapterError("RESPONSE_INVALID", "invalid response", 200),
      "RESPONSE_INVALID_AMBIGUOUS",
    ],
  ] as const) {
    let submitCalls = 0;
    let completeCalls = 0;
    const failures: { code: string; ambiguous: boolean }[] = [];
    const result = await executeClaimedAiVerification(candidate, {
      async submit(_input: AiVerificationInput) {
        submitCalls += 1;
        throw error;
      },
      async complete() {
        completeCalls += 1;
      },
      async fail(_claimed, failure) {
        failures.push(failure);
      },
    });

    assert.deepEqual(result, {
      kind: "failed",
      failure: { code: expectedCode, ambiguous: true },
    });
    assert.equal(submitCalls, 1);
    assert.equal(completeCalls, 0);
    assert.deepEqual(failures, [{ code: expectedCode, ambiguous: true }]);
  }
});

test("failure persistence is called once and ambiguous errors are not resubmitted", async () => {
  let submitCalls = 0;
  let failCalls = 0;
  const result = await executeClaimedAiVerification(candidate, {
    async submit() {
      submitCalls += 1;
      throw new AiVerificationAdapterError("REQUEST_TIMEOUT", "timeout");
    },
    async complete() {
      assert.fail("timed-out responses must not complete");
    },
    async fail(_claimed, failure) {
      failCalls += 1;
      assert.equal(failure.ambiguous, true);
    },
  });
  assert.equal(result.kind, "failed");
  assert.equal(submitCalls, 1);
  assert.equal(failCalls, 1);
});

test("valid synchronous adapter results are persisted through the job completion boundary", async () => {
  let completedOutcome: AiVerificationResult["outcome"] | undefined;
  const result = await executeClaimedAiVerification(candidate, {
    async submit() {
      return adapterResult;
    },
    async complete(_claimed, response) {
      completedOutcome = response.outcome;
    },
    async fail() {
      assert.fail("successful responses must not be marked failed");
    },
  });
  assert.deepEqual(result, { kind: "completed", outcome: "ELIGIBLE" });
  assert.equal(completedOutcome, "ELIGIBLE");
});

test("preparation and cross-application response failures never reach completion", async () => {
  let submitCalls = 0;
  let completeCalls = 0;
  const failures: string[] = [];
  const invalid = await executeClaimedAiVerification(
    { ...candidate, policySnapshot: null },
    {
      async submit() {
        submitCalls += 1;
        return adapterResult;
      },
      async complete() {
        completeCalls += 1;
      },
      async fail(_claimed, failure) {
        failures.push(failure.code);
      },
    },
  );
  assert.deepEqual(invalid, {
    kind: "failed",
    failure: { code: "POLICY_SNAPSHOT_MISSING", ambiguous: false },
  });

  const mismatched = await executeClaimedAiVerification(candidate, {
    async submit() {
      submitCalls += 1;
      return { ...adapterResult, applicationId: "another-application" };
    },
    async complete() {
      completeCalls += 1;
    },
    async fail(_claimed, failure) {
      failures.push(failure.code);
    },
  });
  assert.equal(mismatched.kind, "failed");
  assert.equal(submitCalls, 1);
  assert.equal(completeCalls, 0);
  assert.deepEqual(failures, [
    "POLICY_SNAPSHOT_MISSING",
    "RESPONSE_APPLICATION_MISMATCH",
  ]);
});

test("internal dispatcher authorization requires a sufficiently long bearer secret", () => {
  const token = "test-dispatch-token-with-at-least-32-characters";
  assert.equal(isAuthorizedInternalBearer(`Bearer ${token}`, token), true);
  assert.equal(isAuthorizedInternalBearer(`Bearer ${token}x`, token), false);
  assert.equal(isAuthorizedInternalBearer(token, token), false);
  assert.equal(isAuthorizedInternalBearer(`Bearer ${token}`, "short"), false);
});
