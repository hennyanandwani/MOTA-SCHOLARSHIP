export type StudentProfileUpdate = {
  fullName?: string;
  subCaste?: string | null;
  annualIncome?: string | null;
  academicPercentage?: string | null;
  courseName?: string | null;
  instituteName?: string | null;
  autoFillEnabled?: boolean;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  category?: string | null;
  stCertificateNumber?: string | null;
  mobileNumber?: string | null;
  address?: string | null;
  villageTown?: string | null;
  district?: string | null;
  state?: string | null;
  pinCode?: string | null;
  academicLevel?: string | null;
  specialization?: string | null;
  institutionType?: string | null;
  universityBoard?: string | null;
  currentYearSemester?: string | null;
  admissionYear?: number | null;
  academicSession?: string | null;
  previousQualification?: string | null;
  previousResult?: string | null;
  enrollmentNumber?: string | null;
  expectedGraduationYear?: number | null;
  guardianName?: string | null;
  motherName?: string | null;
  familyAnnualIncome?: string | null;
  incomeCertificateNumber?: string | null;
  guardianOccupation?: string | null;
  familyMembers?: number | null;
  residentialStatus?: string | null;
  accountHolderName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  branchName?: string | null;
};

type ValidationResult =
  | { ok: true; value: StudentProfileUpdate }
  | { ok: false; errors: Record<string, string> };

type SectionTimestampField =
  | "personalInfoUpdatedAt"
  | "contactInfoUpdatedAt"
  | "academicInfoUpdatedAt"
  | "familyInfoUpdatedAt"
  | "bankInfoUpdatedAt";

const allowedFields = new Set([
  "fullName",
  "subCaste",
  "annualIncome",
  "academicPercentage",
  "courseName",
  "instituteName",
  "autoFillEnabled",
  "firstName",
  "middleName",
  "lastName",
  "dateOfBirth",
  "gender",
  "category",
  "stCertificateNumber",
  "mobileNumber",
  "address",
  "villageTown",
  "district",
  "state",
  "pinCode",
  "academicLevel",
  "specialization",
  "institutionType",
  "universityBoard",
  "currentYearSemester",
  "admissionYear",
  "academicSession",
  "previousQualification",
  "previousResult",
  "enrollmentNumber",
  "expectedGraduationYear",
  "guardianName",
  "motherName",
  "familyAnnualIncome",
  "incomeCertificateNumber",
  "guardianOccupation",
  "familyMembers",
  "residentialStatus",
  "accountHolderName",
  "bankName",
  "accountNumber",
  "ifscCode",
  "branchName",
]);

const textFieldLimits = {
  firstName: 100,
  middleName: 100,
  lastName: 100,
  stCertificateNumber: 120,
  mobileNumber: 16,
  address: 500,
  villageTown: 120,
  district: 120,
  state: 120,
  pinCode: 6,
  academicLevel: 100,
  specialization: 160,
  institutionType: 100,
  universityBoard: 200,
  currentYearSemester: 80,
  academicSession: 80,
  previousQualification: 160,
  previousResult: 100,
  enrollmentNumber: 120,
  guardianName: 120,
  motherName: 120,
  incomeCertificateNumber: 120,
  guardianOccupation: 120,
  residentialStatus: 80,
  accountHolderName: 120,
  bankName: 160,
  accountNumber: 20,
  ifscCode: 11,
  branchName: 160,
  subCaste: 120,
  courseName: 160,
  instituteName: 200,
} as const;

const sectionFields: Record<
  SectionTimestampField,
  readonly (keyof StudentProfileUpdate)[]
