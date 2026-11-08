import { requiredApplicationDocumentTypes } from "@/lib/applicationRequirements";

export const SUPPORTED_POLICY_DOCUMENT_TYPES = [
  "CASTE_CERTIFICATE",
  "INCOME_CERTIFICATE",
  "IDENTITY_PROOF",
  "MARKSHEET",
  "ADMISSION_PROOF",
  "BANK_PROOF",
  "PHOTOGRAPH",
] as const;

export type VerificationDocumentType =
  (typeof SUPPORTED_POLICY_DOCUMENT_TYPES)[number];
export type CriteriaOperator =
  | "eq"
  | "ne"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "not_in";
type CriterionScalar = string | number | boolean;
type CriterionValue = CriterionScalar | CriterionScalar[];
type CriterionFieldType = "string" | "number" | "date";

export type EligibilityCriterion = {
  field: string;
  operator: CriteriaOperator;
  value: CriterionValue;
  reason_code?: string;
  explanation?: string;
};

export type PublishedEligibilityCriterion = EligibilityCriterion & {
  reason_code: string;
  explanation: string;
};

export type VerificationPolicyDraftInput = {
  eligibilityCriteria: unknown;
  requiredDocumentTypes: unknown;
  aiEligibleDocumentTypes: unknown;
  officialGuidelineReference?: unknown;
  guidelineRevision?: unknown;
};

export type ValidatedVerificationPolicyDraft = {
  eligibilityCriteria: EligibilityCriterion[];
  requiredDocumentTypes: VerificationDocumentType[];
  aiEligibleDocumentTypes: VerificationDocumentType[];
  officialGuidelineReference: string | null;
  guidelineRevision: string | null;
};

export type ValidatedPublishedVerificationPolicyDraft = Omit<
  ValidatedVerificationPolicyDraft,
  "eligibilityCriteria"
> & {
  eligibilityCriteria: PublishedEligibilityCriterion[];
};

export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; errors: string[] };

export type ScholarshipVerificationPolicyRecord = {
  id: string;
  schemeId: string;
  version: number;
  status: "DRAFT" | "PUBLISHED";
  isSynthetic: boolean;
  eligibilityCriteria: EligibilityCriterion[];
  requiredDocumentTypes: VerificationDocumentType[];
  aiEligibleDocumentTypes: VerificationDocumentType[];
  officialGuidelineReference: string | null;
  guidelineRevision: string | null;
  publishedById: string | null;
  publishedAt: Date | null;
};

export type VerificationPolicySnapshot = {
  schemaVersion: 1;
  policyId: string;
  schemeId: string;
  policyVersion: number;
  isSynthetic: boolean;
  eligibilityCriteria: PublishedEligibilityCriterion[];
  requiredDocumentTypes: VerificationDocumentType[];
  aiEligibleDocumentTypes: VerificationDocumentType[];
  officialGuidelineReference: string;
  guidelineRevision: string | null;
  publishedById: string;
  publishedAt: string;
};

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export type PolicyJobAssessment =
  | "LEGACY_UNASSESSED"
  | "POLICY_SNAPSHOT_MISSING"
  | "POLICY_SNAPSHOT_PRESENT";

type VerificationPolicySnapshotSource = Omit<
  ScholarshipVerificationPolicyRecord,
  "eligibilityCriteria" | "requiredDocumentTypes" | "aiEligibleDocumentTypes"
> & {
  eligibilityCriteria: unknown;
  requiredDocumentTypes: readonly string[];
  aiEligibleDocumentTypes: readonly string[];
};

const fieldTypes: Readonly<Record<string, CriterionFieldType>> = {
  annual_income: "number",
  date_of_birth: "date",
  gender: "string",
  category: "string",
  state: "string",
  district: "string",
  academic_level: "string",
  course: "string",
  specialization: "string",
  institution_name: "string",
  institution_type: "string",
  university_board: "string",
  current_year_semester: "string",
  admission_year: "number",
  expected_graduation_year: "number",
  family_members: "number",
  residential_status: "string",
  "personal.dateOfBirth": "date",
  "personal.gender": "string",
  "personal.category": "string",
  "personal.state": "string",
  "personal.district": "string",
  "academic.academicLevel": "string",
  "academic.course": "string",
  "academic.specialization": "string",
  "academic.institutionName": "string",
  "academic.institutionType": "string",
  "academic.universityBoard": "string",
  "academic.currentYearSemester": "string",
  "academic.admissionYear": "number",
  "academic.expectedGraduationYear": "number",
  "family.annualIncome": "number",
  "family.familyMembers": "number",
  "family.residentialStatus": "string",
};

export const ELIGIBILITY_CRITERIA_FIELDS = Object.entries(fieldTypes).map(
  ([field, valueType]) => ({ field, valueType }),
);

