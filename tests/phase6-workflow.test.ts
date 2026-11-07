import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { requiredApplicationDocumentTypes } from "../lib/applicationRequirements";
import {
  aiIntegrationReadiness,
  buildAiJobIdempotencyKey,
  getStudentSafeAiReason,
  parseAiVerificationCallback,
  verifyAiCallbackSignature,
} from "../lib/aiVerificationContract";
import { canResubmitAfterAiRejection } from "../lib/applicationSubmission";
import {
  canTransitionApproval,
  getSelectionTransitionFailure,
  getStudentAiReason,
  getStudentAiStatusLabel,
} from "../lib/phase6Workflow";
import { isAiOutcomeAvailableForManualReview } from "../lib/adminWorkflow";
import { mapAiOutcomeToApplication } from "../lib/aiVerificationDispatcherCore";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const verifiedDocuments = requiredApplicationDocumentTypes.map((type) => ({
  type,
  verificationStatus: "VERIFIED",
}));

const validCallback = {
  contractVersion: 1,
  jobId: "job-1",
  idempotencyKey: "application-1:1",
  inputVersion: 1,
  outcome: "ELIGIBLE",
  explanation: "The submitted documents meet the configured checks.",
  studentReasonCode: null,
  modelVersion: "configured-model-version",
  confidence: 90,
  documentResults: [{ documentId: "document-1", outcome: "VALID", explanation: null }],
};

test("AI jobs use deterministic per-application input-version idempotency keys", () => {
  assert.equal(buildAiJobIdempotencyKey("application-1", 1), "application-1:1");
  assert.notEqual(
    buildAiJobIdempotencyKey("application-1", 1),
    buildAiJobIdempotencyKey("application-1", 2),
  );
  assert.throws(() => buildAiJobIdempotencyKey("", 1), /valid application ID/);
});

test("AI callback parser validates outcomes, explanations, versions, and document IDs", () => {
  assert.deepEqual(parseAiVerificationCallback(validCallback), validCallback);
  assert.equal(
    parseAiVerificationCallback({ ...validCallback, contractVersion: 2 }),
    null,
  );
  assert.equal(
    parseAiVerificationCallback({ ...validCallback, outcome: "APPROVED" }),
    null,
  );
  assert.equal(
    parseAiVerificationCallback({
      ...validCallback,
      outcome: "INELIGIBLE",
      studentReasonCode: null,
    }),
    null,
  );
  assert.equal(
    parseAiVerificationCallback({
      ...validCallback,
      outcome: "INELIGIBLE",
      studentReasonCode: "internal trace with private context",
    }),
    null,
  );
  assert.equal(
    parseAiVerificationCallback({
      ...validCallback,
      documentResults: [
        { documentId: "duplicate", outcome: "VALID" },
        { documentId: "duplicate", outcome: "INVALID" },
      ],
    }),
    null,
  );
});

test("AI callback authentication validates HMAC and timestamp freshness", () => {
  const secret = "local-test-secret";
  const timestamp = "1700000000";
  const rawBody = JSON.stringify(validCallback);
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const base = { secret, timestamp, rawBody, signature, nowMilliseconds: 1_700_000_000_000 };

  assert.equal(verifyAiCallbackSignature(base), true);
  assert.equal(verifyAiCallbackSignature({ ...base, signature: "0".repeat(64) }), false);
  assert.equal(verifyAiCallbackSignature({ ...base, nowMilliseconds: 1_700_000_600_000 }), false);
  assert.equal(aiIntegrationReadiness({}).adapterImplemented, false);
  assert.equal(aiIntegrationReadiness({
    FELLOWSHIFT_AI_CONTRACT_VERSION: "1",
    FELLOWSHIFT_AI_SERVICE_URL: "https://service.invalid",
    FELLOWSHIFT_AI_SERVICE_TOKEN: "test",
    AI_VERIFICATION_CALLBACK_SECRET: "test",
  }).configured, false);
});

