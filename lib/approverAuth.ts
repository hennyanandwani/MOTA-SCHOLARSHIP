import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/current-user";

export async function requireApprover() {
  const user = await getCurrentAppUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }
  if (user.role !== "APPROVER") {
    return {
      user: null,
      response: NextResponse.json({ error: "Approver access required." }, { status: 403 }),
    };
  }
  return { user, response: null };
}
