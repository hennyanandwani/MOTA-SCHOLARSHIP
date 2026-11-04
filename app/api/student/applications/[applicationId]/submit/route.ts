import { NextResponse } from "next/server";
import { ApplicationStatus } from "@/lib/generated/prisma/client";
import { requireStudent } from "@/lib/studentAuth";
import { prisma } from "@/lib/prisma";
import {
  applicationDocumentLabels,
  requiredApplicationDocumentTypes,
} from "@/lib/applicationRequirements";
import { getDraftLockFailure } from "@/lib/applicationConcurrency";
import {
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
        const draftLock = await tx.scholarshipApplication.updateMany({
          where: {
            id: applicationId,
            studentId,
            status: ApplicationStatus.DRAFT,
          },
          data: { status: ApplicationStatus.DRAFT },
        });

        if (draftLock.count !== 1) {
          const current = await tx.scholarshipApplication.findFirst({
            where: { id: applicationId, studentId },
            select: { status: true },
          });
          return {
            kind:
              getDraftLockFailure(current?.status ?? null) === "not_found"
                ? "not_found"
                : "not_draft",
          };
        }

        const application = await tx.scholarshipApplication.findFirst({
          where: {
            id: applicationId,
            studentId,
            status: ApplicationStatus.DRAFT,
          },
          select: {
            id: true,
            applicationNumber: true,
            status: true,
            currentStep: true,
            formData: true,
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
              },
            },
          },
        });

        if (!application) {
          throw new SubmissionTransactionAbort({ kind: "not_found" });
        }
        if (application.status !== ApplicationStatus.DRAFT) {
          throw new SubmissionTransactionAbort({ kind: "not_draft" });
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

        const update = await tx.scholarshipApplication.updateMany({
          where: {
            id: application.id,
            studentId,
            status: ApplicationStatus.DRAFT,
            scheme: { is: { isActive: true } },
          },
          data: {
            status: ApplicationStatus.SUBMITTED,
            submittedAt: new Date(),
          },
        });

        if (update.count !== 1) {
          throw new SubmissionTransactionAbort({ kind: "not_draft" });
        }

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
          { error: "Only a draft application can be submitted" },
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
