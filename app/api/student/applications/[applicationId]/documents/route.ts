
import { createClient } from "@supabase/supabase-js";
import { DocumentType, ApplicationStatus, VerificationStatus } from "@/lib/generated/prisma/client";
import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const BUCKET = "scholarship-documents";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

function detectFileType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "application/pdf";
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  return null;
}

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error("SUPABASE_STORAGE_ENV_MISSING");
  }

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

  try {
    const user = await getCurrentAppUser();

    if (!user?.student) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId } = await context.params;

    const application = await prisma.scholarshipApplication.findFirst({
      where: {
        id: applicationId,
        studentId: user.student.id,
        status: ApplicationStatus.DRAFT,
      },
      select: { id: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Draft application not found" },
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

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be between 1 byte and 5 MB" },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detectedMime = detectFileType(bytes);

    if (
      !detectedMime ||
      !["application/pdf", "image/jpeg", "image/png"].includes(detectedMime)
    ) {
      return NextResponse.json(
        { error: "Only valid PDF, JPEG and PNG files are accepted" },
        { status: 400 }
      );
    }

    if (file.type && file.type !== detectedMime) {
      return NextResponse.json(
        { error: "File content does not match its declared type" },
        { status: 400 }
      );
    }

    storageClient = getStorageClient();

    const originalName = file.name
      .replace(/[/\\]/g, "_")
      .replace(/[^\w.\- ()]/g, "_")
      .slice(0, 180) || "document";

    storagePath = [
      user.student.id,
      application.id,
      `${crypto.randomUUID()}-${originalName}`,
    ].join("/");

    const { error: uploadError } = await storageClient.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
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

    const existingDocument = await prisma.applicationDocument.findFirst({
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
      ? await prisma.applicationDocument.update({
          where: { id: existingDocument.id },
          data: {
            storagePath,
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
      : await prisma.applicationDocument.create({
          data: {
            applicationId: application.id,
            type: documentType,
            storagePath,
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

    if (existingDocument) {
      const { error: deleteError } = await storageClient.storage
        .from(BUCKET)
        .remove([existingDocument.storagePath]);

      if (deleteError) {
        console.error("Old document cleanup failed:", deleteError.message);
      }
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    if (storagePath && storageClient) {
      const { error: cleanupError } = await storageClient.storage
        .from(BUCKET)
        .remove([storagePath]);

      if (cleanupError) {
        console.error("Upload cleanup failed:", cleanupError.message);
      }
    }

    console.error("Document upload request failed:", error);

    if (
      error instanceof Error &&
      error.message === "SUPABASE_STORAGE_ENV_MISSING"
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
