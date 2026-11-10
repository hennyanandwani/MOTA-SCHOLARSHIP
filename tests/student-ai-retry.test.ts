import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { buildAiJobIdempotencyKey } from "../lib/aiVerificationContract";
import {
  decrementStudentAiRetryCountdown,
  getStudentAiRetryButtonLabel,
  isRetryableTechnicalFailure,
  STUDENT_AI_RETRY_COOLDOWN_SECONDS,
} from "../lib/studentAiRetry";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

function failedAttempt(
  lastErrorCode: string,
  overrides: Partial<Parameters<typeof isRetryableTechnicalFailure>[0]> = {},
) {
  return isRetryableTechnicalFailure({
    verificationStatus: "FAILED",
    currentInputVersion: 4,
    jobInputVersion: 4,
    jobStatus: "FAILED",
    jobOutcome: null,
    lastErrorCode,
    ...overrides,
  });
}

test("student retry cooldown counts down from 15 seconds and enables at zero", () => {
  assert.equal(STUDENT_AI_RETRY_COOLDOWN_SECONDS, 15);
  assert.equal(getStudentAiRetryButtonLabel(15), "Retry in 15s");
  assert.equal(getStudentAiRetryButtonLabel(1), "Retry in 1s");
  assert.equal(getStudentAiRetryButtonLabel(0), "Retry Verification");
  assert.equal(getStudentAiRetryButtonLabel(null), "Retry Verification");
  let seconds: number | null = STUDENT_AI_RETRY_COOLDOWN_SECONDS;
  for (let remaining = 14; remaining >= 0; remaining -= 1) {
    seconds = decrementStudentAiRetryCountdown(seconds);
    assert.equal(seconds, remaining);
  }
  assert.equal(decrementStudentAiRetryCountdown(null), null);
});

test("only current technical failures are retryable, never business outcomes", () => {
  for (const code of [
    "SERVICE_REPORTED_FAILURE",
    "REQUEST_TIMEOUT_AMBIGUOUS",
    "NETWORK_FAILURE_AMBIGUOUS",
    "HTTP_FAILURE_AMBIGUOUS",
    "RESPONSE_INVALID_AMBIGUOUS",
    "DISPATCH_UNEXPECTED_FAILURE",
    "ADAPTER_EXECUTION_TIMEOUT",
    "ADAPTER_STORAGE_ACCESS",
  ]) {
    assert.equal(failedAttempt(code), true, `${code} should permit a manual retry`);
  }

  for (const outcome of ["ELIGIBLE", "INELIGIBLE", "NEEDS_ATTENTION"]) {
    assert.equal(
      failedAttempt("SERVICE_REPORTED_FAILURE", { jobOutcome: outcome }),
      false,
      `${outcome} is a business outcome`,
    );
  }
  assert.equal(failedAttempt("CRITERION_DATA_MISSING"), false);
  assert.equal(failedAttempt("ADAPTER_CONFIGURATION_MISSING"), false);
  assert.equal(failedAttempt("SERVICE_REPORTED_FAILURE", { jobInputVersion: 3 }), false);
  assert.equal(failedAttempt("SERVICE_REPORTED_FAILURE", { jobStatus: "COMPLETED" }), false);
  assert.equal(failedAttempt("SERVICE_REPORTED_FAILURE", { verificationStatus: "NEEDS_ATTENTION" }), false);
});

test("repeated manual retries use fresh versioned idempotency keys", () => {
  const firstVersion = 4;
  const secondVersion = firstVersion + 1;
  const thirdVersion = secondVersion + 1;
  assert.notEqual(
    buildAiJobIdempotencyKey("application-1", secondVersion),
    buildAiJobIdempotencyKey("application-1", thirdVersion),
  );
  assert.equal(failedAttempt("SERVICE_REPORTED_FAILURE"), true);
  assert.equal(
    isRetryableTechnicalFailure({
      verificationStatus: "WAITING_FOR_CONFIGURATION",
      currentInputVersion: secondVersion,
      jobInputVersion: secondVersion,
      jobStatus: "WAITING_FOR_CONFIGURATION",
      jobOutcome: null,
      lastErrorCode: null,
    }),
    false,
  );
  assert.equal(
    isRetryableTechnicalFailure({
      verificationStatus: "FAILED",
      currentInputVersion: thirdVersion,
      jobInputVersion: thirdVersion,
      jobStatus: "FAILED",
      jobOutcome: "FAILED",
      lastErrorCode: "NETWORK_FAILURE_AMBIGUOUS",
    }),
    true,
  );
});

test("student retry is owner-authorized, race guarded, versioned, snapshotted, and dispatched", () => {
  const route = read("app/api/student/applications/[applicationId]/ai-retry/route.ts");
  assert.match(route, /requireStudent\(\)/);
  assert.match(route, /studentId:\s*auth\.user\.student\.id/);
  assert.match(route, /status:\s*ApplicationStatus\.SUBMITTED/);
  assert.match(route, /aiVerificationStatus:\s*AiVerificationStatus\.FAILED/);
  assert.match(route, /aiInputVersion:\s*application\.aiInputVersion/);
  assert.match(route, /inputVersion:\s*nextVersion/);
  assert.match(route, /idempotencyKey:\s*buildAiJobIdempotencyKey\(application\.id,\s*nextVersion\)/);
  assert.match(route, /documentSnapshot:\s*documentValidation\.documentSnapshot/);
  assert.match(route, /status:\s*["']PUBLISHED["']/);
  assert.match(route, /after\(async \(\) =>/);
  assert.match(route, /dispatchAiVerificationJob\(result\.jobId,\s*result\.applicationId\)/);
  assert.match(route, /TransactionIsolationLevel\.Serializable/);

  const component = read("components/student/applications/AiVerificationProgress.tsx");
  assert.match(component, /retryLock\.current/);
  assert.match(component, /disabled=\{retrying \|\| retryCountdown !== 0\}/);
  assert.match(component, /ai-retry/);
});
