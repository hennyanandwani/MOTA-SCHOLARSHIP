
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionStudentProfile } from "@/lib/auth/provision-student-profile";
import { getSafeAuthRedirectPath } from "@/lib/auth/safeAuthRedirect";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeAuthRedirectPath(searchParams.get("next"));
  let failureDestination = "/login?error=verification_failed";

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

          return new NextResponse(null, {
            status: 303,
            headers: { Location: next },
          });
        } catch (error) {
          failureDestination = "/login?error=profile_not_provisioned";
          console.error(
            "Student profile provisioning failed:",
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }
    }
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: failureDestination },
  });
}
