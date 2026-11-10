import { after, NextResponse } from "next/server";
import {
  AiVerificationJobStatus,
  AiVerificationStatus,
  ApplicationStatus,
  ManualReviewStatus,
  Prisma,
} from "@/lib/generated/prisma/client";
import { requireStudent } from "@/lib/studentAuth";
import { prisma } from "@/lib/prisma";
import { dispatchAiVerificationJob } from "@/lib/aiVerificationDispatcher";
import { buildAiJobIdempotencyKey } from "@/lib/aiVerificationContract";
import {
  buildDocumentVersionSnapshot,
  validateReevaluationDocuments,
} from "@/lib/aiVerificationReevaluation";
import { projectApplicationDataForCriteria } from "@/lib/aiVerificationDispatcherCore";
import { buildAiVerificationJobPolicyData, isVerificationDocumentType } from "@/lib/scholarshipVerificationPolicy";
import { canCreateSyntheticPolicy } from "@/lib/syntheticVerificationPolicy";
import { isRetryableTechnicalFailure } from "@/lib/studentAiRetry";

export const runtime = "nodejs";
export const maxDuration = 120;

type RetryResult =
  | { kind: "not_found" }
  | { kind: "invalid_state" }
  | { kind: "policy_invalid" }
  | { kind: "synthetic_blocked" }
  | { kind: "official_policy_exists" }
  | { kind: "documents_invalid"; code: string }
  | { kind: "criterion_data_missing" }
  | { kind: "input_conflict" }
  | { kind: "created"; applicationId: string; jobId: string; inputVersion: number };

