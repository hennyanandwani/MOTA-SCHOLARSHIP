"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, ShieldCheck, X } from "lucide-react";
import {
  ELIGIBILITY_CRITERIA_FIELDS,
  SUPPORTED_POLICY_DOCUMENT_TYPES,
  validateVerificationPolicyDraft,
  validateVerificationPolicyForPublication,
  type CriteriaOperator,
  type VerificationDocumentType,
} from "@/lib/scholarshipVerificationPolicy";
import {
  SYNTHETIC_POLICY_LABEL,
  isSyntheticTestSchemeName,
} from "@/lib/syntheticVerificationPolicy";

type PolicyView = {
  id: string;
  version: number;
  status: "DRAFT" | "PUBLISHED";
  isSynthetic: boolean;
  eligibilityCriteria: unknown;
  requiredDocumentTypes: string[];
  aiEligibleDocumentTypes: string[];
  officialGuidelineReference: string | null;
  guidelineRevision: string | null;
  publishedAt: string | null;
  publishedBy: { id: string; fullName: string | null } | null;
};

type CriterionEditor = {
  field: string;
  operator: CriteriaOperator;
  valueText: string;
  reason_code: string;
  explanation: string;
};

type PolicyEditor = {
  eligibilityCriteria: CriterionEditor[];
  requiredDocumentTypes: VerificationDocumentType[];
  aiEligibleDocumentTypes: VerificationDocumentType[];
  officialGuidelineReference: string;
  guidelineRevision: string;
};

const operators: CriteriaOperator[] = [
  "eq",
  "ne",
  "lt",
  "lte",
  "gt",
  "gte",
  "in",
  "not_in",
];

const fieldClass =
  "mt-1 min-h-10 w-full rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-sm text-[#172033] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";
const buttonClass =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[#DCE3EC] px-3 text-xs font-semibold text-[#334155] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPolicy(value: unknown): value is PolicyView {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    (value.status === "DRAFT" || value.status === "PUBLISHED") &&
    typeof value.isSynthetic === "boolean" &&
    Array.isArray(value.requiredDocumentTypes) &&
    value.requiredDocumentTypes.every((type) => typeof type === "string") &&
    Array.isArray(value.aiEligibleDocumentTypes) &&
    value.aiEligibleDocumentTypes.every((type) => typeof type === "string") &&
    (value.eligibilityCriteria === null ||
      Array.isArray(value.eligibilityCriteria)) &&
    (value.officialGuidelineReference === null ||
      typeof value.officialGuidelineReference === "string") &&
    (value.guidelineRevision === null ||
      typeof value.guidelineRevision === "string") &&
    (value.publishedAt === null || typeof value.publishedAt === "string") &&
    (value.publishedBy === null || isRecord(value.publishedBy))
  );
}

function parsePolicies(value: unknown): PolicyView[] | null {
  if (!isRecord(value) || !Array.isArray(value.policies)) return null;
  return value.policies.every(isPolicy) ? value.policies : null;
}

function parsePolicy(value: unknown): PolicyView | null {
  return isRecord(value) && isPolicy(value.policy) ? value.policy : null;
}