test("manual queue includes eligible and explicitly escalated AI outcomes", () => {
  const source = read("app/admin/verification/page.tsx");
  assert.match(source, /isAiOutcomeAvailableForManualReview/);
  assert.match(source, /AI outcomes and service exceptions/);
  assert.match(source, /Failed or unavailable AI checks are not interpreted as ineligibility/);
});

test("legacy callbacks are authenticated but cannot apply asynchronous outcomes", () => {
  const source = read("app/api/integrations/ai-verification/callback/route.ts");
  assert.match(source, /verifyAiCallbackSignature/);
  assert.match(source, /status: 410/);
  assert.doesNotMatch(source, /scholarshipApplication\.update/);
  assert.doesNotMatch(source, /ApplicationStatus\.REJECTED_BY_AI/);
});

test("technical AI retries do not increment the ineligibility count", () => {
  const source = read("app/api/admin/applications/[applicationNumber]/ai-review/route.ts");
  assert.match(source, /requireAdmin\(\)/);
  assert.match(source, /AiVerificationStatus\.FAILED/);
  assert.match(source, /aiInputVersion: nextVersion/);
  assert.match(source, /aiVerificationJob\.create/);
  assert.match(source, /requestedById: auth\.user\.id/);
  assert.doesNotMatch(source, /aiAttemptCount:\s*\{\s*increment/);
  assert.match(source, /no request was sent/);
});

test("selection requires AI eligibility, complete manual review, all verified documents, and fresh expected state", () => {
  const base = {
    applicationStatus: "RECOMMENDED_FOR_APPROVAL",
    submittedAt: "2026-11-04T00:00:00.000Z",
    aiStatus: "ELIGIBLE" as const,
    aiAttemptCount: 0,
    manualReviewStatus: "VERIFIED" as const,
    documents: verifiedDocuments,
    requiredDocumentTypes: requiredApplicationDocumentTypes,
    currentOutcome: null,
    expectedOutcome: null,
    nextOutcome: "SELECTED" as const,
    currentApproval: null,
  };
  assert.equal(getSelectionTransitionFailure(base), null);
  assert.equal(isAiOutcomeAvailableForManualReview("NEEDS_ATTENTION", 0), true);
  assert.equal(isAiOutcomeAvailableForManualReview("INELIGIBLE", 3), false);
  assert.equal(isAiOutcomeAvailableForManualReview("INELIGIBLE", 4), true);
  assert.equal(getSelectionTransitionFailure({
    ...base,
    aiStatus: "NEEDS_ATTENTION",
  }), null);
  assert.equal(getSelectionTransitionFailure({
    ...base,
    aiStatus: "INELIGIBLE",
    aiAttemptCount: 4,
  }), null);
  assert.match(
    getSelectionTransitionFailure({ ...base, aiStatus: "FAILED" }) ?? "",
    /AI eligibility/,
  );
  assert.match(
    getSelectionTransitionFailure({ ...base, manualReviewStatus: "IN_PROGRESS" }) ?? "",
    /manual verification/,
  );
  assert.match(
    getSelectionTransitionFailure({ ...base, documents: [] }) ?? "",
    /documents must be verified/,
  );
  assert.match(
    getSelectionTransitionFailure({ ...base, currentOutcome: "WAITLISTED" }) ?? "",
    /Selection changed/,
  );
  assert.match(
    getSelectionTransitionFailure({ ...base, currentApproval: "PENDING_APPROVAL" }) ?? "",
    /not allowed/,
  );
});

test("synchronous outcomes count only actual ineligibility and escalate the fourth result", () => {
  assert.deepEqual(mapAiOutcomeToApplication("ELIGIBLE", 0), {
    rejectionCount: 0,
    manualReviewRequired: false,
    aiVerificationStatus: "ELIGIBLE",
    aiEligibility: true,
    applicationStatus: "SUBMITTED",
    manualReviewStatus: "PENDING",
    studentAiReason: null,
  });
  for (const rejectionCount of [1, 2, 3]) {
    const mapped = mapAiOutcomeToApplication("INELIGIBLE", rejectionCount - 1);
    assert.equal(mapped.rejectionCount, rejectionCount);
    assert.equal(mapped.manualReviewRequired, false);
    assert.equal(mapped.applicationStatus, "SUBMITTED");
    assert.equal(mapped.manualReviewStatus, "NOT_READY");
  }
  const fourth = mapAiOutcomeToApplication("INELIGIBLE", 3);
  assert.equal(fourth.rejectionCount, 4);
  assert.equal(fourth.manualReviewRequired, true);
  assert.equal(fourth.applicationStatus, "FLAGGED_FOR_MANUAL_REVIEW");
  assert.equal(fourth.manualReviewStatus, "PENDING");

  const needsReview = mapAiOutcomeToApplication("NEEDS_REVIEW", 2);
  assert.equal(needsReview.rejectionCount, 2);
  assert.equal(needsReview.aiVerificationStatus, "NEEDS_ATTENTION");
  assert.equal(needsReview.manualReviewRequired, true);
  assert.equal(needsReview.applicationStatus, "FLAGGED_FOR_MANUAL_REVIEW");

  const failed = mapAiOutcomeToApplication("FAILED", 2);
  assert.equal(failed.rejectionCount, 2);
  assert.equal(failed.manualReviewRequired, false);
  assert.equal(failed.aiVerificationStatus, "FAILED");
});

test("student resubmission requires a fresh correction and a completed current ineligible job", () => {
  const completedAt = new Date("2026-11-06T10:00:00.000Z");
  const base = {
    applicationStatus: "SUBMITTED",
    aiVerificationStatus: "INELIGIBLE",
    aiAttemptCount: 3,
    aiInputVersion: 3,
    latestJob: {
      inputVersion: 3,
      status: "COMPLETED",
      outcome: "INELIGIBLE",
      completedAt,
    },
    correctedDocumentUpdatedAt: new Date("2026-11-06T10:01:00.000Z"),
  };
  assert.equal(canResubmitAfterAiRejection(base), true);
  assert.equal(canResubmitAfterAiRejection({
    ...base,
    aiAttemptCount: 4,
  }), false);
  assert.equal(canResubmitAfterAiRejection({
    ...base,
    correctedDocumentUpdatedAt: completedAt,
  }), false);
  assert.equal(canResubmitAfterAiRejection({
    ...base,
    latestJob: { ...base.latestJob, inputVersion: 2 },
  }), false);
  const submitSource = read("app/api/student/applications/[applicationId]/submit/route.ts");
  assert.match(submitSource, /canResubmitAfterAiRejection/);
  assert.match(submitSource, /aiInputVersion: nextVersion/);
  assert.match(submitSource, /buildAiVerificationJobPolicyData\(publishedPolicy\)/);
  const uploadSource = read("app/api/student/applications/[applicationId]/documents/route.ts");
  assert.match(uploadSource, /isCorrectionAllowed/);
  assert.match(uploadSource, /aiAttemptCount: application\.aiAttemptCount/);
  const detailPage = read("app/student/applications/[applicationId]/page.tsx");
  assert.match(detailPage, /AiCorrectionForm/);
});

test("dispatcher result writes remain claim-fenced and version-guarded", () => {
  const source = read("lib/aiVerificationDispatcher.ts");
  assert.match(source, /claimAttemptCount/);
  assert.match(source, /getProcessingClaimFence/);
  assert.match(source, /aiInputVersion: candidate\.inputVersion/);
  assert.match(source, /aiAttemptCount: application\.aiAttemptCount/);
  assert.match(source, /TransactionIsolationLevel\.Serializable/);
});

test("selection endpoint writes actor history and pending approval atomically", () => {
  const source = read("app/api/admin/applications/[applicationNumber]/selection/route.ts");
  assert.match(source, /requireAdmin\(\)/);
  assert.match(source, /applicationSelectionDecision\.create/);
  assert.match(source, /applicationApprovalDecision\.create/);
  assert.match(source, /status: "PENDING_APPROVAL"/);
  assert.match(source, /TransactionIsolationLevel\.Serializable/);
  assert.match(source, /expectedOutcome/);
});

test("only explicit approvers can transition approval state", () => {
  assert.equal(canTransitionApproval("PENDING_APPROVAL", "APPROVED"), true);
  assert.equal(canTransitionApproval("PENDING_APPROVAL", "RETURNED_FOR_REVIEW"), true);
  assert.equal(canTransitionApproval("RETURNED_FOR_REVIEW", "PENDING_APPROVAL"), true);
  assert.equal(canTransitionApproval("APPROVED", "PENDING_APPROVAL"), false);
  const source = read("app/api/approver/applications/[applicationNumber]/approval/route.ts");
  assert.match(source, /requireApprover\(\)/);
  assert.match(source, /actorType: ApplicationApprovalActorType\.APPROVER/);
  assert.match(source, /SelectionOutcome\.SELECTED/);
  assert.match(source, /ApplicationApprovalDecision\.create|applicationApprovalDecision\.create/);
});

test("document verification events are persisted in the same transaction as status changes", () => {
  const source = read("app/api/admin/applications/[applicationNumber]/documents/[documentId]/route.ts");
  assert.match(source, /isAiOutcomeAvailableForManualReview/);
  assert.match(source, /applicationDocumentVerificationEvent\.create/);
  assert.match(source, /reviewerId: auth\.user\.id/);
  assert.match(source, /TransactionIsolationLevel\.Serializable/);
  const migration = read("prisma/migrations/20261104130000_phase6_review_selection_ai/migration.sql");
  assert.match(migration, /BEFORE UPDATE OR DELETE ON "ApplicationDocumentVerificationEvent"/);
});

test("student AI status shows only a student-safe reason for ineligibility", () => {
  assert.equal(
    getStudentSafeAiReason("MISSING_DOCUMENT"),
    "One or more required documents were missing.",
  );
  assert.equal(getStudentAiReason("INELIGIBLE", "A supporting record is missing."), "A supporting record is missing.");
  assert.equal(getStudentAiReason("FAILED", "Private processing error"), null);
  assert.match(getStudentAiStatusLabel("FAILED"), /needs attention/);
  const page = read("app/student/applications/[applicationId]/page.tsx");
  assert.match(page, /getStudentAiReason/);
  assert.match(page, /selectionDecisions/);
  assert.match(page, /approvalDecisions/);
  assert.doesNotMatch(page, /aiExplanation|storagePath|verificationRemarks/);
});

test("submission transaction stores one pending AI job only after validated submission", () => {
  const source = read("app/api/student/applications/[applicationId]/submit/route.ts");
  assert.match(source, /getSubmissionValidationFailure/);
  assert.match(source, /status: ApplicationStatus\.SUBMITTED/);
  assert.match(source, /aiVerificationJob\.create/);
  assert.match(source, /buildAiJobIdempotencyKey/);
  assert.match(source, /WAITING_FOR_CONFIGURATION/);
  assert.doesNotMatch(source, /fetch\(/);
});

test("migration preserves existing statuses and defaults historical records to unknown AI state", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20261104130000_phase6_review_selection_ai/migration.sql");
  assert.match(schema, /REJECTED_BY_AI/);
  assert.match(schema, /role\s+UserRole\s+@default\(STUDENT\)/);
  assert.match(migration, /DEFAULT 'NOT_REQUESTED'/);
  assert.match(migration, /DEFAULT 'NOT_READY'/);
  assert.match(migration, /CREATE TRIGGER "ApplicationSelectionDecision_append_only"/);
  assert.match(migration, /CREATE TRIGGER "ApplicationApprovalDecision_append_only"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
});
