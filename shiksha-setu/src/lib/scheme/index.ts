import jsonLogic from 'json-logic-js';

import type { FormSection, FieldDef, DocumentDef, RuleDef, SchemeConfig } from '@/types';

// ─── Rule Evaluation ──────────────────────────────────────────────────────────

export type RuleStatus = 'met' | 'failed' | 'unsure';

export interface RuleResult {
  key: string;
  status: RuleStatus;
  reason: { en: string; hi?: string };
  evidence?: Record<string, unknown>;
}

/**
 * Evaluates all rules in a scheme against the provided data.
 * Returns 'unsure' when required data dependencies are missing.
 */
export function evaluateRules(
  scheme: SchemeConfig,
  data: Record<string, unknown>
): RuleResult[] {
  return scheme.rules.map((rule) => {
    // Check if all required data dependencies are present
    const missingDeps = rule.dataDeps.filter(
      (dep) => data[dep] === undefined || data[dep] === null || data[dep] === ''
    );

    if (missingDeps.length > 0) {
      return {
        key: rule.key,
        status: 'unsure' as RuleStatus,
        reason: {
          en: `Missing data: ${missingDeps.join(', ')}`,
          hi: `डेटा अनुपलब्ध: ${missingDeps.join(', ')}`,
        },
        evidence: { missingDeps },
      };
    }

    try {
      const result = jsonLogic.apply(rule.logic as Parameters<typeof jsonLogic.apply>[0], data);
      const passed = Boolean(result);

      return {
        key: rule.key,
        status: passed ? ('met' as RuleStatus) : ('failed' as RuleStatus),
        reason: passed ? rule.explainMet : rule.explainFail,
        evidence: { result, data: Object.fromEntries(rule.dataDeps.map((d) => [d, data[d]])) },
      };
    } catch (_err) {
      return {
        key: rule.key,
        status: 'unsure' as RuleStatus,
        reason: { en: 'Could not evaluate rule', hi: 'नियम का मूल्यांकन नहीं हो सका' },
      };
    }
  });
}

// ─── Form Resolution ──────────────────────────────────────────────────────────

/**
 * Returns the list of visible sections and fields based on showIf conditions.
 * Pure function — no React.
 */
export function resolveForm(
  scheme: SchemeConfig,
  data: Record<string, unknown>
): FormSection[] {
  return scheme.sections
    .filter((section) => {
      if (!section.showIf) return true;
      try {
        return Boolean(jsonLogic.apply(section.showIf as Parameters<typeof jsonLogic.apply>[0], data));
      } catch {
        return true; // show by default on error
      }
    })
    .map((section) => ({
      ...section,
      fields: section.fields.filter((field) => {
        if (!field.showIf) return true;
        try {
          return Boolean(jsonLogic.apply(field.showIf as Parameters<typeof jsonLogic.apply>[0], data));
        } catch {
          return true;
        }
      }),
    }))
    .filter((section) => section.fields.length > 0);
}

// ─── Document Resolution ──────────────────────────────────────────────────────

/**
 * Returns the list of required documents based on showIf conditions.
 * Pure function — no React.
 */
export function resolveDocuments(
  scheme: SchemeConfig,
  data: Record<string, unknown>
): DocumentDef[] {
  return scheme.documents.filter((doc) => {
    if (!doc.showIf) return true;
    try {
      return Boolean(jsonLogic.apply(doc.showIf as Parameters<typeof jsonLogic.apply>[0], data));
    } catch {
      return true;
    }
  });
}