const allowedOperators = new Set<CriteriaOperator>([
  "eq",
  "ne",
  "lt",
  "lte",
  "gt",
  "gte",
  "in",
  "not_in",
]);
const scalarOperators = new Set<CriteriaOperator>([
  "eq",
  "ne",
  "lt",
  "lte",
  "gt",
  "gte",
]);
const orderedOperators = new Set<CriteriaOperator>([
  "lt",
  "lte",
  "gt",
  "gte",
]);
const documentTypeSet = new Set<string>(SUPPORTED_POLICY_DOCUMENT_TYPES);
const requiredDocumentTypeSet = new Set<string>(requiredApplicationDocumentTypes);
const executableTextPattern =
  /(?:=>|&&|\|\||\$\{|[{};`]|javascript:|<\/?script\b|\b(?:eval|function|require|import|process|globalThis|window|document|constructor|__proto__)\s*[.(\[])/i;
const reasonCodePattern = /^[A-Z][A-Z0-9_]{0,63}$/;

export function isVerificationDocumentType(
  value: string,
): value is VerificationDocumentType {
  return documentTypeSet.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function scalarMatchesType(
  value: unknown,
  fieldType: CriterionFieldType,
): value is CriterionScalar {
  if (fieldType === "number") {
    return typeof value === "number" && Number.isFinite(value);
  }
  if (typeof value !== "string" || !value.trim() || value.length > 500) {
    return false;
  }
  if (
    /[\u0000-\u001f\u007f]/.test(value) ||
    executableTextPattern.test(value)
  ) {
    return false;
  }
  return fieldType !== "date" || isValidDate(value);
}

function parseCriterion(
  value: unknown,
  requirePublicationMetadata: boolean,
): EligibilityCriterion | null {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value).sort();
  const hasPublicationMetadata =
    keys.length === 5 &&
    keys[0] === "explanation" &&
    keys[1] === "field" &&
    keys[2] === "operator" &&
    keys[3] === "reason_code" &&
    keys[4] === "value";
  const isLegacyShape =
    keys.length === 3 &&
    keys[0] === "field" &&
    keys[1] === "operator" &&
    keys[2] === "value";
  if (
    (!hasPublicationMetadata && !isLegacyShape) ||
    (requirePublicationMetadata && !hasPublicationMetadata) ||
    typeof value.field !== "string" ||
    typeof value.operator !== "string"
  ) {
    return null;
  }

  const fieldType = fieldTypes[value.field];
  const operator = value.operator as CriteriaOperator;
  if (!fieldType || !allowedOperators.has(operator)) return null;
  if (orderedOperators.has(operator) && fieldType === "string") return null;

  if (scalarOperators.has(operator)) {
    if (!scalarMatchesType(value.value, fieldType)) return null;
    const criterion: EligibilityCriterion = {
      field: value.field,
      operator,
      value: value.value,
    };
    if (hasPublicationMetadata) {
      if (
        typeof value.reason_code !== "string" ||
        !reasonCodePattern.test(value.reason_code) ||
        typeof value.explanation !== "string" ||
        !value.explanation.trim() ||
        value.explanation.trim().length > 1000 ||
        /[\u0000-\u001f\u007f<>]/.test(value.explanation) ||
        executableTextPattern.test(value.explanation)
      ) {
        return null;
      }
      criterion.reason_code = value.reason_code;
      criterion.explanation = value.explanation.trim();
    }
    return criterion;
  }

  if (
    (operator !== "in" && operator !== "not_in") ||
    !Array.isArray(value.value) ||
    value.value.length === 0 ||
    value.value.length > 100 ||
    !value.value.every((item) => scalarMatchesType(item, fieldType))
  ) {
    return null;
  }
  const uniqueValues = new Set(value.value.map((item) => `${typeof item}:${item}`));
  if (uniqueValues.size !== value.value.length) return null;

  const criterion: EligibilityCriterion = {
    field: value.field,
    operator,
    value: [...value.value] as CriterionScalar[],
  };
  if (hasPublicationMetadata) {
    if (
      typeof value.reason_code !== "string" ||
      !reasonCodePattern.test(value.reason_code) ||
      typeof value.explanation !== "string" ||
      !value.explanation.trim() ||
      value.explanation.trim().length > 1000 ||
      /[\u0000-\u001f\u007f<>]/.test(value.explanation) ||
      executableTextPattern.test(value.explanation)
    ) {
      return null;
    }
    criterion.reason_code = value.reason_code;
    criterion.explanation = value.explanation.trim();
  }
  return criterion;
}

export function validateEligibilityCriteria(
  value: unknown,
  options: { requirePublicationMetadata: true },
): ValidationResult<PublishedEligibilityCriterion[]>;
export function validateEligibilityCriteria(
  value: unknown,
  options?: { requirePublicationMetadata?: false },
): ValidationResult<EligibilityCriterion[]>;
export function validateEligibilityCriteria(
  value: unknown,
  options: { requirePublicationMetadata?: boolean } = {},
): ValidationResult<EligibilityCriterion[]> {
  if (!Array.isArray(value) || value.length > 100) {
    return {
      success: false,
      errors: ["Eligibility criteria must be an array of at most 100 rules."],
    };
  }

  const criteria: EligibilityCriterion[] = [];
  for (const [index, rawCriterion] of value.entries()) {
    const criterion = parseCriterion(
      rawCriterion,
      options.requirePublicationMetadata === true,
    );
    if (!criterion) {
      return {
        success: false,
        errors: [`Eligibility criterion ${index + 1} is invalid or unsupported.`],
      };
    }
    criteria.push(criterion);
  }
  return { success: true, value: criteria };
}

function validateDocumentTypes(
  value: unknown,
  label: string,
  maximum: number,
  allowedTypes: ReadonlySet<string>,
): ValidationResult<VerificationDocumentType[]> {
  if (!Array.isArray(value) || value.length > maximum) {
    return {
      success: false,
      errors: [`${label} must be a list of at most ${maximum} document types.`],
    };
  }
  if (
    value.some(
      (type) => typeof type !== "string" || !allowedTypes.has(type),
    )
  ) {
    return {
      success: false,
      errors: [`${label} contains an unsupported document type.`],
    };
  }
  if (new Set(value).size !== value.length) {
    return {
      success: false,
      errors: [`${label} must not contain duplicate document types.`],
    };
  }
  return {
    success: true,
    value: [...value] as VerificationDocumentType[],
  };
}

function optionalText(
  value: unknown,
  label: string,
  maximum: number,
): ValidationResult<string | null> {
  if (value === undefined || value === null || value === "") {
    return { success: true, value: null };
  }
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maximum ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return {
      success: false,
      errors: [`${label} must be non-empty text of at most ${maximum} characters.`],
    };
  }
  return { success: true, value: value.trim() };
}

export function validateVerificationPolicyDraft(
  input: VerificationPolicyDraftInput,
): ValidationResult<ValidatedVerificationPolicyDraft> {
  if (!isRecord(input)) {
    return { success: false, errors: ["Provide a valid verification policy."] };
  }

  const criteria = validateEligibilityCriteria(input.eligibilityCriteria);
  const requiredTypes = validateDocumentTypes(
    input.requiredDocumentTypes,
    "Required document types",
    SUPPORTED_POLICY_DOCUMENT_TYPES.length,
    requiredDocumentTypeSet,
  );
  const aiTypes = validateDocumentTypes(
    input.aiEligibleDocumentTypes,
    "AI-eligible document types",
    5,
    documentTypeSet,
  );
  const guidelineReference = optionalText(
    input.officialGuidelineReference,
    "Official guideline reference",
    2048,
  );
  const guidelineRevision = optionalText(
    input.guidelineRevision,
    "Guideline revision",
    120,
  );
  const errors = [
    ...(criteria.success ? [] : criteria.errors),
    ...(requiredTypes.success ? [] : requiredTypes.errors),
    ...(aiTypes.success ? [] : aiTypes.errors),
    ...(guidelineReference.success ? [] : guidelineReference.errors),
    ...(guidelineRevision.success ? [] : guidelineRevision.errors),
  ];
  if (
    errors.length > 0 ||
    !criteria.success ||
    !requiredTypes.success ||
    !aiTypes.success ||
    !guidelineReference.success ||
    !guidelineRevision.success
  ) {
    return {
      success: false,
      errors: errors.length > 0
        ? errors
        : ["Verification policy validation failed."],
    };
  }

  const requiredTypeSet = new Set(requiredTypes.value);
  if (aiTypes.value.some((type) => !requiredTypeSet.has(type))) {
    return {
      success: false,
      errors: ["AI-eligible document types must also be required document types."],
    };
  }

  return {
    success: true,
    value: {
      eligibilityCriteria: criteria.value,
      requiredDocumentTypes: requiredTypes.value,
      aiEligibleDocumentTypes: aiTypes.value,
      officialGuidelineReference: guidelineReference.value,
      guidelineRevision: guidelineRevision.value,
    },
  };
}

export function validateVerificationPolicyForPublication(
  input: VerificationPolicyDraftInput,
): ValidationResult<ValidatedPublishedVerificationPolicyDraft> {
  const draft = validateVerificationPolicyDraft(input);
  if (!draft.success) return draft;

  const errors: string[] = [];
  const criteria = validateEligibilityCriteria(input.eligibilityCriteria, {
    requirePublicationMetadata: true,
  });
  if (!criteria.success) {
    errors.push(...criteria.errors);
  } else if (criteria.value.length === 0) {
    errors.push("At least one eligibility criterion is required for publication.");
  }
  if (!draft.value.officialGuidelineReference) {
    errors.push("An official guideline reference is required for publication.");
  }
  if (draft.value.requiredDocumentTypes.length === 0) {
    errors.push("At least one required document type is required for publication.");
  }
  if (errors.length > 0) return { success: false, errors };
  if (!criteria.success) {
    return { success: false, errors: ["Published criteria validation failed."] };
  }
  return {
    success: true,
    value: {
      ...draft.value,
      eligibilityCriteria: criteria.value,
    },
  };
}

export function assertVerificationPolicyIsEditable(
  status: string,
): asserts status is "DRAFT" {
  if (status !== "DRAFT") {
    throw new Error(
      "Published verification policies are immutable; create a new draft version.",
    );
  }
}

export function createDraftFromPublishedPolicy(
  policy: ScholarshipVerificationPolicyRecord,
): Omit<
  ScholarshipVerificationPolicyRecord,
  "id" | "publishedById" | "publishedAt"
> & {
  publishedById: null;
  publishedAt: null;
} {
  if (policy.status !== "PUBLISHED") {
    throw new Error("A new policy version can only be created from a published policy.");
  }
  if (!Number.isSafeInteger(policy.version) || policy.version < 1) {
    throw new Error("Published policy version is invalid.");
  }
  return {
    schemeId: policy.schemeId,
    version: policy.version + 1,
    status: "DRAFT",
    isSynthetic: policy.isSynthetic,
    eligibilityCriteria: structuredClone(policy.eligibilityCriteria),
    requiredDocumentTypes: [...policy.requiredDocumentTypes],
    aiEligibleDocumentTypes: [...policy.aiEligibleDocumentTypes],
    officialGuidelineReference: policy.officialGuidelineReference,
    guidelineRevision: policy.guidelineRevision,
    publishedById: null,
    publishedAt: null,
  };
}

export function createVerificationPolicySnapshot(
  policy: VerificationPolicySnapshotSource,
): DeepReadonly<VerificationPolicySnapshot> {
  if (
    policy.status !== "PUBLISHED" ||
    !policy.publishedById ||
    !policy.publishedAt
  ) {
    throw new Error("Only a fully published policy can be snapshotted for a job.");
  }
  const validatedPolicy = validateVerificationPolicyForPublication({
    eligibilityCriteria: policy.eligibilityCriteria,
    requiredDocumentTypes: policy.requiredDocumentTypes,
    aiEligibleDocumentTypes: policy.aiEligibleDocumentTypes,
    officialGuidelineReference: policy.officialGuidelineReference,
    guidelineRevision: policy.guidelineRevision,
  });
  if (!validatedPolicy.success) {
    throw new Error("Published policy is incomplete or invalid.");
  }
  if (!validatedPolicy.value.officialGuidelineReference) {
    throw new Error("Published policy is missing its official guideline reference.");
  }
  const snapshot: VerificationPolicySnapshot = {
    schemaVersion: 1,
    policyId: policy.id,
    schemeId: policy.schemeId,
    policyVersion: policy.version,
    isSynthetic: policy.isSynthetic,
    eligibilityCriteria: structuredClone(validatedPolicy.value.eligibilityCriteria),
    requiredDocumentTypes: [...validatedPolicy.value.requiredDocumentTypes],
    aiEligibleDocumentTypes: [...validatedPolicy.value.aiEligibleDocumentTypes],
    officialGuidelineReference: validatedPolicy.value.officialGuidelineReference,
    guidelineRevision: validatedPolicy.value.guidelineRevision,
    publishedById: policy.publishedById,
    publishedAt: policy.publishedAt.toISOString(),
  };
  return deepFreeze(snapshot);
}

export function buildAiVerificationJobPolicyData(
  policy: VerificationPolicySnapshotSource | null,
): {
  policyId: string;
  policySnapshot: DeepReadonly<VerificationPolicySnapshot>;
  isSynthetic: boolean;
} | Record<string, never> {
  if (!policy) return {};
  return {
    policyId: policy.id,
    policySnapshot: createVerificationPolicySnapshot(policy),
    isSynthetic: policy.isSynthetic,
  };
}

export function getPolicyJobAssessment(
  policyId: string | null | undefined,
  policySnapshot: unknown,
): PolicyJobAssessment {
  if (!policyId && policySnapshot == null) return "LEGACY_UNASSESSED";
  if (!policyId || !isRecord(policySnapshot)) return "POLICY_SNAPSHOT_MISSING";
  return policySnapshot.policyId === policyId
    ? "POLICY_SNAPSHOT_PRESENT"
    : "POLICY_SNAPSHOT_MISSING";
}

function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value as DeepReadonly<T>;
}
