import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/studentAuth";
import { prisma } from "@/lib/prisma";
import { getStudentAiReason } from "@/lib/phase6Workflow";
import { isRetryableTechnicalFailure } from "@/lib/studentAiRetry";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    const auth = await requireStudent();
    if (auth.response) return auth.response;

    const { applicationId } = await context.params;
    if (!applicationId || applicationId.length > 120) {
      return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });
    }

    const application = await prisma.scholarshipApplication.findFirst({
      where: { id: applicationId, studentId: auth.user.student.id },
      select: {
        aiVerificationStatus: true,
        aiInputVersion: true,
        studentAiReason: true,
        aiVerificationJobs: {
          orderBy: { inputVersion: "desc" },
          take: 1,
          select: {
            inputVersion: true,
            status: true,
            outcome: true,
            lastErrorCode: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    return NextResponse.json({
      status: application.aiVerificationStatus,
      reason: getStudentAiReason(
        application.aiVerificationStatus,
        application.studentAiReason,
      ),
      retryAvailable: isRetryableTechnicalFailure({
        verificationStatus: application.aiVerificationStatus,
        currentInputVersion: application.aiInputVersion,
        jobInputVersion: application.aiVerificationJobs[0]?.inputVersion ?? -1,
        jobStatus: application.aiVerificationJobs[0]?.status ?? "",
        jobOutcome: application.aiVerificationJobs[0]?.outcome ?? null,
        lastErrorCode: application.aiVerificationJobs[0]?.lastErrorCode ?? null,
      }),
    });
  } catch (error) {
    console.error(
      "Unable to load student AI verification status:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return NextResponse.json(
      { error: "Unable to load AI verification status." },
      { status: 500 },
    );
  }
}
