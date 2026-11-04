export type DraftLockFailure = "not_found" | "not_editable";

export function getDraftLockFailure(
  ownedApplicationStatus: string | null,
): DraftLockFailure {
  return ownedApplicationStatus === null ? "not_found" : "not_editable";
}

export function getDraftLookupScope(
  studentId: string,
  schemeId: string,
  academicYear: string,
) {
  return { studentId, schemeId, academicYear };
}

export function shouldCleanupUploadedObject(
  metadataCommitted: boolean,
  metadataWriteMayHaveCommitted = false,
): boolean {
  return !metadataCommitted && !metadataWriteMayHaveCommitted;
}

export function getOwnedApplicationScope(applicationId: string, studentId: string) {
  return { id: applicationId, studentId };
}

export function isSerializableTransactionConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}
