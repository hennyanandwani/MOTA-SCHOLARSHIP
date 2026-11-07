
import { createClient } from "@supabase/supabase-js";
import { DocumentType, ApplicationStatus, VerificationStatus } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/studentAuth";
import { prisma } from "@/lib/prisma";
import { requireEnvironmentVariable } from "@/lib/env";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import {
  detectApplicationDocumentMimeType,
  getDocumentUploadValidationError,
  MAX_APPLICATION_DOCUMENT_SIZE,
} from "@/lib/applicationDocumentValidation";
import {
  getDraftLockFailure,
  shouldCleanupUploadedObject,
} from "@/lib/applicationConcurrency";

export const runtime = "nodejs";

const BUCKET = "scholarship-documents";
const allowedTypes: Record<string, DocumentType> = {
  CASTE_CERTIFICATE: DocumentType.CASTE_CERTIFICATE,
  INCOME_CERTIFICATE: DocumentType.INCOME_CERTIFICATE,
  MARKSHEET: DocumentType.MARKSHEET,
  IDENTITY_PROOF: DocumentType.IDENTITY_PROOF,
  ADMISSION_PROOF: DocumentType.ADMISSION_PROOF,
  BANK_PROOF: DocumentType.BANK_PROOF,
  PHOTOGRAPH: DocumentType.PHOTOGRAPH,
  OTHER: DocumentType.OTHER,
};

