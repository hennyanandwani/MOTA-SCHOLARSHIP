import { NextResponse } from "next/server";
import { ApplicationStatus } from "@/lib/generated/prisma/client";
import { requireStudent } from "@/lib/studentAuth";
import { prisma } from "@/lib/prisma";
import { buildAiJobIdempotencyKey } from "@/lib/aiVerificationContract";
import { buildAiVerificationJobPolicyData } from "@/lib/scholarshipVerificationPolicy";
import {
  applicationDocumentLabels,
  requiredApplicationDocumentTypes,
} from "@/lib/applicationRequirements";
import {
  canResubmitAfterAiRejection,
  getSubmissionFailureStatus,
  getSubmissionValidationFailure,
  SubmissionTransactionAbort,
  type SubmissionAbortResult,
} from "@/lib/applicationSubmission";

export const runtime = "nodejs";

type SubmissionResult = SubmissionAbortResult | {
  kind: "submitted";
  application: {
    id: string;
    applicationNumber: string;
    status: ApplicationStatus;
    submittedAt: Date | null;
  };
};

export async function POST(
  _request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const auth = await requireStudent();
  if (auth.response) return auth.response;
  const user = auth.user;
  const studentId = user.student.id;

  const { applicationId } = await context.params;
  if (!applicationId || applicationId.length > 120) {
    return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
  }

  try {
    let result: SubmissionResult;
    try {
      result = await prisma.$transaction(async (tx) => {
        const application = await tx.scholarshipApplication.findFirst({
          where: {
            id: applicationId,
            studentId,
            status: { in: [ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED] },
          },
          select: {
            id: true,
            schemeId: true,
            applicationNumber: true,
            status: true,
            currentStep: true,
            formData: true,
            aiVerificationStatus: true,
            aiAttemptCount: true,
            aiInputVersion: true,
            informationConfirmed: true,
            verificationAcknowledged: true,
            eligibilityNotGuaranteed: true,
            termsAccepted: true,
            accountNumberConfirmed: true,
            scheme: { select: { isActive: true } },
            documents: {
              select: {
                type: true,
                verificationStatus: true,
                updatedAt: true,
              },
            },
            aiVerificationJobs: {
              orderBy: { inputVersion: "desc" },
              take: 1,
              select: {
                inputVersion: true,
                status: true,
                outcome: true,
                completedAt: true,
              },
            },
          },
        });
        if (!application) {
          return { kind: "not_found" as const };
        }

        const isCorrectionResubmission =
          application.status === ApplicationStatus.SUBMITTED;
        if (isCorrectionResubmission) {
          const latestJob = application.aiVerificationJobs[0] ?? null;
          const correctedDocumentUpdatedAt = latestJob?.completedAt
            ? application.documents
                .map((document) => document.updatedAt)
                .filter((updatedAt) => updatedAt > latestJob.completedAt!)
                .sort((left, right) => right.getTime() - left.getTime())[0] ?? null
            : null;
          if (!canResubmitAfterAiRejection({
            applicationStatus: application.status,
            aiVerificationStatus: application.aiVerificationStatus,
            aiAttemptCount: application.aiAttemptCount,
            aiInputVersion: application.aiInputVersion,
            latestJob,
            correctedDocumentUpdatedAt,
          })) {
            return { kind: "not_draft" as const };
          }

          const correctionLock = await tx.scholarshipApplication.updateMany({
            where: {
              id: application.id,
              studentId,
              status: ApplicationStatus.SUBMITTED,
              aiVerificationStatus: "INELIGIBLE",
              aiAttemptCount: application.aiAttemptCount,
              aiInputVersion: application.aiInputVersion,
            },
            data: { updatedAt: new Date() },
          });
          if (correctionLock.count !== 1) {
            return { kind: "not_draft" as const };
          }
        } else {
          const draftLock = await tx.scholarshipApplication.updateMany({
            where: {
              id: application.id,
              studentId,
              status: ApplicationStatus.DRAFT,
            },
            data: { status: ApplicationStatus.DRAFT },
          });
          if (draftLock.count !== 1) {
            return { kind: "not_draft" as const };
          }
        }

        const validationFailure = getSubmissionValidationFailure({
          schemeIsActive: application.scheme.isActive,
          formData: application.formData,
          currentStep: application.currentStep,
          accountNumberConfirmed: application.accountNumberConfirmed,
          declarations: [
            application.informationConfirmed,
            application.verificationAcknowledged,
            application.eligibilityNotGuaranteed,
            application.termsAccepted,
          ],
          documents: application.documents,
          requiredDocumentTypes: requiredApplicationDocumentTypes,
          documentLabels: applicationDocumentLabels,
        });
        if (validationFailure) {
          throw new SubmissionTransactionAbort(validationFailure);
        }

        const publishedPolicy = await tx.scholarshipVerificationPolicy.findFirst({
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
          },
        });
        const policyJobData = buildAiVerificationJobPolicyData(publishedPolicy);

        const nextVersion = application.aiInputVersion + 1;
        const update = await tx.scholarshipApplication.updateMany({
          where: isCorrectionResubmission
            ? {
                id: application.id,
                studentId,
                status: ApplicationStatus.SUBMITTED,
                aiVerificationStatus: "INELIGIBLE",
                aiAttemptCount: application.aiAttemptCount,
                aiInputVersion: application.aiInputVersion,
              }
            : {
                id: application.id,
                studentId,
                status: ApplicationStatus.DRAFT,
                scheme: { is: { isActive: true } },
              },
          data: {
            status: ApplicationStatus.SUBMITTED,
            ...(!isCorrectionResubmission ? { submittedAt: new Date(), aiAttemptCount: 0 } : {}),
            aiVerificationStatus: "WAITING_FOR_CONFIGURATION",
            aiEligibility: null,
            aiExplanation: null,
            studentAiReason: null,
            aiModelVersion: null,
            aiCompletedAt: null,
            aiInputVersion: nextVersion,
            manualReviewStatus: "NOT_READY",
          },
        });

        if (update.count !== 1) {
          throw new SubmissionTransactionAbort({ kind: "not_draft" });
        }

        await tx.aiVerificationJob.create({
          data: {
            applicationId: application.id,
            inputVersion: nextVersion,
            idempotencyKey: buildAiJobIdempotencyKey(application.id, nextVersion),
            requestReason: isCorrectionResubmission
              ? `Student correction after ${application.aiAttemptCount} AI ineligibility result(s)`
              : "Initial submission",
            status: "WAITING_FOR_CONFIGURATION",
            ...policyJobData,
          },
        });

        const submitted = await tx.scholarshipApplication.findUniqueOrThrow({
          where: { id: application.id },
          select: {
            id: true,
            applicationNumber: true,
            status: true,
            submittedAt: true,
          },
        });

        return { kind: "submitted", application: submitted };
      });
    } catch (error) {
      if (!(error instanceof SubmissionTransactionAbort)) throw error;
      result = error.result;
    }

    switch (result.kind) {
      case "not_found":
        return NextResponse.json(
          { error: "Application not found" },
          { status: getSubmissionFailureStatus(result.kind) },
        );
      case "not_draft":
        return NextResponse.json(
          { error: "Submit a draft or upload a corrected document after an eligible AI ineligibility result." },
          { status: getSubmissionFailureStatus(result.kind) },
        );
      case "inactive_scheme":
        return NextResponse.json(
          { error: "This scholarship scheme is no longer active" },
          { status: getSubmissionFailureStatus(result.kind) },
        );
      case "invalid_application":
        return NextResponse.json(
          {
            error: "Complete the required application information before submitting.",
            validationErrors: result.errors,
          },
          { status: getSubmissionFailureStatus(result.kind) },
        );
      case "missing_documents":
        return NextResponse.json(
          {
            error: "Upload or replace all required documents before submitting.",
            validationErrors: result.documents.map((document) => `${document} is required.`),
          },
          { status: getSubmissionFailureStatus(result.kind) },
        );
      case "submitted":
        return NextResponse.json(
          { application: result.application },
          { status: 200 },
        );
    }
  } catch (error) {
    console.error("Unable to submit student application:", error);
    return NextResponse.json(
      { error: "Unable to submit application. Please try again." },
      { status: 500 },
    );
  }
}
