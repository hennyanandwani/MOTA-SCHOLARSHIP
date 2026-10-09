import type { Scheme } from '@/lib/schemes';

export const RULE_CATEGORIES = [
  'Age',
  'Income',
  'Category',
  'Academic',
  'Institution/Course',
  'Document',
  'Residency/Location',
  'Scheme-specific',
] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];
export type RulePriority = 'High' | 'Medium' | 'Low';
export type RuleStatus = 'Active' | 'Disabled';
export type RuleDataType = 'Numeric' | 'Text' | 'Boolean';
export type RuleOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'is true' | 'is false';
export type MissingDataBehavior = 'Require clarification' | 'Flag for official review' | 'Fail rule';

export type EligibilityRule = {
  id: string;
  name: string;
  description: string;
  schemeId: string;
  schemeName: string;
  category: RuleCategory;
  field: string;
  operator: RuleOperator;
  expectedValue: string;
  dataType: RuleDataType;
  priority: RulePriority;
  status: RuleStatus;
  missingDataBehavior: MissingDataBehavior;
  officialReviewRequired: boolean;
  passCondition: string;
  failCondition: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export const ADMIN_RULES_STORAGE_KEY = 'mota_admin_rules_state';

function createRule(
  scheme: Scheme,
  idSuffix: string,
  rule: Omit<EligibilityRule, 'id' | 'schemeId' | 'schemeName' | 'version' | 'createdAt' | 'updatedAt'>,
): EligibilityRule {
  const date = scheme.addedDate || '2026-09-01';
  return {
    ...rule,
    id: `${scheme.id.toUpperCase()}-${idSuffix}`,
    schemeId: scheme.id,
    schemeName: scheme.name,
    version: 1,
    createdAt: date,
    updatedAt: date,
  };
}

export function createInitialRules(schemes: Scheme[]): EligibilityRule[] {
  return schemes.flatMap((scheme) => {
    const limit = scheme.id === 'national-overseas-st' ? '600000' : '250000';
    const income = createRule(scheme, 'INC-01', {
      name: 'Annual family income ceiling',
      description: 'Checks declared annual family income against the configured illustrative scheme ceiling.',
      category: 'Income',
      field: 'familyIncome',
      operator: '<=',
      expectedValue: limit,
      dataType: 'Numeric',
      priority: 'High',
      status: 'Active',
      missingDataBehavior: 'Require clarification',
      officialReviewRequired: true,
      passCondition: `Declared family income is at or below ₹${Number(limit).toLocaleString('en-IN')}.`,
      failCondition: `Declared family income exceeds ₹${Number(limit).toLocaleString('en-IN')}.`,
    });
    const category = createRule(scheme, 'CAT-01', {
      name: 'Scheduled Tribe category',
      description: 'Confirms the declared applicant category; certificate authenticity is verified separately.',
      category: 'Category',
      field: 'category',
      operator: '=',
      expectedValue: 'Scheduled Tribe',
      dataType: 'Text',
      priority: 'High',
      status: 'Active',
      missingDataBehavior: 'Flag for official review',
      officialReviewRequired: true,
      passCondition: 'Declared category matches Scheduled Tribe.',
      failCondition: 'Declared category does not match the configured requirement.',
    });
    const academic = createRule(scheme, 'ACD-01', {
      name: 'Academic performance threshold',
      description: 'Demonstration check for the configured qualifying academic percentage.',
      category: 'Academic',
      field: 'academicPercentage',
      operator: '>=',
      expectedValue: '60',
      dataType: 'Numeric',
      priority: 'Medium',
      status: 'Active',
      missingDataBehavior: 'Require clarification',
      officialReviewRequired: true,
      passCondition: 'Recorded qualifying percentage is at least 60%.',
      failCondition: 'Recorded qualifying percentage is below 60%.',
    });
    const document = createRule(scheme, 'DOC-01', {
      name: 'ST certificate present',
      description: 'Checks whether an ST community certificate document has been supplied.',
      category: 'Document',
      field: 'stCertificatePresent',
      operator: 'is true',
      expectedValue: 'true',
      dataType: 'Boolean',
      priority: 'High',
      status: 'Active',
      missingDataBehavior: 'Flag for official review',
      officialReviewRequired: true,
      passCondition: 'A certificate document is recorded as present.',
      failCondition: 'A certificate document is explicitly recorded as absent.',
    });
    const schemeSpecific = createRule(scheme, 'SCH-01', {
      name: 'Scheme study level alignment',
      description: `Checks that the applicant's study level is consistent with the ${scheme.name} configuration.`,
      category: 'Scheme-specific',
      field: 'academicLevel',
      operator: 'contains',
      expectedValue: scheme.academicLevel,
      dataType: 'Text',
      priority: 'Medium',
      status: 'Active',
      missingDataBehavior: 'Flag for official review',
      officialReviewRequired: true,
      passCondition: `Study-level value includes “${scheme.academicLevel}”.`,
      failCondition: `Study-level value does not include “${scheme.academicLevel}”.`,
    });
    return [income, category, academic, document, schemeSpecific];
  });
}

export function isEligibilityRule(value: unknown): value is EligibilityRule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const rule = value as Partial<EligibilityRule>;
  return (
    typeof rule.id === 'string' &&
    typeof rule.name === 'string' &&
    typeof rule.description === 'string' &&
    typeof rule.schemeId === 'string' &&
    typeof rule.schemeName === 'string' &&
    RULE_CATEGORIES.includes(rule.category as RuleCategory) &&
    typeof rule.field === 'string' &&
    ['=', '!=', '>', '>=', '<', '<=', 'contains', 'is true', 'is false'].includes(rule.operator as string) &&
    typeof rule.expectedValue === 'string' &&
    ['Numeric', 'Text', 'Boolean'].includes(rule.dataType as string) &&
    ['High', 'Medium', 'Low'].includes(rule.priority as string) &&
    (rule.status === 'Active' || rule.status === 'Disabled') &&
    ['Require clarification', 'Flag for official review', 'Fail rule'].includes(rule.missingDataBehavior as string) &&
    typeof rule.officialReviewRequired === 'boolean' &&
    typeof rule.passCondition === 'string' &&
    typeof rule.failCondition === 'string' &&
    typeof rule.version === 'number' &&
    typeof rule.createdAt === 'string' &&
    typeof rule.updatedAt === 'string'
  );
}

