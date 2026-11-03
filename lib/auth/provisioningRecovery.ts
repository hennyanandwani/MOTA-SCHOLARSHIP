export type ExistingUserRecoveryAction = "provision" | "reuse" | "role_conflict";

type ExistingProvisioningUser = {
  id: string;
  role: string;
  student: unknown | null;
};

export function getExistingUserRecoveryAction(
  user: ExistingProvisioningUser | null,
): ExistingUserRecoveryAction {
  if (!user) return "provision";
  if (user.role !== "STUDENT") return "role_conflict";
  return user.student ? "reuse" : "provision";
}

export function getProvisioningUniqueConflictCode(
  currentUserId: string | null,
  emailOwnerId: string | null,
  rollNumberOwnerId: string | null,
): "EMAIL_ALREADY_LINKED" | "ROLL_NUMBER_ALREADY_REGISTERED" | null {
  if (emailOwnerId && emailOwnerId !== currentUserId) {
    return "EMAIL_ALREADY_LINKED";
  }
  if (rollNumberOwnerId) {
    return "ROLL_NUMBER_ALREADY_REGISTERED";
  }
  return null;
}
