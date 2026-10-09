'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Eye,
  FileText,
  Info,
  Plus,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import {
  ADMIN_RULES_STORAGE_KEY,
  createInitialRules,
  evaluateRulePreview,
  formatCondition,
  isEligibilityRuleList,
  RULE_CATEGORIES,
  type EligibilityRule,
  type MissingDataBehavior,
  type RuleCategory,
  type RuleDataType,
  type RuleOperator,
  type RulePriority,
  type RuleStatus,
} from '@/lib/adminRuleData';
import type { Scheme } from '@/lib/schemes';

type RuleConfigurationClientProps = {
  schemes: Scheme[];
};

type RuleForm = {
  name: string;
  description: string;
  schemeId: string;
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
};

type RuleFilters = {
  search: string;
  scheme: string;
  category: string;
  status: string;
  priority: string;
  dataType: string;
};

type PreviewValues = Record<string, string>;

const initialForm = (schemeId = ''): RuleForm => ({
  name: '',
  description: '',
  schemeId,
  category: 'Income',
  field: 'familyIncome',
  operator: '<=',
  expectedValue: '',
  dataType: 'Numeric',
  priority: 'Medium',
  status: 'Active',
  missingDataBehavior: 'Flag for official review',
  officialReviewRequired: true,
  passCondition: 'The applicant value meets the configured condition.',
  failCondition: 'The applicant value does not meet the configured condition.',
});

const emptyFilters: RuleFilters = {
  search: '',
  scheme: 'all',
  category: 'all',
  status: 'all',
  priority: 'all',
  dataType: 'all',
};

const priorityClasses: Record<RulePriority, string> = {
  High: 'border-[#F0C7CA] bg-[#FDF0F0] text-[#A52C37]',
  Medium: 'border-[#E4C98F] bg-[#FFF8E8] text-[#79520F]',
  Low: 'border-[#DCE3EC] bg-[#F1F5F9] text-[#475569]',
};
const statusClasses: Record<RuleStatus, string> = {
  Active: 'border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]',
  Disabled: 'border-[#DCE3EC] bg-[#F1F5F9] text-[#64748B]',
};

const numericOperators: RuleOperator[] = ['=', '!=', '>', '>=', '<', '<='];
const textOperators: RuleOperator[] = ['=', '!=', 'contains'];
const booleanOperators: RuleOperator[] = ['is true', 'is false'];
const matrixCategories: RuleCategory[] = ['Age', 'Income', 'Category', 'Academic', 'Document'];

