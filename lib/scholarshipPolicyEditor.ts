import {
  ELIGIBILITY_CRITERIA_FIELDS,
  SUPPORTED_POLICY_DOCUMENT_TYPES,
  type CriteriaOperator,
  type VerificationDocumentType,
} from "@/lib/scholarshipVerificationPolicy";

export type CriterionEditor = {
  field: string;
  operator: CriteriaOperator;
  valueText: string;
  reason_code: string;
  explanation: string;
};

export type PolicyEditor = {
  eligibilityCriteria: CriterionEditor[];
  requiredDocumentTypes: VerificationDocumentType[];
  aiEligibleDocumentTypes: VerificationDocumentType[];
  officialGuidelineReference: string;
  guidelineRevision: string;
};

export type PolicyEditorSource = {
  eligibilityCriteria: unknown;
  requiredDocumentTypes: readonly string[];
  aiEligibleDocumentTypes: readonly string[];
  officialGuidelineReference: string | null;
  guidelineRevision: string | null;
};

export const POLICY_CRITERIA_OPERATORS: CriteriaOperator[] = [
  "eq",
  "ne",
  "lt",
  "lte",
  "gt",
  "gte",
  "in",
  "not_in",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createEmptyPolicyEditor(): PolicyEditor {
  return {
    eligibilityCriteria: [],
    requiredDocumentTypes: [],
    aiEligibleDocumentTypes: [],
    officialGuidelineReference: "",
    guidelineRevision: "",
  };
}

export function addEligibilityCriterion(
  editor: PolicyEditor,
): PolicyEditor {
  return {
    ...editor,
    eligibilityCriteria: [
      ...editor.eligibilityCriteria,
      {
        field: "",
        operator: "eq",
        valueText: "",
        reason_code: "",
        explanation: "",
      },
    ],
  };
}

export function makePolicyEditor(
  policy?: PolicyEditorSource,
): PolicyEditor {
  const rawCriteria = Array.isArray(policy?.eligibilityCriteria)
    ? policy.eligibilityCriteria
    : [];
  return {
    eligibilityCriteria: rawCriteria.flatMap((criterion) => {
      if (!isRecord(criterion)) return [];
      const field = typeof criterion.field === "string" ? criterion.field : "";
      const operator = POLICY_CRITERIA_OPERATORS.includes(
        criterion.operator as CriteriaOperator,
      )
        ? (criterion.operator as CriteriaOperator)
        : "eq";
      const value = criterion.value;
      return [{
        field,
        operator,
        valueText: Array.isArray(value)
          ? value.map(String).join(", ")
          : value === undefined || value === null
            ? ""
            : String(value),
        reason_code:
          typeof criterion.reason_code === "string" ? criterion.reason_code : "",
        explanation:
          typeof criterion.explanation === "string" ? criterion.explanation : "",
      }];
    }),
    requiredDocumentTypes: (policy?.requiredDocumentTypes ?? []).filter(
      (type): type is VerificationDocumentType =>
        SUPPORTED_POLICY_DOCUMENT_TYPES.includes(
          type as VerificationDocumentType,
        ),
    ),
    aiEligibleDocumentTypes: (policy?.aiEligibleDocumentTypes ?? []).filter(
      (type): type is VerificationDocumentType =>
        SUPPORTED_POLICY_DOCUMENT_TYPES.includes(
          type as VerificationDocumentType,
        ),
    ),
    officialGuidelineReference: policy?.officialGuidelineReference ?? "",
    guidelineRevision: policy?.guidelineRevision ?? "",
  };
}

export function buildPolicyPayload(editor: PolicyEditor) {
  return {
    eligibilityCriteria: editor.eligibilityCriteria.map((criterion) => {
      const field = ELIGIBILITY_CRITERIA_FIELDS.find(
        (option) => option.field === criterion.field,
      );
      const isArray =
        criterion.operator === "in" || criterion.operator === "not_in";
      const trimmedValue = criterion.valueText.trim();
      const value = isArray
        ? criterion.valueText.split(",").map((part) => {
            const trimmed = part.trim();
            return field?.valueType === "number"
              ? trimmed
                ? Number(trimmed)
                : Number.NaN
              : trimmed;
          })
        : field?.valueType === "number"
          ? trimmedValue
            ? Number(trimmedValue)
            : Number.NaN
          : criterion.valueText;
      const base = {
        field: criterion.field,
        operator: criterion.operator,
        value,
      };
      return criterion.reason_code || criterion.explanation
        ? {
            ...base,
            reason_code: criterion.reason_code,
            explanation: criterion.explanation,
          }
        : base;
    }),
    requiredDocumentTypes: editor.requiredDocumentTypes,
    aiEligibleDocumentTypes: editor.aiEligibleDocumentTypes,
    officialGuidelineReference: editor.officialGuidelineReference,
    guidelineRevision: editor.guidelineRevision,
  };
}