export function isEligibilityRuleList(value: unknown): value is EligibilityRule[] {
  return Array.isArray(value) && value.every(isEligibilityRule);
}

export function formatCondition(rule: EligibilityRule): string {
  if (rule.dataType === 'Boolean') return `${rule.field} ${rule.operator}`;
  const displayValue = rule.dataType === 'Numeric' && /income/i.test(rule.field)
    ? `₹${Number(rule.expectedValue).toLocaleString('en-IN')}`
    : rule.dataType === 'Numeric' && /percentage/i.test(rule.field)
      ? `${rule.expectedValue}%`
      : rule.expectedValue;
  return `${rule.field} ${rule.operator} ${displayValue}`;
}

export type RulePreviewResult = 'PASS' | 'FAIL' | 'MISSING DATA' | 'REQUIRES OFFICIAL REVIEW';

export type RulePreview = {
  result: RulePreviewResult;
  explanation: string;
};

export function evaluateRulePreview(rule: EligibilityRule, input: string): RulePreview {
  if (input.trim() === '') {
    return {
      result: rule.missingDataBehavior === 'Fail rule' ? 'FAIL' : 'MISSING DATA',
      explanation: rule.missingDataBehavior === 'Fail rule'
        ? 'The configured missing-data behavior treats a missing value as a rule failure.'
        : `${rule.missingDataBehavior} is configured for missing values.`,
    };
  }

  let passed = false;
  if (rule.dataType === 'Numeric') {
    const actual = Number(input);
    const expected = Number(rule.expectedValue);
    if (!Number.isFinite(actual)) {
      return { result: 'MISSING DATA', explanation: 'Enter a valid numeric value to test this condition.' };
    }
    switch (rule.operator) {
      case '=': passed = actual === expected; break;
      case '!=': passed = actual !== expected; break;
      case '>': passed = actual > expected; break;
      case '>=': passed = actual >= expected; break;
      case '<': passed = actual < expected; break;
      case '<=': passed = actual <= expected; break;
      default: return { result: 'MISSING DATA', explanation: 'This operator is not supported for numeric data.' };
    }
  } else if (rule.dataType === 'Boolean') {
    const actual = input === 'true';
    passed = rule.operator === 'is true' ? actual : !actual;
  } else {
    const actual = input.trim().toLocaleLowerCase();
    const expected = rule.expectedValue.toLocaleLowerCase();
    if (rule.operator === '=') passed = actual === expected;
    else if (rule.operator === '!=') passed = actual !== expected;
    else if (rule.operator === 'contains') passed = actual.includes(expected);
    else return { result: 'MISSING DATA', explanation: 'This operator is not supported for text data.' };
  }

  if (rule.officialReviewRequired) {
    return {
      result: 'REQUIRES OFFICIAL REVIEW',
      explanation: passed
        ? `The value meets the configured condition. ${rule.passCondition} An official review is still required.`
        : `The value does not meet the configured condition. ${rule.failCondition} Refer to an authorized official; this preview makes no final decision.`,
    };
  }
  return {
    result: passed ? 'PASS' : 'FAIL',
    explanation: passed ? rule.passCondition : rule.failCondition,
  };
}