> = {
  personalInfoUpdatedAt: [
    "fullName",
    "firstName",
    "middleName",
    "lastName",
    "dateOfBirth",
    "gender",
    "category",
    "stCertificateNumber",
    "subCaste",
  ],
  contactInfoUpdatedAt: [
    "mobileNumber",
    "address",
    "villageTown",
    "district",
    "state",
    "pinCode",
  ],
  academicInfoUpdatedAt: [
    "academicLevel",
    "courseName",
    "specialization",
    "instituteName",
    "institutionType",
    "universityBoard",
    "currentYearSemester",
    "admissionYear",
    "academicSession",
    "previousQualification",
    "previousResult",
    "enrollmentNumber",
    "expectedGraduationYear",
    "academicPercentage",
  ],
  familyInfoUpdatedAt: [
    "guardianName",
    "motherName",
    "familyAnnualIncome",
    "incomeCertificateNumber",
    "guardianOccupation",
    "familyMembers",
    "residentialStatus",
  ],
  bankInfoUpdatedAt: [
    "accountHolderName",
    "bankName",
    "accountNumber",
    "ifscCode",
    "branchName",
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalText(
  input: unknown,
  field: string,
  maxLength: number,
  errors: Record<string, string>,
  trim = false,
): string | null | undefined {
  if (input === null || input === "") return null;
  if (typeof input !== "string") {
    errors[field] = "Enter valid text.";
    return undefined;
  }
  const value = trim ? input.trim() : input;
  if (value.length > maxLength) {
    errors[field] = `Must be ${maxLength} characters or fewer.`;
    return undefined;
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) {
    errors[field] = "Enter valid text.";
    return undefined;
  }
  return trim ? value || null : value;
}

function parseDecimal(
  input: unknown,
  field: string,
  maximum: number,
  errors: Record<string, string>,
  allowNumber = false,
): string | null | undefined {
  if (input === null || input === "") return null;
  const source = typeof input === "number" && allowNumber ? String(input) : input;
  if (
    typeof source !== "string" ||
    !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(source)
  ) {
    errors[field] = "Enter a non-negative number with at most two decimal places.";
    return undefined;
  }
  const value = Number(source);
  if (!Number.isFinite(value) || value > maximum) {
    errors[field] = `Must be no greater than ${maximum}.`;
    return undefined;
  }
  return source;
}

function parseInteger(
  input: unknown,
  field: string,
  minimum: number,
  maximum: number,
  errors: Record<string, string>,
): number | null | undefined {
  if (input === null || input === "") return null;
  if (
    (typeof input !== "number" && typeof input !== "string") ||
    (typeof input === "number" && !Number.isInteger(input)) ||
    (typeof input === "string" && !/^\d+$/.test(input))
  ) {
    errors[field] = "Enter a valid whole number.";
    return undefined;
  }
  const value = Number(input);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    errors[field] = `Enter a whole number from ${minimum} to ${maximum}.`;
    return undefined;
  }
  return value;
}

function parseDateOfBirth(
  input: unknown,
  errors: Record<string, string>,
): Date | null | undefined {
  if (input === null || input === "") return null;
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    errors.dateOfBirth = "Enter a valid date of birth.";
    return undefined;
  }
  const date = new Date(`${input}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input
  ) {
    errors.dateOfBirth = "Enter a valid date of birth.";
    return undefined;
  }
  if (input > new Date().toISOString().slice(0, 10)) {
    errors.dateOfBirth = "Date of birth cannot be in the future.";
    return undefined;
  }
  return date;
}

function parseEnum(
  input: unknown,
  field: string,
  options: readonly string[],
  errors: Record<string, string>,
): string | null | undefined {
  if (input === null || input === "") return null;
  if (typeof input !== "string" || !options.includes(input)) {
    errors[field] = "Select a valid option.";
    return undefined;
  }
  return input;
}

export function getStudentProfileSectionTimestampUpdates(
  update: StudentProfileUpdate,
  updatedAt: Date,
): Partial<Record<SectionTimestampField, Date>> {
  const timestamps: Partial<Record<SectionTimestampField, Date>> = {};
  for (const [timestampField, fields] of Object.entries(sectionFields) as [
    SectionTimestampField,
    readonly (keyof StudentProfileUpdate)[],
  ][]) {
    if (fields.some((field) => Object.hasOwn(update, field))) {
      timestamps[timestampField] = updatedAt;
    }
  }
  return timestamps;
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

  for (const [field, maxLength] of Object.entries(textFieldLimits) as [
    keyof typeof textFieldLimits,
    number,
  ][]) {
    if (!Object.hasOwn(input, field)) continue;
    const text = parseOptionalText(
      input[field],
      field,
      maxLength,
      errors,
      ["subCaste", "courseName", "instituteName"].includes(field),
    );
    if (text !== undefined) Object.assign(value, { [field]: text });
  }

  if (Object.hasOwn(input, "gender")) {
    const gender = parseEnum(
      input.gender,
      "gender",
      ["Male", "Female", "Other", "Prefer not to say"],
      errors,
    );
    if (gender !== undefined) value.gender = gender;
  }
  if (Object.hasOwn(input, "category")) {
    const category = parseEnum(
      input.category,
      "category",
      ["Scheduled Tribe"],
      errors,
    );
    if (category !== undefined) value.category = category;
  }
  if (Object.hasOwn(input, "dateOfBirth")) {
    const dateOfBirth = parseDateOfBirth(input.dateOfBirth, errors);
    if (dateOfBirth !== undefined) value.dateOfBirth = dateOfBirth;
  }
  if (Object.hasOwn(input, "mobileNumber")) {
    const mobileNumber = input.mobileNumber;
    if (
      mobileNumber !== null &&
      mobileNumber !== "" &&
      (typeof mobileNumber !== "string" ||
        !/^(?:(?:\+91|91|0)[ -]?)?[6-9]\d{9}$/.test(mobileNumber))
    ) {
      errors.mobileNumber = "Enter a valid Indian mobile number.";
    }
  }
  if (Object.hasOwn(input, "pinCode")) {
    const pinCode = input.pinCode;
    if (
      pinCode !== null &&
      pinCode !== "" &&
      (typeof pinCode !== "string" || !/^[1-9]\d{5}$/.test(pinCode))
    ) {
      errors.pinCode = "Enter a valid six-digit Indian PIN code.";
    }
  }
  if (Object.hasOwn(input, "accountNumber")) {
    const accountNumber = input.accountNumber;
    if (
      accountNumber !== null &&
      accountNumber !== "" &&
      (typeof accountNumber !== "string" ||
        !/^\d{6,20}$/.test(accountNumber))
    ) {
      errors.accountNumber = "Enter a valid bank account number.";
    }
  }
  if (Object.hasOwn(input, "ifscCode")) {
    const ifscCode = input.ifscCode;
    if (
      ifscCode !== null &&
      ifscCode !== "" &&
      (typeof ifscCode !== "string" ||
        !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifscCode))
    ) {
      errors.ifscCode = "Enter a valid IFSC code.";
    }
  }

  const currentYear = new Date().getFullYear();
  if (Object.hasOwn(input, "admissionYear")) {
    const admissionYear = parseInteger(
      input.admissionYear,
      "admissionYear",
      1950,
      currentYear + 1,
      errors,
    );
    if (admissionYear !== undefined) value.admissionYear = admissionYear;
  }
  if (Object.hasOwn(input, "expectedGraduationYear")) {
    const expectedGraduationYear = parseInteger(
      input.expectedGraduationYear,
      "expectedGraduationYear",
      1950,
      currentYear + 15,
      errors,
    );
    if (expectedGraduationYear !== undefined) {
      value.expectedGraduationYear = expectedGraduationYear;
    }
  }
  if (Object.hasOwn(input, "familyMembers")) {
    const familyMembers = parseInteger(
      input.familyMembers,
      "familyMembers",
      1,
      1000,
      errors,
    );
    if (familyMembers !== undefined) value.familyMembers = familyMembers;
  }
  if (Object.hasOwn(input, "familyAnnualIncome")) {
    const familyAnnualIncome = parseDecimal(
      input.familyAnnualIncome,
      "familyAnnualIncome",
      9_999_999_999.99,
      errors,
      true,
    );
    if (familyAnnualIncome !== undefined) {
      value.familyAnnualIncome = familyAnnualIncome;
    }
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
  if (Object.hasOwn(input, "autoFillEnabled")) {
    if (typeof input.autoFillEnabled !== "boolean") {
      errors.autoFillEnabled = "Enter a valid boolean value.";
    } else {
      value.autoFillEnabled = input.autoFillEnabled;
    }
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value };
}
