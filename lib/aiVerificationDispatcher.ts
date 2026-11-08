import "server-only";
import {
  AiVerificationJobStatus,
  AiVerificationStatus,
  ApplicationStatus,
  ManualReviewStatus,
  Prisma,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { submitFastApiAiVerification } from "@/lib/aiVerificationAdapter";
import {
  claimCandidateWithCompareAndSet,
  claimTargetedCandidate,
  executeClaimedAiVerification,
  getAbandonedClaimFence,
  getDispatchCandidateStaleness,
  getProcessingClaimFence,
  isDispatchCandidateVersionCurrent,
  mapAiOutcomeToApplication,
  type DispatchCandidate,
  type DispatchDocument,
  type DispatchFailure,
} from "@/lib/aiVerificationDispatcherCore";
import {
  AI_DISPATCH_EXECUTION_BUDGET_MS,
  type AiVerificationResult,
} from "@/lib/aiVerificationAdapterCore";

const ABANDONED_CLAIM_AGE_MS = 5 * 60 * 1000;
const MAX_STALE_CANDIDATES_PER_RUN = 3;
const TRANSACTION_MAX_WAIT_MS = 2_000;
const TRANSACTION_TIMEOUT_MS = 10_000;

const serializableTransactionOptions = {
  maxWait: TRANSACTION_MAX_WAIT_MS,
  timeout: TRANSACTION_TIMEOUT_MS,
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
} as const;

type ClaimResult =
  | { kind: "claimed"; candidate: DispatchCandidate }
  | { kind: "stale" }
  | { kind: "contended" }
  | { kind: "empty" };

type TargetedClaimResult =
  | { kind: "claimed"; candidate: DispatchCandidate }
  | { kind: "contended" }
  | { kind: "not_found" }
  | { kind: "not_eligible" }
  | { kind: "synthetic_blocked" }
  | { kind: "stale"; code: string }
  | { kind: "invalid"; code: string };

function isSerializableConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

async function recoverAbandonedJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - ABANDONED_CLAIM_AGE_MS);
  return prisma.$transaction(async (transaction) => {
    const jobs = await transaction.aiVerificationJob.findMany({
      where: {
        status: AiVerificationJobStatus.PROCESSING,
        updatedAt: { lt: cutoff },
      },
      orderBy: { updatedAt: "asc" },
      take: 50,
      select: {
        id: true,
        applicationId: true,
        inputVersion: true,
        attemptCount: true,
      },
    });

    let recoveredCount = 0;
    for (const job of jobs) {
      const recovered = await transaction.aiVerificationJob.updateMany({
        where: {
          id: job.id,
          ...getAbandonedClaimFence(
            AiVerificationJobStatus.PROCESSING,
            job.attemptCount,
            cutoff,
          ),
        },
        data: {
          status: AiVerificationJobStatus.FAILED,
          lastErrorCode: "DISPATCH_ABANDONED_AMBIGUOUS",
          completedAt: new Date(),
        },
      });
      if (recovered.count !== 1) continue;

      await transaction.scholarshipApplication.updateMany({
        where: {
          id: job.applicationId,
          status: ApplicationStatus.SUBMITTED,
          aiInputVersion: job.inputVersion,
          aiVerificationStatus: AiVerificationStatus.IN_PROGRESS,
        },
        data: {
          aiVerificationStatus: AiVerificationStatus.FAILED,
          aiCompletedAt: new Date(),
          manualReviewStatus: ManualReviewStatus.NOT_READY,
        },
      });
      recoveredCount += 1;
    }
    return recoveredCount;
  }, serializableTransactionOptions);
}

