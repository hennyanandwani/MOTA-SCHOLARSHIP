
import { NextResponse } from "next/server";
import { ApplicationStatus } from "@/lib/generated/prisma/client";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type DraftBody = {
  schemeId?: unknown;
  applicationId?: unknown;
  academicYear?: unknown;
  currentStep?: unknown;
  data?: unknown;
  declarations?: unknown;
};

function cleanFormData(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  const allowedGroups = ["personal", "academic", "family", "bank"];

  for (const group of allowedGroups) {
    const fields = input[group];

    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      continue;
    }

    const cleaned: Record<string, string> = {};

    for (const [key, fieldValue] of Object.entries(
      fields as Record<string, unknown>
    )) {
      if (key === "confirmAccountNumber") continue;
      if (typeof fieldValue !== "string") continue;

      cleaned[key] = fieldValue.trim().slice(0, 2000);
    }

    result[group] = cleaned;
  }

  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  try {
    const user = await getCurrentAppUser();

    if (!user?.student) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.scholarshipApplication.findMany({
      where: { studentId: user.student.id },
      include: {
        scheme: true,
        documents: {
          select: {
            id: true,
            type: true,
            originalName: true,
            sizeBytes: true,
            verificationStatus: true,
            verificationRemarks: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Unable to load student applications:", error);
    return NextResponse.json(
      { error: "Unable to load applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();

    if (!user?.student) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: DraftBody;
    try {
      const payload: unknown = await request.json();
      if (!isRecord(payload)) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
      }
      body = payload as DraftBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const schemeId =
      typeof body.schemeId === "string" ? body.schemeId.trim() : "";

    if (!schemeId || schemeId.length > 120) {
      return NextResponse.json({ error: "Invalid schemeId" }, { status: 400 });
    }

    const scheme = await prisma.scholarshipScheme.findUnique({
      where: { id: schemeId },
      select: { id: true, isActive: true },
    });

    if (!scheme) {
      return NextResponse.json({ error: "Scholarship scheme not found" }, { status: 404 });
    }
    if (!scheme.isActive) {
      return NextResponse.json({ error: "Scholarship scheme is inactive" }, { status: 409 });
    }

    const data = cleanFormData(body.data);

    if (!data) {
      return NextResponse.json(
        { error: "Invalid application form data" },
        { status: 400 }
      );
    }

    const currentStep =
      typeof body.currentStep === "number" &&
      Number.isInteger(body.currentStep)
        ? Math.min(4, Math.max(1, body.currentStep))
        : 1;

    const academicYear =
      typeof body.academicYear === "string" &&
      /^\d{4}-\d{4}$/.test(body.academicYear)
        ? body.academicYear
        : "2026-2027";

    const existingDraft =
      typeof body.applicationId === "string"
        ? await prisma.scholarshipApplication.findFirst({
            where: {
              id: body.applicationId,
              studentId: user.student.id,
              status: ApplicationStatus.DRAFT,
            },
            select: { id: true, schemeId: true },
          })
        : await prisma.scholarshipApplication.findFirst({
            where: {
              studentId: user.student.id,
              schemeId: scheme.id,
              status: ApplicationStatus.DRAFT,
            },
            select: { id: true, schemeId: true },
            orderBy: { updatedAt: "desc" },
          });

    if (existingDraft && existingDraft.schemeId !== scheme.id) {
      return NextResponse.json(
        { error: "Draft does not belong to this scheme" },
        { status: 400 }
      );
    }

    const declarations =
      body.declarations &&
      typeof body.declarations === "object" &&
      !Array.isArray(body.declarations)
        ? (body.declarations as Record<string, unknown>)
        : {};

    const informationConfirmed =
      declarations.informationIsTrue === true;

    const verificationAcknowledged =
      declarations.verificationAcknowledged === true;
    const eligibilityNotGuaranteed =
      declarations.eligibilityNotGuaranteed === true;
    const termsAccepted = declarations.termsAccepted === true;
    const rawData = isRecord(body.data) ? body.data : {};
    const bankData = isRecord(rawData.bank) ? rawData.bank : {};
    const accountNumberConfirmed =
      typeof bankData.accountNumber === "string" &&
      typeof bankData.confirmAccountNumber === "string" &&
      bankData.accountNumber.trim().length > 0 &&
      bankData.accountNumber.trim() === bankData.confirmAccountNumber.trim();

    if (currentStep === 4 && !accountNumberConfirmed) {
      return NextResponse.json(
        { error: "Account numbers must match before continuing to review" },
        { status: 400 }
      );
    }

    const saved = existingDraft
      ? await prisma.scholarshipApplication.update({
          where: { id: existingDraft.id },
          data: {
            formData: data as never,
            currentStep,
            academicYear,
            informationConfirmed,
            verificationAcknowledged,
            eligibilityNotGuaranteed,
            termsAccepted,
            accountNumberConfirmed,
          },
          select: {
            id: true,
            applicationNumber: true,
            status: true,
            currentStep: true,
            updatedAt: true,
          },
        })
      : await prisma.scholarshipApplication.create({
          data: {
            applicationNumber: `DRAFT-${crypto.randomUUID()}`,
            studentId: user.student.id,
            schemeId: scheme.id,
            formData: data as never,
            currentStep,
            academicYear,
            informationConfirmed,
            verificationAcknowledged,
            eligibilityNotGuaranteed,
            termsAccepted,
            accountNumberConfirmed,
          },
          select: {
            id: true,
            applicationNumber: true,
            status: true,
            currentStep: true,
            updatedAt: true,
          },
        });

    return NextResponse.json({ application: saved });
  } catch (error) {
    console.error("Unable to save application draft:", error);
    return NextResponse.json(
      { error: "Unable to save application draft" },
      { status: 500 }
    );
  }
}