function badge(label: string, className: string) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold ${className}`}>{label}</span>;
}

function defaultTestValue(rule: EligibilityRule) {
  if (rule.dataType === 'Boolean') return rule.operator === 'is true' ? 'true' : 'false';
  if (rule.dataType === 'Numeric') {
    const expected = Number(rule.expectedValue);
    if (!Number.isFinite(expected)) return '0';
    if (rule.operator === '<=' || rule.operator === '<') return String(Math.max(0, expected - 10000));
    if (rule.operator === '>=' || rule.operator === '>') return String(expected + 5);
    return String(expected);
  }
  return rule.expectedValue;
}

function conditionForForm(form: RuleForm) {
  const name = schemesFieldLabel(form.field);
  const expected = form.dataType === 'Numeric' && /income/i.test(form.field)
    ? `₹${Number(form.expectedValue || 0).toLocaleString('en-IN')}`
    : form.dataType === 'Numeric' && /percentage/i.test(form.field)
      ? `${form.expectedValue}%`
      : form.expectedValue;
  if (form.dataType === 'Boolean') return `${name} ${form.operator}`;
  return `${name} ${form.operator} ${expected || '[expected value]'}`;
}

function schemesFieldLabel(field: string) {
  const knownFields: Record<string, string> = {
    age: 'Age',
    familyIncome: 'Family Income',
    category: 'Category',
    academicPercentage: 'Academic Percentage',
    academicLevel: 'Academic Level',
    stCertificatePresent: 'ST Certificate Present',
    residencyState: 'Residency State',
  };
  return knownFields[field] ?? field;
}

function operatorsFor(dataType: RuleDataType) {
  if (dataType === 'Numeric') return numericOperators;
  if (dataType === 'Boolean') return booleanOperators;
  return textOperators;
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative min-w-0">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-[#DCE3EC] bg-white px-3 pr-8 text-xs font-medium text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20">
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-[#64748B]" aria-hidden="true" />
    </label>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold text-[#334155]">
        {label}{required && <span className="ml-1 text-[#C2414B]" aria-hidden="true">*</span>}
        {required && <span className="sr-only">, required</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass = 'min-h-10 w-full rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-xs text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20';
const textareaClass = `${inputClass} min-h-20 resize-y leading-5`;

function formFromRule(rule: EligibilityRule): RuleForm {
  return {
    name: rule.name,
    description: rule.description,
    schemeId: rule.schemeId,
    category: rule.category,
    field: rule.field,
    operator: rule.operator,
    expectedValue: rule.expectedValue,
    dataType: rule.dataType,
    priority: rule.priority,
    status: rule.status,
    missingDataBehavior: rule.missingDataBehavior,
    officialReviewRequired: rule.officialReviewRequired,
    passCondition: rule.passCondition,
    failCondition: rule.failCondition,
  };
}

function evaluationResultClass(result: string) {
  if (result === 'PASS') return 'border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]';
  if (result === 'FAIL') return 'border-[#F0C7CA] bg-[#FDF0F0] text-[#A52C37]';
  if (result === 'MISSING DATA') return 'border-[#E4C98F] bg-[#FFF8E8] text-[#79520F]';
  return 'border-[#C7D9EF] bg-[#EEF5FC] text-[#173F7A]';
}

export function RuleConfigurationClient({ schemes }: RuleConfigurationClientProps) {
  const initialRules = useMemo(() => createInitialRules(schemes), [schemes]);
  const [rules, setRules] = useState<EligibilityRule[]>(initialRules);
  const [filters, setFilters] = useState<RuleFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(initialForm(schemes[0]?.id ?? ''));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [previewValues, setPreviewValues] = useState<PreviewValues>({});
  const [storageMessage, setStorageMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ADMIN_RULES_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isEligibilityRuleList(parsed)) setRules(parsed);
        else setStorageMessage('Saved rule configuration is invalid. Illustrative default rules are shown.');
      }
    } catch {
      setStorageMessage('Saved rule configuration is unavailable. Changes may not persist in this browser.');
    } finally {
      setHasLoadedStorage(true);
    }
  }, [initialRules]);

  useEffect(() => {
    if (!selectedId && !editingId) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editingId) closeEditor();
        else closeInspector();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [editingId, selectedId]);

  function persist(nextRules: EligibilityRule[]) {
    setRules(nextRules);
    if (!hasLoadedStorage) return;
    try {
      window.localStorage.setItem(ADMIN_RULES_STORAGE_KEY, JSON.stringify(nextRules));
      setStorageMessage('');
    } catch {
      setStorageMessage('Changes are active for this session but could not be saved in this browser.');
    }
  }

  const schemeById = useMemo(() => new Map(schemes.map((scheme) => [scheme.id, scheme.name])), [schemes]);
  const selectedRule = selectedId ? rules.find((rule) => rule.id === selectedId) ?? null : null;
  const visibleRules = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return rules.filter((rule) => {
      if (query && !rule.name.toLowerCase().includes(query) && !rule.id.toLowerCase().includes(query)) return false;
      if (filters.scheme !== 'all' && rule.schemeId !== filters.scheme) return false;
      if (filters.category !== 'all' && rule.category !== filters.category) return false;
      if (filters.status !== 'all' && rule.status !== filters.status) return false;
      if (filters.priority !== 'all' && rule.priority !== filters.priority) return false;
      if (filters.dataType !== 'all' && rule.dataType !== filters.dataType) return false;
      return true;
    }).sort((a, b) => {
      const priorityRank = { High: 0, Medium: 1, Low: 2 };
      return priorityRank[a.priority] - priorityRank[b.priority] || a.name.localeCompare(b.name);
    });
  }, [filters, rules]);
  const metrics = useMemo(() => ({
    total: rules.length,
    active: rules.filter(({ status }) => status === 'Active').length,
    disabled: rules.filter(({ status }) => status === 'Disabled').length,
    covered: new Set(rules.map(({ schemeId }) => schemeId)).size,
    high: rules.filter(({ status, priority }) => status === 'Active' && priority === 'High').length,
  }), [rules]);
  const matrixSchemes = useMemo(() => schemes.map((scheme) => ({
    ...scheme,
    categoryStates: matrixCategories.map((category) => ({
      category,
      configured: rules.some((rule) => rule.schemeId === scheme.id && rule.category === category && rule.status === 'Active'),
      total: rules.filter((rule) => rule.schemeId === scheme.id && rule.category === category).length,
    })),
  })), [rules, schemes]);

  function closeInspector() {
    setSelectedId(null);
    setPreviewValues({});
  }

  function closeEditor() {
    setEditingId(null);
    setFormErrors({});
  }

  function openCreate() {
    setSelectedId(null);
    setForm(initialForm(schemes[0]?.id ?? ''));
    setFormErrors({});
    setEditingId('__new__');
  }

  function openEdit(rule: EligibilityRule) {
    setSelectedId(null);
    setForm(formFromRule(rule));
    setFormErrors({});
    setEditingId(rule.id);
  }

  function patchForm<K extends keyof RuleForm>(key: K, value: RuleForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFormErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      delete next.form;
      return next;
    });
  }

  function changeDataType(dataType: RuleDataType) {
    patchForm('dataType', dataType);
    patchForm('operator', operatorsFor(dataType)[0]);
    patchForm('expectedValue', dataType === 'Boolean' ? 'true' : '');
  }

  function validateForm() {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Enter a rule name.';
    if (!form.description.trim()) errors.description = 'Enter a rule description.';
    if (!form.schemeId || !schemeById.has(form.schemeId)) errors.schemeId = 'Select an associated scheme.';
    if (!form.field.trim()) errors.field = 'Enter the applicant data field.';
    if (!operatorsFor(form.dataType).includes(form.operator)) errors.operator = 'Choose an operator supported by this data type.';
    if (form.dataType === 'Numeric') {
      if (form.expectedValue.trim() === '' || !Number.isFinite(Number(form.expectedValue))) {
        errors.expectedValue = 'Enter a valid numeric expected value.';
      }
    } else if (form.dataType === 'Text' && !form.expectedValue.trim()) {
      errors.expectedValue = 'Enter a non-empty expected text value.';
    }
    if (!form.passCondition.trim()) errors.passCondition = 'Enter the pass condition.';
    if (!form.failCondition.trim()) errors.failCondition = 'Enter the fail condition.';
    const duplicateName = rules.some((rule) =>
      rule.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
      rule.schemeId === form.schemeId &&
      rule.id !== editingId,
    );
    if (duplicateName) errors.name = 'A rule with this name already exists for the selected scheme.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function saveRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;
    const existing = editingId && editingId !== '__new__'
      ? rules.find((rule) => rule.id === editingId)
      : undefined;
    const now = new Date().toISOString();
    const newId = existing?.id ?? `${form.schemeId.toUpperCase()}-${form.category.replace(/[^A-Za-z]/g, '').toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const updated: EligibilityRule = {
      ...form,
      id: newId,
      schemeName: schemeById.get(form.schemeId) ?? '',
      expectedValue: form.dataType === 'Boolean'
        ? (form.operator === 'is true' ? 'true' : 'false')
        : form.expectedValue.trim(),
      passCondition: form.passCondition.trim(),
      failCondition: form.failCondition.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      field: form.field.trim(),
      version: existing ? existing.version + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    persist(existing
      ? rules.map((rule) => rule.id === existing.id ? updated : rule)
      : [updated, ...rules]);
    setEditingId(null);
    setSelectedId(updated.id);
    setNotice(existing ? `${updated.name} saved as version ${updated.version}.` : `${updated.name} added to the local rule registry.`);
  }

  function toggleStatus(rule: EligibilityRule) {
    const status: RuleStatus = rule.status === 'Active' ? 'Disabled' : 'Active';
    const updated = { ...rule, status, version: rule.version + 1, updatedAt: new Date().toISOString() };
    persist(rules.map((item) => item.id === rule.id ? updated : item));
    setNotice(`${rule.name} is now ${status.toLowerCase()}.`);
  }

  function clearFilters() {
    setFilters(emptyFilters);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 text-xs text-[#64748B]"><span>Administration</span><span className="px-2">/</span><span aria-current="page" className="font-medium text-[#172033]">Rule Configuration</span></nav>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Rule Configuration</h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-[#64748B]">Configure and validate scheme eligibility rules used during application screening and scrutiny.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[#E4C98F] bg-[#FFF8E8] px-2.5 py-1.5 text-[10px] font-bold tracking-[0.08em] text-[#79520F]"><span className="h-1.5 w-1.5 rounded-full bg-[#B7791F]" aria-hidden="true" />DEMO CONFIGURATION</span>
          <button type="button" onClick={openCreate} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2"><Plus size={15} aria-hidden="true" />Create Rule</button>
        </div>
      </div>

      {notice && <div role="status" className="flex items-center gap-2 border border-[#B6E3D0] bg-[#EAF7F1] px-4 py-2.5 text-xs text-[#126044]"><CheckCircle2 size={15} aria-hidden="true" />{notice}<button type="button" onClick={() => setNotice('')} className="ml-auto rounded p-1 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#16805B]" aria-label="Dismiss notification"><X size={14} aria-hidden="true" /></button></div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Rules', value: metrics.total, color: 'text-[#173F7A]', icon: FileText },
          { label: 'Active Rules', value: metrics.active, color: 'text-[#16805B]', icon: CheckCircle2 },
          { label: 'Disabled Rules', value: metrics.disabled, color: 'text-[#64748B]', icon: ToggleLeft },
          { label: 'Schemes Covered', value: metrics.covered, color: 'text-[#2563A8]', icon: ShieldCheck },
          { label: 'High Priority Rules', value: metrics.high, color: 'text-[#C2414B]', icon: AlertCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <section key={label} className="min-w-0 border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]"><div className="flex items-start justify-between gap-2"><p className="text-[11px] font-medium leading-4 text-[#64748B]">{label}</p><Icon size={17} className={`shrink-0 ${color}`} aria-hidden="true" /></div><p className="mt-2 text-2xl font-bold tracking-tight text-[#172033]">{value.toLocaleString('en-IN')}</p></section>
        ))}
      </div>

      <div className="flex items-start gap-2 border border-[#C7D9EF] bg-[#EEF5FC] px-4 py-3 text-xs leading-5 text-[#334155]"><Info size={16} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" /><p>Rules provide screening support only. Higher-priority rules are evaluated earlier, but priority does not determine final eligibility. Final eligibility is determined through official verification.</p></div>

      <section className="border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]" aria-label="Rule registry filters">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="relative sm:col-span-2"><span className="sr-only">Search by rule name or ID</span><Search size={15} className="pointer-events-none absolute left-3 top-3 text-[#64748B]" aria-hidden="true" /><input type="search" value={filters.search} onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))} placeholder="Rule name / Rule ID" className={`${inputClass} pl-9`} /></label>
          <FilterSelect label="Filter by scheme" value={filters.scheme} onChange={(scheme) => setFilters((previous) => ({ ...previous, scheme }))}><option value="all">All schemes</option>{schemes.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.name}</option>)}</FilterSelect>
          <FilterSelect label="Filter by rule category" value={filters.category} onChange={(category) => setFilters((previous) => ({ ...previous, category }))}><option value="all">All categories</option>{RULE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</FilterSelect>
          <FilterSelect label="Filter by status" value={filters.status} onChange={(status) => setFilters((previous) => ({ ...previous, status }))}><option value="all">All statuses</option><option>Active</option><option>Disabled</option></FilterSelect>
          <FilterSelect label="Filter by priority" value={filters.priority} onChange={(priority) => setFilters((previous) => ({ ...previous, priority }))}><option value="all">All priorities</option><option>High</option><option>Medium</option><option>Low</option></FilterSelect>
          <FilterSelect label="Filter by data type" value={filters.dataType} onChange={(dataType) => setFilters((previous) => ({ ...previous, dataType }))}><option value="all">All data types</option><option>Numeric</option><option>Text</option><option>Boolean</option></FilterSelect>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] text-[#64748B]">Showing <strong className="font-semibold text-[#172033]">{visibleRules.length}</strong> of {rules.length} rules · ordered by priority</p><button type="button" onClick={clearFilters} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Clear filters</button></div>
      </section>

      {storageMessage && <p role="status" className="border border-[#E4C98F] bg-[#FFF8E8] px-4 py-2.5 text-xs text-[#79520F]">{storageMessage}</p>}

      {visibleRules.length === 0 ? (
        <div className="flex flex-col items-center border border-[#DCE3EC] bg-white px-6 py-12 text-center"><Search size={25} className="text-[#64748B]" aria-hidden="true" /><h2 className="mt-3 text-sm font-semibold text-[#172033]">No rules found</h2><p className="mt-1 text-xs text-[#64748B]">Change your search or filters, or create a rule.</p><button type="button" onClick={clearFilters} className="mt-3 rounded-lg bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Clear filters</button></div>
      ) : (
        <div className="overflow-hidden border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left text-xs text-[#172033]" aria-label="Scheme eligibility rule registry">
              <thead className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]"><tr>{['Rule ID', 'Rule Name', 'Scheme', 'Category', 'Condition', 'Priority', 'Status', 'Last Updated', 'Action'].map((heading) => <th key={heading} scope="col" className="px-3 py-3">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#EEF1F5]">
                {visibleRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#F8FAFC]/70">
                    <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[10px] font-semibold text-[#173F7A]">{rule.id}</td>
                    <td className="max-w-[220px] px-3 py-3.5"><p className="font-semibold text-[#172033]">{rule.name}</p><p className="mt-0.5 line-clamp-1 text-[10px] text-[#64748B]">{rule.description}</p></td>
                    <td className="max-w-[200px] px-3 py-3.5"><span className="line-clamp-2 text-[11px]">{rule.schemeName}</span></td>
                    <td className="whitespace-nowrap px-3 py-3.5">{rule.category}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[10px] text-[#334155]">{formatCondition(rule)}</td>
                    <td className="px-3 py-3.5">{badge(rule.priority, priorityClasses[rule.priority])}</td>
                    <td className="px-3 py-3.5">{badge(rule.status, statusClasses[rule.status])}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-[10px] text-[#64748B]">{new Date(rule.updatedAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-3 py-3.5 text-right"><button type="button" onClick={() => { setSelectedId(rule.id); setPreviewValues({ [rule.id]: defaultTestValue(rule) }); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#DCE3EC] px-2.5 text-xs font-semibold text-[#173F7A] hover:bg-[#173F7A] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#2563A8]" aria-label={`Inspect rule ${rule.name}`}><Eye size={14} aria-hidden="true" />Inspect</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <section className="border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]" aria-labelledby="rule-matrix-heading">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#DCE3EC] p-4"><div><h2 id="rule-matrix-heading" className="text-sm font-semibold text-[#172033]">Rule matrix by scheme</h2><p className="mt-1 text-[11px] text-[#64748B]">Active configuration coverage for key rule categories</p></div><div className="flex items-center gap-3 text-[10px] text-[#64748B]"><span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#16805B]" aria-hidden="true" />Configured</span><span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-[#CBD5E1] bg-white" aria-hidden="true" />Not configured</span></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-xs text-[#172033]" aria-label="Rule configuration matrix by scheme"><thead className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]"><tr><th scope="col" className="px-4 py-3">Scheme</th>{matrixCategories.map((category) => <th key={category} scope="col" className="px-3 py-3">{category === 'Institution/Course' ? 'Institution' : category}</th>)}<th scope="col" className="px-3 py-3">Coverage</th></tr></thead><tbody className="divide-y divide-[#EEF1F5]">{matrixSchemes.map((scheme) => {const configuredCount = scheme.categoryStates.filter(({ configured }) => configured).length; return <tr key={scheme.id} className="hover:bg-[#F8FAFC]/70"><th scope="row" className="max-w-[250px] px-4 py-3 text-left font-medium"><span className="line-clamp-2">{scheme.name}</span></th>{scheme.categoryStates.map(({ category, configured, total }) => <td key={category} className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold ${configured ? 'bg-[#EAF7F1] text-[#126044]' : 'bg-[#F1F5F9] text-[#64748B]'}`} aria-label={`${category}: ${configured ? `${total} active rule${total === 1 ? '' : 's'}` : 'not configured'}`}><span className={`h-1.5 w-1.5 rounded-full ${configured ? 'bg-[#16805B]' : 'bg-[#94A3B8]'}`} aria-hidden="true" />{configured ? `${total} active` : '—'}</span></td>)}<td className="px-3 py-3 text-[10px] font-semibold text-[#334155]">{configuredCount}/{matrixCategories.length}</td></tr>;})}</tbody></table></div>
      </section>

      <p className="border-t border-[#DCE3EC] pt-4 text-[11px] leading-5 text-[#64748B]">Demonstration rules and sample preview results only. Verify current scheme notifications and refer missing, conflicting, or borderline data for authorized official review.</p>

      {selectedRule && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="rule-inspector-title">
          <button type="button" className="fixed inset-0 cursor-default bg-slate-900/40" onClick={closeInspector} aria-label="Close rule inspector" />
          <aside className="relative z-10 flex h-full w-full flex-col border-l border-[#DCE3EC] bg-white shadow-2xl lg:max-w-[680px]">
            <header className="flex items-start justify-between gap-3 border-b border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{badge(selectedRule.status, statusClasses[selectedRule.status])}{badge(selectedRule.priority, priorityClasses[selectedRule.priority])}<span className="font-mono text-[10px] font-semibold text-[#173F7A]">{selectedRule.id}</span></div><h2 id="rule-inspector-title" className="mt-1 text-base font-bold text-[#172033]">{selectedRule.name}</h2><p className="mt-0.5 text-xs text-[#64748B]">{selectedRule.schemeName} · {selectedRule.category}</p></div><button type="button" onClick={closeInspector} aria-label="Close rule inspector" className="shrink-0 rounded-lg p-2 text-[#64748B] hover:bg-slate-200/70 hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563A8]"><X size={18} aria-hidden="true" /></button></header>
            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              <section aria-labelledby="rule-info-heading"><h3 id="rule-info-heading" className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">Rule information</h3><dl className="grid grid-cols-2 gap-x-4 gap-y-3 border border-[#DCE3EC] p-3 sm:grid-cols-3">{[['Rule ID', selectedRule.id], ['Rule name', selectedRule.name], ['Scheme', selectedRule.schemeName], ['Category', selectedRule.category], ['Status', selectedRule.status], ['Priority', selectedRule.priority], ['Version', `v${selectedRule.version}`], ['Last updated', new Date(selectedRule.updatedAt).toLocaleDateString('en-IN')]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[10px] text-[#64748B]">{label}</dt><dd className="mt-0.5 break-words text-xs font-semibold text-[#172033]">{value}</dd></div>)}</dl><p className="mt-3 text-xs leading-5 text-[#334155]">{selectedRule.description}</p></section>
              <section aria-labelledby="condition-heading" className="border border-[#DCE3EC] p-3"><h3 id="condition-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Condition</h3><p className="mt-2 border-l-2 border-[#2563A8] bg-[#F8FAFC] px-3 py-2 font-mono text-sm font-semibold text-[#173F7A]">{formatCondition(selectedRule)}</p><dl className="mt-3 grid grid-cols-2 gap-3">{[['Field', selectedRule.field], ['Operator', selectedRule.operator], ['Expected value', selectedRule.expectedValue], ['Data type', selectedRule.dataType]].map(([label, value]) => <div key={label}><dt className="text-[10px] text-[#64748B]">{label}</dt><dd className="mt-0.5 text-xs font-semibold text-[#172033]">{value}</dd></div>)}</dl></section>
              <section aria-labelledby="evaluation-behavior-heading" className="border border-[#DCE3EC] p-3"><h3 id="evaluation-behavior-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Evaluation behavior</h3><dl className="mt-3 space-y-2">{[['Pass condition', selectedRule.passCondition], ['Fail condition', selectedRule.failCondition], ['Missing-data behavior', selectedRule.missingDataBehavior], ['Official review required', selectedRule.officialReviewRequired ? 'Yes — refer to authorized official' : 'No']].map(([label, value]) => <div key={label} className="border-t border-[#EEF1F5] pt-2 first:border-0 first:pt-0"><dt className="text-[10px] text-[#64748B]">{label}</dt><dd className="mt-0.5 text-[11px] leading-5 text-[#334155]">{value}</dd></div>)}</dl></section>
              <RulePreviewPanel rule={selectedRule} value={previewValues[selectedRule.id] ?? defaultTestValue(selectedRule)} onChange={(value) => setPreviewValues((previous) => ({ ...previous, [selectedRule.id]: value }))} />
              <div className="flex items-start gap-2 border border-[#C7D9EF] bg-[#EEF5FC] p-3 text-[11px] leading-5 text-[#334155]"><Info size={15} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" /><p>Rule evaluation preview only. Rule priority controls evaluation order; it does not decide final eligibility. Final eligibility is determined through official verification.</p></div>
            </div>
            <footer className="flex flex-wrap gap-2 border-t border-[#DCE3EC] bg-[#F8FAFC] p-3 sm:p-4"><button type="button" onClick={() => openEdit(selectedRule)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2"><Edit3 size={14} aria-hidden="true" />Edit Rule</button><button type="button" onClick={() => toggleStatus(selectedRule)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 text-xs font-semibold text-[#334155] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">{selectedRule.status === 'Active' ? <ToggleRight size={15} aria-hidden="true" /> : <ToggleLeft size={15} aria-hidden="true" />}{selectedRule.status === 'Active' ? 'Disable Rule' : 'Activate Rule'}</button></footer>
          </aside>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="rule-form-title">
          <button type="button" className="fixed inset-0 cursor-default" onClick={closeEditor} aria-label="Close rule form" />
          <div className="relative z-10 flex h-full w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:border sm:border-[#DCE3EC]">
            <header className="flex items-center justify-between gap-3 border-b border-[#DCE3EC] bg-[#F8FAFC] px-4 py-3 sm:px-5"><div><h2 id="rule-form-title" className="text-base font-bold text-[#172033]">{editingId === '__new__' ? 'Create Rule' : 'Edit Rule'}</h2><p className="mt-0.5 text-[11px] text-[#64748B]">Rule configuration is saved locally in this browser.</p></div><button type="button" onClick={closeEditor} aria-label="Close rule form" className="rounded-lg p-2 text-[#64748B] hover:bg-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#2563A8]"><X size={18} aria-hidden="true" /></button></header>
            <form onSubmit={saveRule} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
                {formErrors.form && <p role="alert" className="flex items-center gap-2 border border-[#F0C7CA] bg-[#FDF0F0] p-3 text-xs text-[#A52C37]"><AlertCircle size={15} aria-hidden="true" />{formErrors.form}</p>}
                <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Rule information</h3><div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Rule Name" required value={form.name} error={formErrors.name} onChange={(value) => patchForm('name', value)} />
                  <FormSelect label="Scheme" required value={form.schemeId} error={formErrors.schemeId} onChange={(value) => patchForm('schemeId', value)}><option value="">Select scheme</option>{schemes.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.name}</option>)}</FormSelect>
                  <FormSelect label="Category" required value={form.category} onChange={(value) => patchForm('category', value as RuleCategory)}>{RULE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</FormSelect>
                  <FormSelect label="Priority" required value={form.priority} onChange={(value) => patchForm('priority', value as RulePriority)}><option>High</option><option>Medium</option><option>Low</option></FormSelect>
                  <FormSelect label="Status" required value={form.status} onChange={(value) => patchForm('status', value as RuleStatus)}><option>Active</option><option>Disabled</option></FormSelect>
                  <FormTextarea label="Rule Description" required value={form.description} error={formErrors.description} onChange={(value) => patchForm('description', value)} />
                </div></section>
                <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Condition</h3><div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Field" required value={form.field} error={formErrors.field} placeholder="e.g. familyIncome" onChange={(value) => patchForm('field', value)} />
                  <FormSelect label="Data Type" required value={form.dataType} onChange={(value) => changeDataType(value as RuleDataType)}><option>Numeric</option><option>Text</option><option>Boolean</option></FormSelect>
                  <FormSelect label="Operator" required value={form.operator} error={formErrors.operator} onChange={(value) => patchForm('operator', value as RuleOperator)}>{operatorsFor(form.dataType).map((operator) => <option key={operator}>{operator}</option>)}</FormSelect>
                  {form.dataType === 'Boolean'
                    ? <div className="flex items-end"><p className="pb-3 text-[11px] text-[#64748B]">Expected value follows the selected boolean operator.</p></div>
                    : <FormInput label="Expected Value" required type={form.dataType === 'Numeric' ? 'number' : 'text'} step={form.dataType === 'Numeric' ? 'any' : undefined} value={form.expectedValue} error={formErrors.expectedValue} onChange={(value) => patchForm('expectedValue', value)} />}
                </div><p className="mt-3 border-l-2 border-[#2563A8] bg-[#F8FAFC] px-3 py-2 font-mono text-xs font-semibold text-[#173F7A]">Preview: {conditionForForm(form)}</p></section>
                <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Evaluation behavior</h3><div className="grid gap-3 sm:grid-cols-2">
                  <FormTextarea label="Pass Condition" required value={form.passCondition} error={formErrors.passCondition} onChange={(value) => patchForm('passCondition', value)} />
                  <FormTextarea label="Fail Condition" required value={form.failCondition} error={formErrors.failCondition} onChange={(value) => patchForm('failCondition', value)} />
                  <FormSelect label="Missing-data behavior" required value={form.missingDataBehavior} onChange={(value) => patchForm('missingDataBehavior', value as MissingDataBehavior)}><option>Require clarification</option><option>Flag for official review</option><option>Fail rule</option></FormSelect>
                  <label className="flex min-h-10 items-center gap-2 self-end border border-[#DCE3EC] px-3 py-2 text-xs text-[#334155]"><input type="checkbox" checked={form.officialReviewRequired} onChange={(event) => patchForm('officialReviewRequired', event.target.checked)} className="h-4 w-4 rounded border-[#94A3B8] text-[#173F7A] focus:ring-2 focus:ring-[#2563A8]" />Official review required</label>
                </div><div className="mt-3 flex items-start gap-2 border border-[#C7D9EF] bg-[#EEF5FC] p-3 text-[10px] leading-4 text-[#334155]"><Info size={14} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" /><p>High-priority rules are evaluated earlier. Priority and preview results do not determine final applicant eligibility.</p></div></section>
              </div>
              <footer className="flex flex-wrap justify-end gap-2 border-t border-[#DCE3EC] bg-[#F8FAFC] p-3 sm:px-5"><button type="button" onClick={closeEditor} className="min-h-10 rounded-lg border border-[#DCE3EC] bg-white px-4 text-xs font-semibold text-[#334155] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Cancel</button><button type="submit" className="min-h-10 rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2">{editingId === '__new__' ? 'Create Rule' : 'Save Changes'}</button></footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RulePreviewPanel({
  rule,
  value,
  onChange,
}: {
  rule: EligibilityRule;
  value: string;
  onChange: (value: string) => void;
}) {
  const preview = evaluateRulePreview(rule, value);
  return (
    <section aria-labelledby="rule-preview-heading" className="border border-[#DCE3EC] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 id="rule-preview-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Rule evaluation preview</h3><p className="mt-1 text-[10px] text-[#64748B]">Frontend demonstration only</p></div><span className="rounded bg-[#EEF5FC] px-2 py-1 text-[9px] font-bold text-[#173F7A]">TEST RULE</span></div>
      <label htmlFor={`preview-${rule.id}`} className="mt-3 block text-[11px] font-semibold text-[#334155]">Sample applicant value · {rule.field}</label>
      {rule.dataType === 'Boolean'
        ? <select id={`preview-${rule.id}`} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} mt-1.5`}><option value="true">Present / true</option><option value="false">Absent / false</option></select>
        : <input id={`preview-${rule.id}`} type={rule.dataType === 'Numeric' ? 'number' : 'text'} step={rule.dataType === 'Numeric' ? 'any' : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={rule.dataType === 'Numeric' ? 'Enter a numeric value' : 'Enter a text value'} className={`${inputClass} mt-1.5`} />}
      <div className="mt-3 rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] text-[#64748B]">Input value</p><p className="mt-0.5 text-xs font-semibold text-[#172033]">{value === '' ? 'Not provided' : value}</p></div><div className="text-right"><p className="text-[10px] text-[#64748B]">Rule condition</p><p className="mt-0.5 font-mono text-[10px] font-semibold text-[#173F7A]">{formatCondition(rule)}</p></div></div>
        <div className="mt-3 border-t border-[#DCE3EC] pt-3"><span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${evaluationResultClass(preview.result)}`}>{preview.result}</span><p className="mt-2 text-[11px] leading-5 text-[#334155]">{preview.explanation}</p></div>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-[#64748B]">Preview result is not a final eligibility decision. Final eligibility is determined through official verification.</p>
    </section>
  );
}

function FormInput({
  label,
  value,
  onChange,
  error,
  required,
  ...inputProps
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const id = `rule-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return <Field label={label} required={required}><input {...inputProps} id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass} />{error && <span id={`${id}-error`} className="mt-1 block text-[10px] text-[#A52C37]">{error}</span>}</Field>;
}

function FormTextarea({
  label,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  const id = `rule-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return <Field label={label} required={required}><textarea id={id} rows={3} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={textareaClass} />{error && <span id={`${id}-error`} className="mt-1 block text-[10px] text-[#A52C37]">{error}</span>}</Field>;
}

function FormSelect({
  label,
  value,
  onChange,
  children,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  const id = `rule-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return <Field label={label} required={required}><select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass}>{children}</select>{error && <span id={`${id}-error`} className="mt-1 block text-[10px] text-[#A52C37]">{error}</span>}</Field>;
}
