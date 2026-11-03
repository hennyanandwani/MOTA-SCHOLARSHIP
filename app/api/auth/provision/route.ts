
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  provisionStudentProfile,
  StudentProvisioningError,
} from "@/lib/auth/provision-student-profile";
import { assertDatabaseUrlConfigured, prisma } from "@/lib/prisma";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Please login first." },
      { status: 401 }
    );
  }

  try {
    assertDatabaseUrlConfigured();
    const existingUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { role: true },
    });

    if (existingUser?.role === "ADMIN") {
      return NextResponse.json({ success: true, role: "ADMIN" });
    }

    const appUser = await provisionStudentProfile(user);

    return NextResponse.json({ success: true, role: appUser.role });
  } catch (err) {
    if (err instanceof StudentProvisioningError) {
      switch (err.code) {
        case "INVALID_AUTH_ID":
          return NextResponse.json(
            { error: "The authenticated account could not be verified." },
            { status: 401 },
          );
        case "PROFILE_METADATA_MISSING":
          return NextResponse.json(
            {
              error:
                "Your student profile is missing required signup details. Contact support to complete your profile.",
            },
            { status: 400 },
          );
        case "EMAIL_ALREADY_LINKED":
          return NextResponse.json(
            { error: "This email is already linked to another account." },
            { status: 409 },
          );
        case "ROLL_NUMBER_ALREADY_REGISTERED":
          return NextResponse.json(
            { error: "This roll number is already registered." },
            { status: 409 },
          );
        case "ACCOUNT_ROLE_CONFLICT":
          return NextResponse.json(
            { error: "This account cannot be provisioned as a student." },
            { status: 403 },
          );
      }
    }

    console.error("Student provisioning failed.");
    return NextResponse.json(
      { error: "Student profile setup failed. Please try again." },
      { status: 500 }
    );
  }
}
