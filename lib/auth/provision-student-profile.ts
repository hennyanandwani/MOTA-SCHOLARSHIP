import type { User as SupabaseUser } from "@supabase/supabase-js";
import { assertDatabaseUrlConfigured, prisma } from "@/lib/prisma";
import {
  getExistingUserRecoveryAction,
  getProvisioningUniqueConflictCode,
} from "@/lib/auth/provisioningRecovery";
import { getInitialStudentAutoFillEnabled } from "@/lib/auth/studentAutoFill";

export type StudentProvisioningErrorCode =
  | "INVALID_AUTH_ID"
  | "PROFILE_METADATA_MISSING"
  | "EMAIL_ALREADY_LINKED"
  | "ROLL_NUMBER_ALREADY_REGISTERED"
  | "ACCOUNT_ROLE_CONFLICT";

export class StudentProvisioningError extends Error {
  constructor(readonly code: StudentProvisioningErrorCode) {
    super(code);
    this.name = "StudentProvisioningError";
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function readMetadataString(
  metadata: SupabaseUser["user_metadata"],
  key: string,
): string {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function provisionStudentProfile(authUser: SupabaseUser) {
  assertDatabaseUrlConfigured();

  if (!authUser.id.trim()) {
    throw new StudentProvisioningError("INVALID_AUTH_ID");
  }

  const email = authUser.email?.trim().toLowerCase() ?? "";
  const fullName = readMetadataString(authUser.user_metadata, "full_name");
  const rollNumber = readMetadataString(authUser.user_metadata, "roll_number");

  try {
    return await prisma.$transaction(async (tx) => {
      async function getAutoFillDefault() {
        const configuration = await tx.systemConfiguration.findUnique({
          where: { id: "default" },
          select: { defaultAutoFillEnabled: true },
        });
        return getInitialStudentAutoFillEnabled(configuration);
      }

      const existingUser = await tx.user.findUnique({
        where: { supabaseAuthId: authUser.id },
        include: { student: true },
      });

      const existingUserAction = getExistingUserRecoveryAction(existingUser);
      if (existingUserAction === "role_conflict") {
        throw new StudentProvisioningError("ACCOUNT_ROLE_CONFLICT");
      }
      if (existingUserAction === "reuse" && existingUser) {
        return existingUser;
      }

      if (existingUser) {
        if (!rollNumber || rollNumber.length > 50) {
          throw new StudentProvisioningError("PROFILE_METADATA_MISSING");
        }

        const autoFillEnabled = await getAutoFillDefault();
        await tx.student.create({
          data: {
            userId: existingUser.id,
            rollNumber,
            autoFillEnabled,
          },
        });

        return tx.user.findUniqueOrThrow({
          where: { id: existingUser.id },
          include: { student: true },
        });
      }

      if (
        !email ||
        !fullName ||
        fullName.length > 100 ||
        !rollNumber ||
        rollNumber.length > 50
      ) {
        throw new StudentProvisioningError("PROFILE_METADATA_MISSING");
      }

      const emailOwner = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (emailOwner) {
        throw new StudentProvisioningError("EMAIL_ALREADY_LINKED");
      }

      const autoFillEnabled = await getAutoFillDefault();
      return tx.user.create({
        data: {
          supabaseAuthId: authUser.id,
          email,
          fullName,
          role: "STUDENT",
          student: {
            create: { rollNumber, autoFillEnabled },
          },
        },
        include: { student: true },
      });
    });
  } catch (error) {
    if (error instanceof StudentProvisioningError || !isUniqueConstraintError(error)) {
      throw error;
    }

    const concurrentUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      include: { student: true },
    });

    const concurrentUserAction = getExistingUserRecoveryAction(concurrentUser);
    if (concurrentUserAction === "role_conflict") {
      throw new StudentProvisioningError("ACCOUNT_ROLE_CONFLICT");
    }
    if (concurrentUserAction === "reuse" && concurrentUser) {
      return concurrentUser;
    }

    const emailOwner = email
      ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
      : null;
    const rollNumberOwner = rollNumber
      ? await prisma.student.findUnique({
        where: { rollNumber },
        select: { id: true },
      })
      : null;
    const conflictCode = getProvisioningUniqueConflictCode(
      concurrentUser?.id ?? null,
      emailOwner?.id ?? null,
      rollNumberOwner?.id ?? null,
    );
    if (conflictCode) throw new StudentProvisioningError(conflictCode);

    throw error;
  }
}
