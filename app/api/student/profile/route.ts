import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/studentAuth";
import {
  getStudentProfileSectionTimestampUpdates,
  validateStudentProfileUpdate,
} from "@/lib/studentProfileValidation";

export const runtime = "nodejs";

type AuthenticatedStudentUser = NonNullable<
  Extract<Awaited<ReturnType<typeof requireStudent>>, { response: null }>["user"]
>;

function toProfile(user: AuthenticatedStudentUser) {
  const student = user.student;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    studentId: student.id,
    rollNumber: student.rollNumber,
    autoFillEnabled: student.autoFillEnabled,
    subCaste: student.subCaste ?? "",
    annualIncome: student.annualIncome?.toString() ?? "",
    academicPercentage: student.academicPercentage?.toString() ?? "",
    courseName: student.courseName ?? "",
    instituteName: student.instituteName ?? "",
    firstName: student.firstName ?? "",
    middleName: student.middleName ?? "",
    lastName: student.lastName ?? "",
    dateOfBirth: student.dateOfBirth?.toISOString().slice(0, 10) ?? "",
    gender: student.gender ?? "",
    category: student.category ?? "",
    stCertificateNumber: student.stCertificateNumber ?? "",
    mobileNumber: student.mobileNumber ?? "",
    address: student.address ?? "",
    villageTown: student.villageTown ?? "",
    district: student.district ?? "",
    state: student.state ?? "",
    pinCode: student.pinCode ?? "",
    academicLevel: student.academicLevel ?? "",
    specialization: student.specialization ?? "",
    institutionType: student.institutionType ?? "",
    universityBoard: student.universityBoard ?? "",
    currentYearSemester: student.currentYearSemester ?? "",
    admissionYear: student.admissionYear,
    academicSession: student.academicSession ?? "",
    previousQualification: student.previousQualification ?? "",
    previousResult: student.previousResult ?? "",
    enrollmentNumber: student.enrollmentNumber ?? "",
    expectedGraduationYear: student.expectedGraduationYear,
    guardianName: student.guardianName ?? "",
    motherName: student.motherName ?? "",
    familyAnnualIncome: student.familyAnnualIncome?.toString() ?? "",
    incomeCertificateNumber: student.incomeCertificateNumber ?? "",
    guardianOccupation: student.guardianOccupation ?? "",
    familyMembers: student.familyMembers,
    residentialStatus: student.residentialStatus ?? "",
    accountHolderName: student.accountHolderName ?? "",
    bankName: student.bankName ?? "",
    accountNumber: student.accountNumber ?? "",
    ifscCode: student.ifscCode ?? "",
    branchName: student.branchName ?? "",
    personalInfoUpdatedAt: student.personalInfoUpdatedAt,
    contactInfoUpdatedAt: student.contactInfoUpdatedAt,
    academicInfoUpdatedAt: student.academicInfoUpdatedAt,
    familyInfoUpdatedAt: student.familyInfoUpdatedAt,
    bankInfoUpdatedAt: student.bankInfoUpdatedAt,
  };
}

export async function GET() {
  try {
    const auth = await requireStudent();
    if (auth.response) return auth.response;

    return NextResponse.json({ profile: toProfile(auth.user) });
  } catch {
    console.error("Unable to load student profile.");
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
    Object.assign(
      studentUpdate,
      getStudentProfileSectionTimestampUpdates(validation.value, new Date()),
    );

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
        ...auth.user,
        fullName: updatedUser.fullName,
        student: updatedStudent,
      };
    });

    return NextResponse.json({ profile: toProfile(updated) });
  } catch {
    console.error("Unable to update student profile.");
    return NextResponse.json(
      { error: "Unable to save your profile. Please try again." },
      { status: 500 },
    );
  }
}
