import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/studentAuth";
import { prisma } from "@/lib/prisma";
import { validateStudentProfileUpdate } from "@/lib/studentProfileValidation";

export const runtime = "nodejs";

function toProfile(user: {
  id: string;
  email: string;
  fullName: string;
  student: {
    id: string;
    rollNumber: string;
    subCaste: string | null;
    annualIncome: { toString(): string } | null;
    academicPercentage: { toString(): string } | null;
    courseName: string | null;
    instituteName: string | null;
  };
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    studentId: user.student.id,
    rollNumber: user.student.rollNumber,
    subCaste: user.student.subCaste,
    annualIncome: user.student.annualIncome?.toString() ?? "",
    academicPercentage: user.student.academicPercentage?.toString() ?? "",
    courseName: user.student.courseName ?? "",
    instituteName: user.student.instituteName ?? "",
  };
}

export async function GET() {
  try {
    const auth = await requireStudent();
    if (auth.response) return auth.response;

    return NextResponse.json({ profile: toProfile(auth.user) });
  } catch (error) {
    console.error(
      "Unable to load student profile:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return NextResponse.json(
      { error: "Unable to load your profile." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireStudent();
    if (auth.response) return auth.response;

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const validation = validateStudentProfileUpdate(payload);
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: "Please correct the highlighted profile fields.",
          validationErrors: validation.errors,
        },
        { status: 400 },
      );
    }

    const { fullName, ...studentUpdate } = validation.value;
    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = fullName === undefined
        ? { fullName: auth.user.fullName }
        : await tx.user.update({
            where: { id: auth.user.id },
            data: { fullName },
            select: { fullName: true },
          });

      const updatedStudent = Object.keys(studentUpdate).length === 0
        ? auth.user.student
        : await tx.student.update({
            where: { id: auth.user.student.id },
            data: studentUpdate,
          });

      return {
        id: auth.user.id,
        email: auth.user.email,
        fullName: updatedUser.fullName,
        student: updatedStudent,
      };
    });

    return NextResponse.json({ profile: toProfile(updated) });
  } catch (error) {
    console.error(
      "Unable to update student profile:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return NextResponse.json(
      { error: "Unable to save your profile. Please try again." },
      { status: 500 },
    );
  }
}
