export type StudentProfileUpdate = {
  fullName?: string;
  subCaste?: string | null;
  annualIncome?: string | null;
  academicPercentage?: string | null;
  courseName?: string | null;
  instituteName?: string | null;
};

type ValidationResult =
  | { ok: true; value: StudentProfileUpdate }
  | { ok: false; errors: Record<string, string> };

const allowedFields = new Set([
  "fullName",
  "subCaste",
  "annualIncome",
  "academicPercentage",
  "courseName",
  "instituteName",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalText(
  input: unknown,
  field: string,
  maxLength: number,
  errors: Record<string, string>,
): string | null | undefined {
  if (input === null || input === "") return null;
  if (typeof input !== "string") {
    errors[field] = "Enter valid text.";
    return undefined;
  }
  const value = input.trim();
  if (value.length > maxLength) {
    errors[field] = `Must be ${maxLength} characters or fewer.`;
    return undefined;
  }
  return value || null;
}

function parseDecimal(
  input: unknown,
  field: string,
  maximum: number,
  errors: Record<string, string>,
): string | null | undefined {
  if (input === null || input === "") return null;
  if (
    typeof input !== "string" ||
    !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input)
  ) {
    errors[field] = "Enter a non-negative number with at most two decimal places.";
    return undefined;
  }
  const value = Number(input);
  if (!Number.isFinite(value) || value > maximum) {
    errors[field] = `Must be no greater than ${maximum}.`;
    return undefined;
  }
  return input;
}

export function validateStudentProfileUpdate(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    return { ok: false, errors: { form: "A valid profile object is required." } };
  }

  const errors: Record<string, string> = {};
  const value: StudentProfileUpdate = {};
  const fields = Object.keys(input);

  for (const field of fields) {
    if (!allowedFields.has(field)) {
      errors[field] = "This profile field cannot be changed.";
    }
  }
  if (fields.length === 0) {
    errors.form = "Provide at least one profile field to update.";
  }

  if (Object.hasOwn(input, "fullName")) {
    const fullName = input.fullName;
    if (typeof fullName !== "string" || !fullName.trim()) {
      errors.fullName = "Full name is required.";
    } else if (fullName.trim().length > 120) {
      errors.fullName = "Full name must be 120 characters or fewer.";
    } else {
      value.fullName = fullName.trim();
    }
  }

  if (Object.hasOwn(input, "subCaste")) {
    const subCaste = parseOptionalText(input.subCaste, "subCaste", 120, errors);
    if (subCaste !== undefined) value.subCaste = subCaste;
  }
  if (Object.hasOwn(input, "courseName")) {
    const courseName = parseOptionalText(input.courseName, "courseName", 160, errors);
    if (courseName !== undefined) value.courseName = courseName;
  }
  if (Object.hasOwn(input, "instituteName")) {
    const instituteName = parseOptionalText(input.instituteName, "instituteName", 200, errors);
    if (instituteName !== undefined) value.instituteName = instituteName;
  }
  if (Object.hasOwn(input, "annualIncome")) {
    const annualIncome = parseDecimal(
      input.annualIncome,
      "annualIncome",
      9_999_999_999.99,
      errors,
    );
    if (annualIncome !== undefined) value.annualIncome = annualIncome;
  }
  if (Object.hasOwn(input, "academicPercentage")) {
    const academicPercentage = parseDecimal(
      input.academicPercentage,
      "academicPercentage",
      100,
      errors,
    );
    if (academicPercentage !== undefined) {
      value.academicPercentage = academicPercentage;
    }
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value };
}
