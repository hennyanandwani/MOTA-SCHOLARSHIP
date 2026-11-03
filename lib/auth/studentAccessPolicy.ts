export type StudentAccessFailure = {
  status: 401 | 403 | 409;
  message: string;
};

export function hasStudentProfile<T extends { role: string; student: object | null }>(
  user: T | null,
): user is T & { student: NonNullable<T["student"]> } {
  return Boolean(user && user.role === "STUDENT" && user.student);
}

export function getStudentAccessFailure(
  role: string | null,
  hasStudentProfile: boolean,
): StudentAccessFailure | null {
  if (role === null) {
    return { status: 401, message: "Authentication required." };
  }

  if (role !== "STUDENT") {
    return { status: 403, message: "Student access required." };
  }

  if (!hasStudentProfile) {
    return {
      status: 409,
      message: "Student profile setup is required before using this service.",
    };
  }

  return null;
}
