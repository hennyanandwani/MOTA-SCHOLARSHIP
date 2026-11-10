export const STUDENT_AI_RETRY_COOLDOWN_SECONDS = 15;

const retryableTechnicalFailureCodes = new Set([
  "SERVICE_REPORTED_FAILURE",
  "REQUEST_TIMEOUT_AMBIGUOUS",
  "NETWORK_FAILURE_AMBIGUOUS",
  "HTTP_FAILURE_AMBIGUOUS",
  "RESPONSE_INVALID_AMBIGUOUS",
  "DISPATCH_UNEXPECTED_FAILURE",
  "ADAPTER_EXECUTION_TIMEOUT",
  "ADAPTER_STORAGE_ACCESS",
]);

export function isRetryableTechnicalFailure(input: {
  verificationStatus: string;
  currentInputVersion: number;
  jobInputVersion: number;
  jobStatus: string;
  jobOutcome: string | null;
  lastErrorCode: string | null;
}): boolean {
  return (
    input.verificationStatus === "FAILED" &&
    input.currentInputVersion === input.jobInputVersion &&
    input.jobStatus === "FAILED" &&
    (input.jobOutcome === null || input.jobOutcome === "FAILED") &&
    input.lastErrorCode !== null &&
    retryableTechnicalFailureCodes.has(input.lastErrorCode)
  );
}

export function getStudentAiRetryButtonLabel(
  secondsRemaining: number | null,
): string {
  return secondsRemaining !== null && secondsRemaining > 0
    ? `Retry in ${secondsRemaining}s`
    : "Retry Verification";
}

export function decrementStudentAiRetryCountdown(
  secondsRemaining: number | null,
): number | null {
  return secondsRemaining === null
    ? null
    : Math.max(0, secondsRemaining - 1);
}