export async function POST(
  _request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const auth = await requireStudent();
  if (auth.response) return auth.response;

  const { applicationId } = await context.params;
  if (!applicationId || applicationId.length > 120) {
    return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (transaction): Promise<RetryResult> => {
      const application = await transaction.scholarshipApplication.findFirst({
        where: {
          id: applicationId,
          studentId: auth.user.student.id,
          status: ApplicationStatus.SUBMITTED,
        },
        select: {
          id: true,
          schemeId: true,
          status: true,
          aiVerificationStatus: true,
          aiInputVersion: true,
          scheme: { select: { name: true } },
          formData: true,
          documents: {
            select: {
              id: true,
              type: true,
              mimeType: true,
              sizeBytes: true,
              updatedAt: true,
            },
            orderBy: { id: "asc" },
          },
        },
      });
      if (!application) return { kind: "not_found" };
      if (application.aiVerificationStatus !== AiVerificationStatus.FAILED) {
        return { kind: "invalid_state" };
      }

      const currentJobs = await transaction.aiVerificationJob.findMany({
        where: {
          applicationId: application.id,
          inputVersion: application.aiInputVersion,
        },
        select: {
          inputVersion: true,
          status: true,
          outcome: true,
          lastErrorCode: true,
        },
        take: 2,
      });
      if (
        currentJobs.length !== 1 ||
        currentJobs[0].status !== AiVerificationJobStatus.FAILED ||
        (currentJobs[0].outcome !== null &&
          currentJobs[0].outcome !== AiVerificationStatus.FAILED) ||
        !isRetryableTechnicalFailure({
          verificationStatus: application.aiVerificationStatus,
          currentInputVersion: application.aiInputVersion,
          jobInputVersion: currentJobs[0].inputVersion,
          jobStatus: currentJobs[0].status,
          jobOutcome: currentJobs[0].outcome,
          lastErrorCode: currentJobs[0].lastErrorCode,
        })
      ) {
        return { kind: "invalid_state" };
      }

      const policy = await transaction.scholarshipVerificationPolicy.findFirst({
        where: { schemeId: application.schemeId, status: "PUBLISHED" },
        orderBy: { version: "desc" },
        select: {
          id: true,
          schemeId: true,
          version: true,
          status: true,
          eligibilityCriteria: true,
          requiredDocumentTypes: true,
          aiEligibleDocumentTypes: true,
          officialGuidelineReference: true,
          guidelineRevision: true,
          publishedById: true,
          publishedAt: true,
          isSynthetic: true,
        },
      });
      if (!policy) return { kind: "policy_invalid" };
      if (
        policy.requiredDocumentTypes.some((type) => !isVerificationDocumentType(type)) ||
        policy.aiEligibleDocumentTypes.some((type) => !isVerificationDocumentType(type))
      ) {
        return { kind: "policy_invalid" };
      }

      const policyJobData = buildAiVerificationJobPolicyData(policy);
      if (!("policySnapshot" in policyJobData)) {
        return { kind: "policy_invalid" };
      }
      if (
        policy.isSynthetic &&
        !canCreateSyntheticPolicy(process.env.NODE_ENV, application.scheme.name)
      ) {
        return { kind: "synthetic_blocked" };
      }
      if (
        policy.isSynthetic &&
        await transaction.scholarshipVerificationPolicy.count({
            where: { schemeId: application.schemeId, isSynthetic: false },
          }) > 0
      ) {
        return { kind: "official_policy_exists" };
      }

      const requiredDocumentTypes = policy.requiredDocumentTypes.filter(isVerificationDocumentType);
      const aiEligibleDocumentTypes = policy.aiEligibleDocumentTypes.filter(isVerificationDocumentType);
      const documentSnapshot = buildDocumentVersionSnapshot(application.documents);
      const documentValidation = validateReevaluationDocuments({
        documents: application.documents,
        expectedVersions: documentSnapshot,
        requiredDocumentTypes,
        aiEligibleDocumentTypes,
      });
      if (!documentValidation.success) {
        return { kind: "documents_invalid", code: documentValidation.code };
      }

      try {
        projectApplicationDataForCriteria(
          application.formData,
          policyJobData.policySnapshot,
        );
      } catch {
        return { kind: "criterion_data_missing" };
      }

      const nextVersion = application.aiInputVersion + 1;
      const updated = await transaction.scholarshipApplication.updateMany({
        where: {
          id: application.id,
          studentId: auth.user.student.id,
          status: ApplicationStatus.SUBMITTED,
          aiVerificationStatus: AiVerificationStatus.FAILED,
          aiInputVersion: application.aiInputVersion,
        },
        data: {
          aiInputVersion: nextVersion,
          aiVerificationStatus: AiVerificationStatus.WAITING_FOR_CONFIGURATION,
          aiEligibility: null,
          aiExplanation: null,
          studentAiReason: null,
          aiModelVersion: null,
          aiCompletedAt: null,
          manualReviewStatus: ManualReviewStatus.NOT_READY,
        },
      });
      if (updated.count !== 1) return { kind: "input_conflict" };

      const job = await transaction.aiVerificationJob.create({
        data: {
          applicationId: application.id,
          requestedById: auth.user.id,
          requestReason: "Student retry after technical AI verification failure",
          inputVersion: nextVersion,
          idempotencyKey: buildAiJobIdempotencyKey(application.id, nextVersion),
          status: AiVerificationJobStatus.WAITING_FOR_CONFIGURATION,
          documentSnapshot: documentValidation.documentSnapshot as Prisma.InputJsonValue,
          ...policyJobData,
        },
        select: { id: true, inputVersion: true },
      });
      return {
        kind: "created",
        applicationId: application.id,
        jobId: job.id,
        inputVersion: job.inputVersion,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    switch (result.kind) {
      case "not_found":
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
      case "invalid_state":
        return NextResponse.json(
          { error: "This application does not have a retryable technical verification failure." },
          { status: 409 },
        );
      case "policy_invalid":
        return NextResponse.json({ error: "The published verification policy is invalid." }, { status: 409 });
      case "synthetic_blocked":
        return NextResponse.json(
          { error: "Synthetic test policy is unavailable outside an isolated local test scheme.", code: "SYNTHETIC_POLICY_BLOCKED" },
          { status: 403 },
        );
      case "official_policy_exists":
        return NextResponse.json(
          { error: "A synthetic policy cannot be used when an official policy exists.", code: "OFFICIAL_POLICY_EXISTS" },
          { status: 409 },
        );
      case "documents_invalid":
        return NextResponse.json(
          { error: "Current documents do not satisfy the published verification policy.", code: result.code },
          { status: 409 },
        );
      case "criterion_data_missing":
        return NextResponse.json(
          { error: "Application data does not satisfy the published verification policy.", code: "CRITERION_DATA_MISSING" },
          { status: 409 },
        );
      case "input_conflict":
        return NextResponse.json(
          { error: "A retry was already started for this verification attempt." },
          { status: 409 },
        );
      case "created":
        after(async () => {
          try {
            await dispatchAiVerificationJob(result.jobId, result.applicationId);
          } catch (error) {
            console.error(
              "Unable to trigger student AI verification retry dispatch:",
              error instanceof Error ? error.name : "Unknown error",
            );
          }
        });
        return NextResponse.json({
          job: {
            id: result.jobId,
            inputVersion: result.inputVersion,
            status: AiVerificationJobStatus.WAITING_FOR_CONFIGURATION,
          },
        });
    }
  } catch (error) {
    console.error(
      "Unable to retry student AI verification:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return NextResponse.json(
      { error: "Unable to retry AI verification." },
      { status: 500 },
    );
  }
}
