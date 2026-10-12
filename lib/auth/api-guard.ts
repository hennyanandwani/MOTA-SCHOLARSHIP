
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/generated/prisma/client";
import { getCurrentAppUser } from "@/lib/auth/current-user";

export async function authorizeApi(requiredRole?: UserRole) {
  const user = await getCurrentAppUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  if (requiredRole && user.role !== requiredRole) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "You are not authorized to perform this action." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    user,
  };
}
