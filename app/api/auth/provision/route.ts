
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionStudentProfile } from "@/lib/auth/provision-student-profile";

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
    await provisionStudentProfile(user);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "PROFILE_METADATA_MISSING") {
        return NextResponse.json(
          { error: "Profile details missing. Please sign up again." },
          { status: 400 }
        );
      }

      if (err.message === "EMAIL_ALREADY_LINKED") {
        return NextResponse.json(
          { error: "This email is already linked to another account." },
          { status: 409 }
        );
      }

      if ("code" in err && err.code === "P2002") {
        return NextResponse.json(
          { error: "This roll number is already registered." },
          { status: 409 }
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