function getStorageClient() {
  const { url } = getSupabasePublicConfig();
  const secret = requireEnvironmentVariable(
    "SUPABASE_SECRET_KEY",
    process.env.SUPABASE_SECRET_KEY,
  );

  return createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ applicationId: string }> }
) {
  let storagePath: string | undefined;
  let storageClient: ReturnType<typeof getStorageClient> | undefined;
  let metadataCommitted = false;
  let metadataWriteMayHaveCommitted = false;

  async function cleanupUploadedObject() {
    if (!storagePath || !storageClient) return;

    try {
      const { error } = await storageClient.storage
        .from(BUCKET)
        .remove([storagePath]);
      if (error) console.error("New document cleanup failed.");
    } catch (error) {
      console.error(
        "New document cleanup failed:",
        error instanceof Error ? error.name : "Unknown error",
      );
    }
  }

  try {
    const auth = await requireStudent();

    if (auth.response) return auth.response;
    const user = auth.user;

    const { applicationId } = await context.params;

    const application = await prisma.scholarshipApplication.findFirst({
      where: {
        id: applicationId,
        studentId: user.student.id,
        status: { in: [ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED] },
      },
      select: {
        id: true,
        status: true,
        aiVerificationStatus: true,
        aiAttemptCount: true,
        aiInputVersion: true,
        aiVerificationJobs: {
          orderBy: { inputVersion: "desc" },
          take: 1,
          select: { inputVersion: true, status: true, outcome: true },
        },
      },
    });

    const latestJob = application?.aiVerificationJobs[0];
    const isCorrectionAllowed = Boolean(
      application?.status === ApplicationStatus.SUBMITTED &&
      application.aiVerificationStatus === "INELIGIBLE" &&
      application.aiAttemptCount >= 1 &&
      application.aiAttemptCount <= 3 &&
      latestJob?.inputVersion === application.aiInputVersion &&
      latestJob.status === "COMPLETED" &&
      latestJob.outcome === "INELIGIBLE",
    );
    if (!application || (
      application.status !== ApplicationStatus.DRAFT &&
      !isCorrectionAllowed
    )) {
      return NextResponse.json(
        { error: "Application is not open for document uploads." },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const rawType = formData.get("type");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A document file is required" },
        { status: 400 }
      );
    }

    if (
      typeof rawType !== "string" ||
      !(rawType in allowedTypes)
    ) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_APPLICATION_DOCUMENT_SIZE) {
      return NextResponse.json(
        { error: "File must be between 1 byte and 5 MB" },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const validationError = getDocumentUploadValidationError({
      size: file.size,
      declaredMimeType: file.type,
      bytes,
    });
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }
    const detectedMime = detectApplicationDocumentMimeType(bytes);
    if (!detectedMime) {
      return NextResponse.json(
        { error: "Only valid PDF, JPEG and PNG files are accepted" },
        { status: 400 }
      );
    }

    storageClient = getStorageClient();

    const originalName = file.name
      .replace(/[/\\]/g, "_")
      .replace(/[^\w.\- ()]/g, "_")
      .slice(0, 180) || "document";

    const uploadedStoragePath = [
      user.student.id,
      application.id,
      `${crypto.randomUUID()}-${originalName}`,
    ].join("/");
    storagePath = uploadedStoragePath;

    const { error: uploadError } = await storageClient.storage
      .from(BUCKET)
      .upload(uploadedStoragePath, bytes, {
        contentType: detectedMime,
        upsert: false,
      });

    if (uploadError) {
      console.error("Private document upload failed:", uploadError.message);
      return NextResponse.json(
        { error: "Unable to upload document" },
        { status: 502 }
      );
    }

    const documentType = allowedTypes[rawType];
    const metadataResult = await prisma.$transaction(async (tx) => {
      const draftLock = await tx.scholarshipApplication.updateMany({
        where: application.status === ApplicationStatus.DRAFT
          ? {
              id: application.id,
              studentId: user.student.id,
              status: ApplicationStatus.DRAFT,
            }
          : {
              id: application.id,
              studentId: user.student.id,
              status: ApplicationStatus.SUBMITTED,
              aiVerificationStatus: "INELIGIBLE",
              aiAttemptCount: application.aiAttemptCount,
              aiInputVersion: application.aiInputVersion,
            },
        data: application.status === ApplicationStatus.DRAFT
          ? { status: ApplicationStatus.DRAFT }
          : { updatedAt: new Date() },
      });

      if (draftLock.count !== 1) {
        const current = await tx.scholarshipApplication.findFirst({
          where: {
            id: application.id,
            studentId: user.student.id,
          },
          select: { status: true },
        });
        return {
          kind: getDraftLockFailure(current?.status ?? null),
        } as const;
      }

      const existingDocument = await tx.applicationDocument.findFirst({
        where: {
          applicationId: application.id,
          type: documentType,
        },
        select: {
          id: true,
          storagePath: true,
        },
      });

      const document = existingDocument
        ? await tx.applicationDocument.update({
            where: { id: existingDocument.id },
            data: {
              storagePath: uploadedStoragePath,
              originalName,
              mimeType: detectedMime,
              sizeBytes: file.size,
              verificationStatus: VerificationStatus.PENDING,
              verificationRemarks: null,
            },
            select: {
              id: true,
              type: true,
              originalName: true,
              mimeType: true,
              sizeBytes: true,
              verificationStatus: true,
              createdAt: true,
            },
          })
        : await tx.applicationDocument.create({
            data: {
              applicationId: application.id,
              type: documentType,
              storagePath: uploadedStoragePath,
              originalName,
              mimeType: detectedMime,
              sizeBytes: file.size,
            },
            select: {
              id: true,
              type: true,
              originalName: true,
              mimeType: true,
              sizeBytes: true,
              verificationStatus: true,
              createdAt: true,
            },
          });

      metadataWriteMayHaveCommitted = true;
      return {
        kind: "saved" as const,
        document,
        previousStoragePath: existingDocument?.storagePath ?? null,
      };
    });

    if (metadataResult.kind !== "saved") {
      await cleanupUploadedObject();
      return NextResponse.json(
        {
          error:
            metadataResult.kind === "not_found"
              ? "Draft application not found"
              : "Only a draft application can be changed",
        },
        { status: metadataResult.kind === "not_found" ? 404 : 409 },
      );
    }

    metadataCommitted = true;

    if (metadataResult.previousStoragePath) {
      try {
        const { error: deleteError } = await storageClient.storage
          .from(BUCKET)
          .remove([metadataResult.previousStoragePath]);

        if (deleteError) console.error("Old document cleanup failed.");
      } catch (error) {
        console.error(
          "Old document cleanup failed:",
          error instanceof Error ? error.name : "Unknown error",
        );
      }
    }

    return NextResponse.json({ document: metadataResult.document }, { status: 201 });
  } catch (error) {
    if (
      shouldCleanupUploadedObject(
        metadataCommitted,
        metadataWriteMayHaveCommitted,
      )
    ) {
      await cleanupUploadedObject();
    }

    console.error("Document upload request failed:", error);

    if (
      error instanceof Error &&
      (error.message.startsWith("Missing required environment variable:") ||
        error.message.startsWith("NEXT_PUBLIC_SUPABASE_URL must be"))
    ) {
      return NextResponse.json(
        { error: "Server storage configuration is missing" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unable to process document upload" },
      { status: 500 }
    );
  }
}
