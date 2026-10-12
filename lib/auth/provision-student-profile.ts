
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export async function provisionStudentProfile(authUser: SupabaseUser) {
  const email = authUser.email?.trim().toLowerCase();
  const fullName = String(
    authUser.user_metadata?.full_name ?? ""
  ).trim();
  const rollNumber = String(
    authUser.user_metadata?.roll_number ?? ""
  ).trim();

  if (!email || !fullName || !rollNumber) {
    throw new Error("PROFILE_METADATA_MISSING");
  }

  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      include: { student: true },
    });

    if (existingUser) {
      if (!existingUser.student) {
        await tx.student.create({
          data: {
            userId: existingUser.id,
            rollNumber,
          },
        });
      }

      return tx.user.update({
        where: { id: existingUser.id },
        data: { email, fullName },
        include: { student: true },
      });
    }

    const emailOwner = await tx.user.findUnique({
      where: { email },
    });

    if (emailOwner) {
      throw new Error("EMAIL_ALREADY_LINKED");
    }

    return tx.user.create({
      data: {
        supabaseAuthId: authUser.id,
        email,
        fullName,
        role: "STUDENT",
        student: {
          create: {
            rollNumber,
          },
        },
      },
      include: { student: true },
    });
  });
}