function makeEditor(policy?: PolicyView): PolicyEditor {
  const rawCriteria = Array.isArray(policy?.eligibilityCriteria)
    ? policy.eligibilityCriteria
    : [];
  return {
    eligibilityCriteria: rawCriteria.flatMap((criterion) => {
      if (!isRecord(criterion)) return [];
      const field = typeof criterion.field === "string" ? criterion.field : "";
      const operator = operators.includes(criterion.operator as CriteriaOperator)
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

function buildPolicyPayload(editor: PolicyEditor) {
  return {
    eligibilityCriteria: editor.eligibilityCriteria.map((criterion) => {
      const field = ELIGIBILITY_CRITERIA_FIELDS.find(
        (option) => option.field === criterion.field,
      );
      const value =
        criterion.operator === "in" || criterion.operator === "not_in"
          ? criterion.valueText.split(",").map((part) => {
              const trimmed = part.trim();
              return field?.valueType === "number"
                ? trimmed
                  ? Number(trimmed)
                  : Number.NaN
                : trimmed;
            })
          : field?.valueType === "number"
            ? criterion.valueText.trim()
          ? Number(criterion.valueText)
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

function formatPublishedAt(value: string | null): string {
  if (!value) return "Not published";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

export function ScholarshipPolicyManagement({
  schemeId,
  schemeName,
  allowSyntheticTestPolicy = false,
}: {
  schemeId: string;
  schemeName: string;
  allowSyntheticTestPolicy?: boolean;
}) {
  const [policies, setPolicies] = useState<PolicyView[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [editor, setEditor] = useState<PolicyEditor>(() => makeEditor());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canCreateTestPolicy =
    allowSyntheticTestPolicy && isSyntheticTestSchemeName(schemeName);

  const selected = useMemo(
    () => policies.find((policy) => policy.id === selectedId) ?? null,
    [policies, selectedId],
  );
  const isDraft = selected?.status === "DRAFT";

  const loadPolicies = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/schemes/${encodeURIComponent(schemeId)}/verification-policies`,
        { cache: "no-store" },
      );
      const payload: unknown = await response.json();
      const result = parsePolicies(payload);
      if (!response.ok || !result) {
        throw new Error(
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : "Unable to load policy versions.",
        );
      }

      setPolicies(result);
      const nextId =
        preferredId && result.some((policy) => policy.id === preferredId)
          ? preferredId
          : result.find((policy) => policy.status === "DRAFT")?.id ??
            result[0]?.id ??
            "";
      setSelectedId(nextId);
      setEditor(makeEditor(result.find((policy) => policy.id === nextId)));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load policy versions.",
      );
    } finally {
      setLoading(false);
    }
  }, [schemeId]);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  function choosePolicy(id: string) {
    setSelectedId(id);
    setEditor(makeEditor(policies.find((policy) => policy.id === id)));
    setError("");
    setNotice("");
  }

  function updateCriterion(
    index: number,
    patch: Partial<CriterionEditor>,
  ) {
    setEditor((current) => ({
      ...current,
      eligibilityCriteria: current.eligibilityCriteria.map((criterion, item) =>
        item === index ? { ...criterion, ...patch } : criterion,
      ),
    }));
  }

  function validateEditor(publish: boolean): boolean {
    const payload = buildPolicyPayload(editor);
    const result = publish
      ? validateVerificationPolicyForPublication(payload)
      : validateVerificationPolicyDraft(payload);
    if (!result.success) {
      setError(result.errors.join(" "));
      return false;
    }
    setError("");
    return true;
  }

  async function requestJson(
    url: string,
    method: string,
    body?: unknown,
  ): Promise<unknown> {
    const response = await fetch(url, {
      method,
      cache: "no-store",
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const message =
        isRecord(payload) && typeof payload.error === "string"
          ? payload.error
          : "The policy request failed.";
      const details =
        isRecord(payload) && Array.isArray(payload.details)
          ? payload.details.filter((detail): detail is string => typeof detail === "string")
          : [];
      throw new Error([message, ...details].join(" "));
    }
    return payload;
  }

  async function createEmptyDraft() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const policy = parsePolicy(
        await requestJson(
          `/api/admin/schemes/${encodeURIComponent(schemeId)}/verification-policies`,
          "POST",
          buildPolicyPayload(makeEditor()),
        ),
      );
      if (!policy) throw new Error("The server returned an invalid policy.");
      setNotice(`Draft version ${policy.version} created.`);
      await loadPolicies(policy.id);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create the policy draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createSyntheticDraft() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const policy = parsePolicy(
        await requestJson(
          `/api/admin/schemes/${encodeURIComponent(schemeId)}/verification-policies/test-policy`,
          "POST",
        ),
      );
      if (!policy) throw new Error("The server returned an invalid synthetic policy.");
      setNotice(`Synthetic test policy draft version ${policy.version} created.`);
      await loadPolicies(policy.id);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create the synthetic policy draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createVersion() {
    if (!selected || selected.status !== "PUBLISHED") return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const policy = parsePolicy(
        await requestJson(
          `/api/admin/schemes/${encodeURIComponent(schemeId)}/verification-policies/${encodeURIComponent(selected.id)}/versions`,
          "POST",
        ),
      );
      if (!policy) throw new Error("The server returned an invalid policy.");
      setNotice(`Draft version ${policy.version} created from the published policy.`);
      await loadPolicies(policy.id);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create a new policy version.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePolicy(publish: boolean) {
    if (selected?.isSynthetic) {
      if (!publish || !isDraft) return;
      setSaving(true);
      setError("");
      setNotice("");
      try {
        const base = `/api/admin/schemes/${encodeURIComponent(schemeId)}/verification-policies`;
        const published = parsePolicy(
          await requestJson(
            `${base}/${encodeURIComponent(selected.id)}/publish`,
            "POST",
          ),
        );
        if (!published) throw new Error("The server returned an invalid policy.");
        setNotice(`Synthetic test policy version ${published.version} published.`);
        await loadPolicies(published.id);
      } catch (publishError) {
        setError(
          publishError instanceof Error
            ? publishError.message
            : "Unable to publish the synthetic test policy.",
        );
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!validateEditor(publish)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const base = `/api/admin/schemes/${encodeURIComponent(schemeId)}/verification-policies`;
      const payload = buildPolicyPayload(editor);
      const saved = parsePolicy(
        await requestJson(
          selected && isDraft
            ? `${base}/${encodeURIComponent(selected.id)}`
            : base,
          selected && isDraft ? "PATCH" : "POST",
          payload,
        ),
      );
      if (!saved) throw new Error("The server returned an invalid policy.");
      if (publish) {
        const published = parsePolicy(
          await requestJson(
            `${base}/${encodeURIComponent(saved.id)}/publish`,
            "POST",
          ),
        );
        if (!published) throw new Error("The server returned an invalid policy.");
        setNotice(`Policy version ${published.version} published.`);
        await loadPolicies(published.id);
      } else {
        setNotice(`Draft version ${saved.version} saved.`);
        await loadPolicies(saved.id);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the scholarship policy.",
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleRequired(type: VerificationDocumentType, checked: boolean) {
    if (!checked && editor.aiEligibleDocumentTypes.includes(type)) {
      setError("Remove this document from AI verification before making it optional.");
      return;
    }
    setEditor((current) => {
      return {
        ...current,
        requiredDocumentTypes: checked
          ? [...current.requiredDocumentTypes, type]
          : current.requiredDocumentTypes.filter((item) => item !== type),
      };
    });
  }

  function toggleAiDocument(type: VerificationDocumentType, checked: boolean) {
    if (!editor.requiredDocumentTypes.includes(type)) return;
    if (checked && editor.aiEligibleDocumentTypes.length >= 5) {
      setError("Select no more than five AI verification documents.");
      return;
    }
    setError("");
    setEditor((current) => {
      return {
        ...current,
        aiEligibleDocumentTypes: checked
          ? [...current.aiEligibleDocumentTypes, type]
          : current.aiEligibleDocumentTypes.filter((item) => item !== type),
      };
    });
  }

  function moveAiDocument(index: number, offset: -1 | 1) {
    setEditor((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.aiEligibleDocumentTypes.length) {
        return current;
      }
      const aiTypes = [...current.aiEligibleDocumentTypes];
      [aiTypes[index], aiTypes[target]] = [aiTypes[target], aiTypes[index]];
      return { ...current, aiEligibleDocumentTypes: aiTypes };
    });
  }

  const readOnly = !isDraft || Boolean(selected?.isSynthetic);

  return (
    <section className="mt-4 rounded-xl border border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5" aria-label={`Verification policy for ${schemeName}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#172033]">
            <ShieldCheck size={16} aria-hidden="true" /> Verification policy
          </h4>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">
            Published rules are immutable. Legacy schemes without a policy continue using existing workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateTestPolicy && !policies.length && !loading && (
            <button type="button" className={buttonClass} onClick={() => void createSyntheticDraft()} disabled={saving}>
              <ShieldCheck size={14} aria-hidden="true" /> Create synthetic test policy
            </button>
          )}
          {!policies.length && !loading && (
            <button type="button" className={buttonClass} onClick={() => void createEmptyDraft()} disabled={saving}>
              <Plus size={14} aria-hidden="true" /> Create draft
            </button>
          )}
          {selected?.status === "PUBLISHED" && (
            <button type="button" className={buttonClass} onClick={() => void createVersion()} disabled={saving}>
              <Plus size={14} aria-hidden="true" /> New draft version
            </button>
          )}
          {policies.length > 0 && selected?.status === "DRAFT" && (
            <button type="button" className={buttonClass} onClick={() => void createEmptyDraft()} disabled={saving}>
              <Plus size={14} aria-hidden="true" /> New draft
            </button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">{error}</p>}
      {notice && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">{notice}</p>}
      {loading ? (
        <p role="status" className="mt-4 text-sm text-[#64748B]">Loading policy versions...</p>
      ) : (
        <>
          {policies.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#334155]">
                Policy version
                <select
                  className={fieldClass}
                  value={selectedId}
                  onChange={(event) => choosePolicy(event.target.value)}
                >
                  {policies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      Version {policy.version} · {policy.status}{policy.isSynthetic ? " · SYNTHETIC TEST" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {selected?.status === "PUBLISHED" && (
                <p className="mt-2 text-xs text-[#64748B]">
                  Published by {selected.publishedBy?.fullName ?? "Admin"} · {formatPublishedAt(selected.publishedAt)}
                </p>
              )}
            </div>
          )}

          {!policies.length ? (
            <p className="mt-4 rounded-lg border border-dashed border-[#C8D2E0] bg-white px-3 py-4 text-sm text-[#64748B]">
              No verification policy is configured. This scholarship remains available as a legacy scheme.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              {selected?.isSynthetic && (
                <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-950">
                  {SYNTHETIC_POLICY_LABEL}. This fixed test fixture is never an official guideline or eligibility rule.
                </p>
              )}
              <fieldset disabled={readOnly || saving} className="space-y-3">
                <legend className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Eligibility criteria</legend>
                <p className="text-xs text-[#64748B]">Use only eligibility terms verified against the official scholarship guideline.</p>
                {editor.eligibilityCriteria.map((criterion, index) => {
                  const field = ELIGIBILITY_CRITERIA_FIELDS.find((option) => option.field === criterion.field);
                  const isArray = criterion.operator === "in" || criterion.operator === "not_in";
                  return (
                    <div key={index} className="rounded-lg border border-[#DCE3EC] bg-white p-3">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="text-xs font-semibold text-[#334155]">
                          Application field
                          <select
                            className={fieldClass}
                            value={criterion.field}
                            onChange={(event) => updateCriterion(index, { field: event.target.value })}
                          >
                            <option value="">Select a field</option>
                            {ELIGIBILITY_CRITERIA_FIELDS.map((option) => (
                              <option key={option.field} value={option.field}>{option.field}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-[#334155]">
                          Operator
                          <select
                            className={fieldClass}
                            value={criterion.operator}
                            onChange={(event) => updateCriterion(index, { operator: event.target.value as CriteriaOperator })}
                          >
                            {operators.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
                          </select>
                        </label>
                        <label className="text-xs font-semibold text-[#334155] sm:col-span-2">
                          Expected value{isArray ? "s (comma-separated)" : ""}
                          <input
                            className={fieldClass}
                            type={field?.valueType === "number" && !isArray ? "number" : field?.valueType === "date" && !isArray ? "date" : "text"}
                            step={field?.valueType === "number" ? "any" : undefined}
                            value={criterion.valueText}
                            onChange={(event) => updateCriterion(index, { valueText: event.target.value })}
                          />
                        </label>
                        <label className="text-xs font-semibold text-[#334155]">
                          Reason code
                          <input className={fieldClass} maxLength={64} value={criterion.reason_code} onChange={(event) => updateCriterion(index, { reason_code: event.target.value })} />
                        </label>
                        <label className="text-xs font-semibold text-[#334155] sm:col-span-2 lg:col-span-3">
                          Student-readable explanation
                          <textarea className={`${fieldClass} resize-y`} rows={2} maxLength={1000} value={criterion.explanation} onChange={(event) => updateCriterion(index, { explanation: event.target.value })} />
                        </label>
                      </div>
                      <button
                        type="button"
                        className={`${buttonClass} mt-3`}
                        onClick={() => setEditor((current) => ({
                          ...current,
                          eligibilityCriteria: current.eligibilityCriteria.filter((_, item) => item !== index),
                        }))}
                        aria-label={`Remove eligibility criterion ${index + 1}`}
                      >
                        <X size={14} aria-hidden="true" /> Remove criterion
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => setEditor((current) => ({
                    ...current,
                    eligibilityCriteria: [...current.eligibilityCriteria, {
                      field: "",
                      operator: "eq",
                      valueText: "",
                      reason_code: "",
                      explanation: "",
                    }],
                  }))}
                >
                  <Plus size={14} aria-hidden="true" /> Add criterion
                </button>
              </fieldset>

              <fieldset disabled={readOnly || saving} className="space-y-2">
                <legend className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Required documents</legend>
                <p className="text-xs text-[#64748B]">Select which documents this scholarship requires.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SUPPORTED_POLICY_DOCUMENT_TYPES.map((type) => (
                    <label key={type} className="flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-xs text-[#334155]">
                      <input
                        type="checkbox"
                        checked={editor.requiredDocumentTypes.includes(type)}
                        onChange={(event) => toggleRequired(type, event.target.checked)}
                      />
                      <span>{type.replaceAll("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset disabled={readOnly || saving} className="space-y-2">
                <legend className="text-xs font-bold uppercase tracking-wide text-[#64748B]">AI verification documents</legend>
                <p className="text-xs leading-5 text-[#64748B]">
                  Only required documents can be selected. Select explicitly and order by priority; maximum five. PDF uploads remain manual-review only.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {editor.requiredDocumentTypes.map((type) => (
                    <label key={type} className="flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-xs text-[#334155]">
                      <input
                        type="checkbox"
                        checked={editor.aiEligibleDocumentTypes.includes(type)}
                        onChange={(event) => toggleAiDocument(type, event.target.checked)}
                      />
                      <span className="flex-1">{type.replaceAll("_", " ")}</span>
                      <span className="text-[10px] text-[#64748B]">
                        {editor.aiEligibleDocumentTypes.includes(type) ? "AI eligible" : "Manual only"}
                      </span>
                    </label>
                  ))}
                </div>
                <ol aria-label="AI document priority order" className="space-y-1">
                  {editor.aiEligibleDocumentTypes.map((type, index) => (
                    <li key={type} className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs text-[#334155]">
                      <span className="min-w-5 font-semibold">{index + 1}.</span>
                      <span className="flex-1">{type.replaceAll("_", " ")}</span>
                      <button type="button" className={buttonClass} onClick={() => moveAiDocument(index, -1)} disabled={index === 0} aria-label={`Move ${type} earlier`}>
                        <ArrowUp size={13} aria-hidden="true" />
                      </button>
                      <button type="button" className={buttonClass} onClick={() => moveAiDocument(index, 1)} disabled={index === editor.aiEligibleDocumentTypes.length - 1} aria-label={`Move ${type} later`}>
                        <ArrowDown size={13} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ol>
              </fieldset>

              <fieldset disabled={readOnly || saving} className="grid gap-3 sm:grid-cols-2">
                <legend className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Official guideline</legend>
                <label className="text-xs font-semibold text-[#334155] sm:col-span-2">
                  Guideline reference or URL
                  <input className={fieldClass} maxLength={2048} value={editor.officialGuidelineReference} onChange={(event) => setEditor((current) => ({ ...current, officialGuidelineReference: event.target.value }))} />
                </label>
                <label className="text-xs font-semibold text-[#334155] sm:col-span-2">
                  Guideline revision or version
                  <input className={fieldClass} maxLength={120} value={editor.guidelineRevision} onChange={(event) => setEditor((current) => ({ ...current, guidelineRevision: event.target.value }))} />
                </label>
                {readOnly && selected?.officialGuidelineReference && (
                  <p className="break-all text-xs text-[#475569] sm:col-span-2">
                    Published reference: {selected.officialGuidelineReference}
                  </p>
                )}
              </fieldset>

              {readOnly && !(selected?.isSynthetic && isDraft) ? (
                <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-[#334155]">
                  Published version {selected?.version} is read-only. Create a new draft version to make changes.
                </p>
              ) : selected?.isSynthetic && isDraft ? (
                <div className="flex flex-wrap gap-2 border-t border-[#DCE3EC] pt-4">
                  <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-4 text-xs font-semibold text-amber-950 hover:bg-amber-200 disabled:opacity-50" onClick={() => void savePolicy(true)} disabled={saving}>
                    <ShieldCheck size={14} aria-hidden="true" /> Publish synthetic test policy
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 border-t border-[#DCE3EC] pt-4">
                  <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white hover:bg-[#123362] disabled:opacity-50" onClick={() => void savePolicy(false)} disabled={saving}>
                    <Save size={14} aria-hidden="true" /> Save draft
                  </button>
                  <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50" onClick={() => void savePolicy(true)} disabled={saving}>
                    <ShieldCheck size={14} aria-hidden="true" /> Publish draft
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function ScholarshipPolicyDisclosure({
  schemeId,
  schemeName,
  allowSyntheticTestPolicy = false,
}: {
  schemeId: string;
  schemeName: string;
  allowSyntheticTestPolicy?: boolean;
}) {
  const [opened, setOpened] = useState(false);
  return (
    <details
      className="mt-4 border-t border-[#EEF1F5] pt-3"
      onToggle={(event) => setOpened(event.currentTarget.open)}
    >
      <summary className="min-h-9 cursor-pointer text-xs font-semibold text-[#2563A8]">
        Manage verification policy
      </summary>
      {opened && (
        <ScholarshipPolicyManagement
          schemeId={schemeId}
          schemeName={schemeName}
          allowSyntheticTestPolicy={allowSyntheticTestPolicy}
        />
      )}
    </details>
  );
}
