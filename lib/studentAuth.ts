import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import {
  getStudentAccessFailure,
  hasStudentProfile,
} from "@/lib/auth/studentAccessPolicy";

export async function requireStudent() {
  const user = await getCurrentAppUser();
  const failure = getStudentAccessFailure(
    user?.role ?? null,
    Boolean(user?.student),
  );

  if (failure) {
    return {
      user: null,
      response: NextResponse.json(
        { error: failure.message },
        { status: failure.status },
      ),
    };
  }

  if (!hasStudentProfile(user)) {
    throw new Error("Student access policy returned an invalid success state.");
  }

  return { user, response: null };
}
