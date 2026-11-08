import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/studentAuth";
import { prisma } from "@/lib/prisma";
import { getStudentAiReason } from "@/lib/phase6Workflow";

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
      select: { aiVerificationStatus: true, studentAiReason: true },
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