async function claimNextJob(): Promise<ClaimResult> {
  for (let attempt = 0; attempt < MAX_STALE_CANDIDATES_PER_RUN; attempt += 1) {
    try {
      const result = await prisma.$transaction(async (transaction): Promise<ClaimResult> => {
        let cursor: { id: string } | undefined;
        while (true) {
          const jobs = await transaction.aiVerificationJob.findMany({
            where: {
              status: AiVerificationJobStatus.WAITING_FOR_CONFIGURATION,
              ...(process.env.NODE_ENV === "production" ? { isSynthetic: false } : {}),
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            take: 50,
            ...(cursor ? { cursor, skip: 1 } : {}),
            select: {
              id: true,
              applicationId: true,
              inputVersion: true,
              attemptCount: true,
              idempotencyKey: true,
              policyId: true,
              policySnapshot: true,
              isSynthetic: true,
              documentSnapshot: true,
              application: {
                select: {
                  status: true,
                  aiInputVersion: true,
                  aiVerificationStatus: true,
                  schemeId: true,
                  formData: true,
                  documents: {
                    select: {
                      id: true,
                      type: true,
                      mimeType: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          });
          if (jobs.length === 0) return { kind: "empty" };

          for (const job of jobs) {
            cursor = { id: job.id };
            const candidate: DispatchCandidate = {
              jobId: job.id,
              applicationId: job.applicationId,
              inputVersion: job.inputVersion,
              claimAttemptCount: job.attemptCount + 1,
              applicationStatus: job.application.status,
              applicationInputVersion: job.application.aiInputVersion,
              applicationAiStatus: job.application.aiVerificationStatus,
              applicationSchemeId: job.application.schemeId,
              idempotencyKey: job.idempotencyKey,
              policyId: job.policyId,
              policySnapshot: job.policySnapshot,
              isSynthetic: job.isSynthetic,
              documentSnapshot: job.documentSnapshot,
              applicationData: job.application.formData,
              documents: job.application.documents as DispatchDocument[],
            };

            if (!isDispatchCandidateVersionCurrent(candidate)) continue;

            const staleReason = getDispatchCandidateStaleness(candidate);
            if (staleReason) {
              const superseded = await transaction.aiVerificationJob.updateMany({
                where: {
                  id: job.id,
                  inputVersion: job.inputVersion,
                  status: AiVerificationJobStatus.WAITING_FOR_CONFIGURATION,
                  attemptCount: job.attemptCount,
                  application: {
                    is: {
                      status: job.application.status,
                      aiInputVersion: job.application.aiInputVersion,
                      aiVerificationStatus: job.application.aiVerificationStatus,
                    },
                  },
                },
                data: {
                  status: AiVerificationJobStatus.SUPERSEDED,
                  lastErrorCode: staleReason,
                },
              });
              return superseded.count === 1 ? { kind: "stale" } : { kind: "contended" };
            }

            const claim = await claimCandidateWithCompareAndSet(candidate, async () => {
              const claimed = await transaction.aiVerificationJob.updateMany({
                where: {
                  id: job.id,
                  inputVersion: job.inputVersion,
                  status: AiVerificationJobStatus.WAITING_FOR_CONFIGURATION,
                  attemptCount: job.attemptCount,
                  application: {
                    is: {
                      status: ApplicationStatus.SUBMITTED,
                      aiInputVersion: job.inputVersion,
                      aiVerificationStatus: AiVerificationStatus.WAITING_FOR_CONFIGURATION,
                    },
                  },
                },
                data: {
                  status: AiVerificationJobStatus.PROCESSING,
                  attemptCount: { increment: 1 },
                  lastErrorCode: null,
                },
              });
              if (claimed.count !== 1) return false;

              const applicationClaimed = await transaction.scholarshipApplication.updateMany({
                where: {
                  id: job.applicationId,
                  status: ApplicationStatus.SUBMITTED,
                  aiInputVersion: job.inputVersion,
                  aiVerificationStatus: AiVerificationStatus.WAITING_FOR_CONFIGURATION,
                },
                data: { aiVerificationStatus: AiVerificationStatus.IN_PROGRESS },
              });
              if (applicationClaimed.count !== 1) {
                throw new Error("Dispatcher claim changed during its transaction.");
              }
              return true;
            });
            if (claim === "stale") return { kind: "stale" };
            if (claim === "already_claimed") return { kind: "contended" };
            return { kind: "claimed", candidate };
          }
        }
      }, serializableTransactionOptions);
      if (result.kind === "stale") continue;
      return result;
    } catch (error) {
      if (isSerializableConflict(error)) return { kind: "contended" };
      throw error;
    }
  }
  return { kind: "contended" };
}

async function claimSpecificJob(
  jobId: string,
  applicationId: string,
): Promise<TargetedClaimResult> {
  try {
    return await prisma.$transaction(async (transaction): Promise<TargetedClaimResult> => {
      const job = await transaction.aiVerificationJob.findFirst({
        where: { id: jobId, applicationId },
        select: {
          id: true,
          applicationId: true,
          inputVersion: true,
          status: true,
          attemptCount: true,
          idempotencyKey: true,
          policyId: true,
          policySnapshot: true,
          isSynthetic: true,
          documentSnapshot: true,
          application: {
            select: {
              status: true,
              aiInputVersion: true,
              aiVerificationStatus: true,
              schemeId: true,
              formData: true,
              documents: {
                select: {
                  id: true,
                  type: true,
                  mimeType: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      });
      if (!job) return { kind: "not_found" };
      if (job.status !== AiVerificationJobStatus.WAITING_FOR_CONFIGURATION) {
        return { kind: "not_eligible" };
      }

      const candidate: DispatchCandidate = {
        jobId: job.id,
        applicationId: job.applicationId,
        inputVersion: job.inputVersion,
        claimAttemptCount: job.attemptCount + 1,
        applicationStatus: job.application.status,
        applicationInputVersion: job.application.aiInputVersion,
        applicationAiStatus: job.application.aiVerificationStatus,
        applicationSchemeId: job.application.schemeId,
        idempotencyKey: job.idempotencyKey,
        policyId: job.policyId,
        policySnapshot: job.policySnapshot,
        isSynthetic: job.isSynthetic,
        documentSnapshot: job.documentSnapshot,
        applicationData: job.application.formData,
        documents: job.application.documents as DispatchDocument[],
      };

      const result = await claimTargetedCandidate(
        jobId,
        applicationId,
        candidate,
        process.env.NODE_ENV === "production",
        async () => {
          const claimed = await transaction.aiVerificationJob.updateMany({
            where: {
              id: jobId,
              applicationId,
              inputVersion: job.inputVersion,
              idempotencyKey: job.idempotencyKey,
              policyId: job.policyId,
              status: AiVerificationJobStatus.WAITING_FOR_CONFIGURATION,
              attemptCount: job.attemptCount,
              ...(process.env.NODE_ENV === "production" ? { isSynthetic: false } : {}),
              application: {
                is: {
                  status: ApplicationStatus.SUBMITTED,
                  aiInputVersion: job.inputVersion,
                  aiVerificationStatus: AiVerificationStatus.WAITING_FOR_CONFIGURATION,
                },
              },
            },
            data: {
              status: AiVerificationJobStatus.PROCESSING,
              attemptCount: { increment: 1 },
              lastErrorCode: null,
            },
          });
          if (claimed.count !== 1) return false;

          const applicationClaimed = await transaction.scholarshipApplication.updateMany({
            where: {
              id: applicationId,
              status: ApplicationStatus.SUBMITTED,
              aiInputVersion: job.inputVersion,
              aiVerificationStatus: AiVerificationStatus.WAITING_FOR_CONFIGURATION,
            },
            data: { aiVerificationStatus: AiVerificationStatus.IN_PROGRESS },
          });
          if (applicationClaimed.count !== 1) {
            throw new Error("Targeted dispatcher claim changed during its transaction.");
          }
          return true;
        },
      );

      if (result.kind === "claimed") return { kind: "claimed", candidate };
      if (result.kind === "already_claimed") return { kind: "contended" };
      if (result.kind === "stale") return result;
      if (result.kind === "invalid") return result;
      if (result.kind === "synthetic_blocked") return result;
      return { kind: "not_found" };
    }, serializableTransactionOptions);
  } catch (error) {
    if (isSerializableConflict(error)) return { kind: "contended" };
    throw error;
  }
}

function toStoredOutcome(outcome: AiVerificationResult["outcome"]): AiVerificationStatus {
  switch (outcome) {
    case "ELIGIBLE":
      return AiVerificationStatus.ELIGIBLE;
    case "INELIGIBLE":
      return AiVerificationStatus.INELIGIBLE;
    case "NEEDS_REVIEW":
      return AiVerificationStatus.NEEDS_ATTENTION;
    case "FAILED":
      return AiVerificationStatus.FAILED;
  }
}

async function persistJobResult(
  candidate: DispatchCandidate,
  result: AiVerificationResult,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const application = await transaction.scholarshipApplication.findUnique({
      where: { id: candidate.applicationId },
      select: {
        status: true,
        aiInputVersion: true,
        aiVerificationStatus: true,
        aiAttemptCount: true,
      },
    });
    if (
      !application ||
      application.status !== ApplicationStatus.SUBMITTED ||
      application.aiInputVersion !== candidate.inputVersion ||
      application.aiVerificationStatus !== AiVerificationStatus.IN_PROGRESS
    ) {
      await transaction.aiVerificationJob.updateMany({
        where: {
          id: candidate.jobId,
          inputVersion: candidate.inputVersion,
          ...getProcessingClaimFence(
            AiVerificationJobStatus.PROCESSING,
            candidate.claimAttemptCount,
          ),
        },
        data: {
          status: AiVerificationJobStatus.SUPERSEDED,
          lastErrorCode: "APPLICATION_VERSION_STALE",
          completedAt: new Date(),
        },
      });
      return false;
    }

    const outcome = toStoredOutcome(result.outcome);
    const applicationMapping = mapAiOutcomeToApplication(
      result.outcome,
      application.aiAttemptCount,
    );
    const updated = await transaction.aiVerificationJob.updateMany({
      where: {
        id: candidate.jobId,
        inputVersion: candidate.inputVersion,
        ...getProcessingClaimFence(
          AiVerificationJobStatus.PROCESSING,
          candidate.claimAttemptCount,
        ),
      },
      data: {
        status: result.outcome === "FAILED"
          ? AiVerificationJobStatus.FAILED
          : AiVerificationJobStatus.COMPLETED,
        outcome,
        eligibility: result.outcome === "ELIGIBLE"
          ? true
          : result.outcome === "INELIGIBLE"
            ? false
            : null,
        explanation: JSON.stringify(result.reasons),
        documentResults: JSON.parse(JSON.stringify(result.documents)) as Prisma.InputJsonValue,
        lastErrorCode: result.outcome === "FAILED" ? "SERVICE_REPORTED_FAILURE" : null,
        completedAt: new Date(),
      },
    });
    if (updated.count !== 1) return false;

    const applicationUpdated = await transaction.scholarshipApplication.updateMany({
      where: {
        id: candidate.applicationId,
        status: ApplicationStatus.SUBMITTED,
        aiInputVersion: candidate.inputVersion,
        aiVerificationStatus: AiVerificationStatus.IN_PROGRESS,
        aiAttemptCount: application.aiAttemptCount,
      },
      data: {
        aiVerificationStatus: applicationMapping.aiVerificationStatus,
        aiEligibility: applicationMapping.aiEligibility,
        aiExplanation: JSON.stringify(result.reasons),
        studentAiReason: applicationMapping.studentAiReason,
        aiCompletedAt: new Date(),
        aiAttemptCount: applicationMapping.rejectionCount,
        manualReviewStatus: applicationMapping.manualReviewStatus as ManualReviewStatus,
        status: applicationMapping.applicationStatus as ApplicationStatus,
      },
    });
    if (applicationUpdated.count !== 1) {
      throw new Error("Application changed while applying the AI result.");
    }
    return true;
  }, serializableTransactionOptions).then((persisted) => {
    if (!persisted) throw new Error("Dispatcher result could not be applied to the claimed job.");
  });
}

async function persistDispatchFailure(
  candidate: DispatchCandidate,
  failure: DispatchFailure,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const failed = await transaction.aiVerificationJob.updateMany({
      where: {
        id: candidate.jobId,
        inputVersion: candidate.inputVersion,
        ...getProcessingClaimFence(
          AiVerificationJobStatus.PROCESSING,
          candidate.claimAttemptCount,
        ),
      },
      data: {
        status: AiVerificationJobStatus.FAILED,
        lastErrorCode: failure.code,
        completedAt: new Date(),
      },
    });
    if (failed.count !== 1) return;

    await transaction.scholarshipApplication.updateMany({
      where: {
        id: candidate.applicationId,
        status: ApplicationStatus.SUBMITTED,
        aiInputVersion: candidate.inputVersion,
        aiVerificationStatus: AiVerificationStatus.IN_PROGRESS,
      },
      data: {
        aiVerificationStatus: AiVerificationStatus.FAILED,
        aiCompletedAt: new Date(),
        manualReviewStatus: ManualReviewStatus.NOT_READY,
      },
    });
  }, serializableTransactionOptions);
}

export async function dispatchNextAiVerification(): Promise<
  | { kind: "idle"; recovered: number }
  | { kind: "contended"; recovered: number }
  | {
      kind: "completed" | "failed";
      jobId: string;
      outcome?: AiVerificationResult["outcome"];
      failure?: DispatchFailure;
      recovered: number;
    }
> {
  const deadline = new AbortController();
  const deadlineTimer = setTimeout(
    () => deadline.abort(),
    AI_DISPATCH_EXECUTION_BUDGET_MS,
  );
  try {
    const recovered = await recoverAbandonedJobs();
    const claim = await claimNextJob();
    if (claim.kind === "empty") return { kind: "idle", recovered };
    if (claim.kind === "contended") return { kind: "contended", recovered };
    if (claim.kind === "stale") return { kind: "idle", recovered };

    const execution = await executeClaimedAiVerification(claim.candidate, {
      submit: (input, signal) => submitFastApiAiVerification(input, signal),
      complete: persistJobResult,
      fail: persistDispatchFailure,
    }, deadline.signal);
    return execution.kind === "completed"
      ? {
          kind: "completed",
          jobId: claim.candidate.jobId,
          outcome: execution.outcome,
          recovered,
        }
      : {
          kind: "failed",
          jobId: claim.candidate.jobId,
          failure: execution.failure,
          recovered,
        };
  } finally {
    clearTimeout(deadlineTimer);
  }
}

export async function dispatchAiVerificationJob(
  jobId: string,
  applicationId: string,
): Promise<
  | { kind: "completed" | "failed"; jobId: string; outcome?: AiVerificationResult["outcome"]; failure?: DispatchFailure }
  | { kind: "contended" | "not_found" | "not_eligible" | "synthetic_blocked" }
  | { kind: "stale" | "invalid"; code: string }
> {
  const deadline = new AbortController();
  const deadlineTimer = setTimeout(
    () => deadline.abort(),
    AI_DISPATCH_EXECUTION_BUDGET_MS,
  );
  try {
    const claim = await claimSpecificJob(jobId, applicationId);
    if (claim.kind !== "claimed") return claim;

    const execution = await executeClaimedAiVerification(claim.candidate, {
      submit: (input, signal) => submitFastApiAiVerification(input, signal),
      complete: persistJobResult,
      fail: persistDispatchFailure,
    }, deadline.signal);
    return execution.kind === "completed"
      ? {
          kind: "completed",
          jobId: claim.candidate.jobId,
          outcome: execution.outcome,
        }
      : {
          kind: "failed",
          jobId: claim.candidate.jobId,
          failure: execution.failure,
        };
  } finally {
    clearTimeout(deadlineTimer);
  }
}
