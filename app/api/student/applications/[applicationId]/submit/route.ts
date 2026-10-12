import { NextResponse } from "next/server";
import {
  ApplicationStatus,
  DocumentType,
  VerificationStatus,
} from "@/lib/generated/prisma/client";
import { getApplicationSubmissionErrors } from "@/lib/applicationDraft";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const requiredDocumentTypes: DocumentType[] = [
  DocumentType.CASTE_CERTIFICATE,
  DocumentType.INCOME_CERTIFICATE,
  DocumentType.IDENTITY_PROOF,
  DocumentType.MARKSHEET,
  DocumentType.ADMISSION_PROOF,
  DocumentType.BANK_PROOF,
  DocumentType.PHOTOGRAPH,
];

type SubmissionResult =
  | { kind: "not_found" }
  | { kind: "not_draft" }
  | { kind: "inactive_scheme" }
  | { kind: "invalid_application"; errors: string[] }
  | { kind: "missing_documents"; documents: string[] }
  | {
      kind: "submitted";
      application: {
        id: string;
        applicationNumber: string;
        status: ApplicationStatus;
        submittedAt: Date | null;
      };
    };

const documentLabels: Partial<Record<DocumentType, string>> = {
  [DocumentType.CASTE_CERTIFICATE]: "ST Certificate",
  [DocumentType.INCOME_CERTIFICATE]: "Income Certificate",
  [DocumentType.IDENTITY_PROOF]: "Identity Document",
  [DocumentType.MARKSHEET]: "Academic Marksheet",
  [DocumentType.ADMISSION_PROOF]: "Admission or Bonafide Certificate",
  [DocumentType.BANK_PROOF]: "Bank Account Proof",
  [DocumentType.PHOTOGRAPH]: "Passport-size Photograph",
};

export async function POST(
  _request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  const user = await getCurrentAppUser();
  if (!user?.student) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const studentId = user.student.id;

  const { applicationId } = await context.params;
  if (!applicationId || applicationId.length > 120) {
    return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
  }

  try {
    const result: SubmissionResult = await prisma.$transaction(async (tx) => {
      const application = await tx.scholarshipApplication.findFirst({
        where: {
          id: applicationId,
          studentId,
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

      if (!application) return { kind: "not_found" };
      if (application.status !== ApplicationStatus.DRAFT) {
        return { kind: "not_draft" };
      }
      if (!application.scheme.isActive) return { kind: "inactive_scheme" };

      const validationErrors = getApplicationSubmissionErrors(application.formData);
      if (application.currentStep !== 4) {
        validationErrors.unshift("Complete all application steps before submitting.");
      }
      if (!application.accountNumberConfirmed) {
        validationErrors.push("Account numbers must match before submitting.");
      }

      const requiredDeclarations = [
        application.informationConfirmed,
        application.verificationAcknowledged,
        application.eligibilityNotGuaranteed,
        application.termsAccepted,
      ];
      if (requiredDeclarations.some((accepted) => !accepted)) {
        validationErrors.push("Accept all required declarations before submitting.");
      }

      if (validationErrors.length > 0) {
        return { kind: "invalid_application", errors: validationErrors };
      }

      const missingDocuments = requiredDocumentTypes
        .filter((type) => !application.documents.some(
          (document) =>
            document.type === type &&
            document.verificationStatus !== VerificationStatus.REJECTED &&
            document.verificationStatus !== VerificationStatus.FLAGGED,
        ))
        .map((type) => documentLabels[type] ?? type);

      if (missingDocuments.length > 0) {
        return { kind: "missing_documents", documents: missingDocuments };
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

      if (update.count !== 1) return { kind: "not_draft" };

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

    switch (result.kind) {
      case "not_found":
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      case "not_draft":
        return NextResponse.json(
          { error: "Only a draft application can be submitted" },
          { status: 409 },
        );
      case "inactive_scheme":
        return NextResponse.json(
          { error: "This scholarship scheme is no longer active" },
          { status: 409 },
        );
      case "invalid_application":
        return NextResponse.json(
          {
            error: "Complete the required application information before submitting.",
            validationErrors: result.errors,
          },
          { status: 422 },
        );
      case "missing_documents":
        return NextResponse.json(
          {
            error: "Upload or replace all required documents before submitting.",
            validationErrors: result.documents.map((document) => `${document} is required.`),
          },
          { status: 422 },
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
