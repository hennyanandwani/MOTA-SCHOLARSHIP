
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionStudentProfile } from "@/lib/auth/provision-student-profile";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");

  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/student";

  if (code) {
    const supabase = await createClient();

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (user && !userError) {
        try {
          await provisionStudentProfile(user);

          return NextResponse.redirect(new URL(next, origin));
        } catch (error) {
          console.error(
            "Student profile provisioning failed:",
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=verification_failed", origin)
  );
}
