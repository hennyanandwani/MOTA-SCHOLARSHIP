export type PersistedSchemeType = "SCHOLARSHIP" | "FELLOWSHIP";

export type SchemeRecord = {
  id: string;
  name: string;
  description: string | null;
  type: PersistedSchemeType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SchemeWriteInput = {
  name?: string;
  description?: string | null;
  type?: PersistedSchemeType;
  isActive?: boolean;
};

type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

const allowedFields = new Set(["name", "description", "type", "isActive"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateFields(
  value: unknown,
  requireNameAndType: boolean,
): ValidationResult<SchemeWriteInput> {
  if (!isRecord(value)) {
    return { success: false, error: "Provide a valid scheme object." };
  }

  const keys = Object.keys(value);
  if (keys.some((key) => !allowedFields.has(key))) {
    return { success: false, error: "One or more scheme fields are not supported." };
  }
  if (keys.length === 0) {
    return { success: false, error: "Provide at least one scheme field to update." };
  }

  const input: SchemeWriteInput = {};

  if ("name" in value) {
    if (typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 200) {
      return { success: false, error: "Scheme name must be between 1 and 200 characters." };
    }
    input.name = value.name.trim();
  } else if (requireNameAndType) {
    return { success: false, error: "Scheme name is required." };
  }

  if ("description" in value) {
    if (value.description !== null && typeof value.description !== "string") {
      return { success: false, error: "Description must be text." };
    }
    const description = typeof value.description === "string" ? value.description.trim() : null;
    if (description && description.length > 4000) {
      return { success: false, error: "Description must be 4000 characters or fewer." };
    }
    input.description = description || null;
  }

  if ("type" in value) {
    if (value.type !== "SCHOLARSHIP" && value.type !== "FELLOWSHIP") {
      return { success: false, error: "Choose a supported scheme type." };
    }
    input.type = value.type;
  } else if (requireNameAndType) {
    return { success: false, error: "Scheme type is required." };
  }

  if ("isActive" in value) {
    if (typeof value.isActive !== "boolean") {
      return { success: false, error: "Active status must be true or false." };
    }
    input.isActive = value.isActive;
  } else if (requireNameAndType) {
    input.isActive = true;
  }

  return { success: true, value: input };
}

export function validateSchemeCreateInput(value: unknown): ValidationResult<SchemeWriteInput> {
  return validateFields(value, true);
}

export function validateSchemeUpdateInput(value: unknown): ValidationResult<SchemeWriteInput> {
  return validateFields(value, false);
}

export function isSchemeRecord(value: unknown): value is SchemeRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    (value.type === "SCHOLARSHIP" || value.type === "FELLOWSHIP") &&
    typeof value.isActive === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

export function isSchemeUniqueConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
