'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  Info,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  ADMIN_SCHEMES_STORAGE_KEY,
  createInitialManagedSchemes,
  daysRemaining,
  getWindowStatus,
  isManagedSchemeList,
  type ManagedScheme,
  type ManagedSchemeStatus,
  type SchemeWindowStatus,
} from '@/lib/adminSchemeAdminData';
import type { AdminSchemeSummary } from '@/lib/adminData';
import type { Scheme } from '@/lib/schemes';

type SchemeAdministrationClientProps = {
  schemes: Scheme[];
  summaries: AdminSchemeSummary[];
};

type SchemeFormValues = {
  name: string;
  code: string;
  type: 'Scholarship' | 'Fellowship';
  academicYear: string;
  openingDate: string;
  closingDate: string;
  intakeCapacity: string;
  benefitAmount: string;
  benefitDuration: string;
  benefitFrequency: string;
  additionalSupport: string;
  categoryRequirement: string;
  ageCriteria: string;
  incomeCriteria: string;
  academicCriteria: string;
  courseInstitutionCriteria: string;
  otherConditions: string;
  requiredDocuments: string;
  status: ManagedSchemeStatus;
};

const blankForm: SchemeFormValues = {
  name: '',
  code: '',
  type: 'Scholarship',
  academicYear: '2026–27',
  openingDate: '',
  closingDate: '',
  intakeCapacity: '',
  benefitAmount: '',
  benefitDuration: '',
  benefitFrequency: 'Annual',
  additionalSupport: '',
  categoryRequirement: 'Scheduled Tribe (ST) applicants; certificate verification required.',
  ageCriteria: 'As specified in the notified scheme guidelines.',
  incomeCriteria: '',
  academicCriteria: '',
  courseInstitutionCriteria: '',
  otherConditions: '',
  requiredDocuments: 'Identity proof\nScheduled Tribe certificate\nFamily income certificate\nAcademic marksheet\nBank account details\nInstitution and course proof',
  status: 'Draft',
};

const statusClasses: Record<ManagedSchemeStatus, string> = {
  Active: 'border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]',
  Draft: 'border-[#DCE3EC] bg-[#F1F5F9] text-[#475569]',
  Upcoming: 'border-[#C7D9EF] bg-[#EEF5FC] text-[#173F7A]',
  Closed: 'border-[#E4C98F] bg-[#FFF8E8] text-[#79520F]',
  Inactive: 'border-[#DCE3EC] bg-[#F1F5F9] text-[#64748B]',
};

const windowClasses: Record<SchemeWindowStatus, string> = {
  Open: 'text-[#126044]',
  Upcoming: 'text-[#173F7A]',
  Closed: 'text-[#79520F]',
};

function statusBadge(status: ManagedSchemeStatus) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold ${statusClasses[status]}`}>{status}</span>;
}

function windowLabel(scheme: ManagedScheme) {
  return getWindowStatus(scheme);
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
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

function formFromScheme(scheme: ManagedScheme): SchemeFormValues {
  return {
    name: scheme.name,
    code: scheme.code,
    type: scheme.type,
    academicYear: scheme.academicYear,
    openingDate: scheme.openingDate,
    closingDate: scheme.closingDate,
    intakeCapacity: String(scheme.intakeCapacity),
    benefitAmount: scheme.benefits.amount,
    benefitDuration: scheme.benefits.duration,
    benefitFrequency: scheme.benefits.frequency,
    additionalSupport: scheme.benefits.additionalSupport,
    categoryRequirement: scheme.eligibility.categoryRequirement,
    ageCriteria: scheme.eligibility.ageCriteria,
    incomeCriteria: scheme.eligibility.incomeCriteria,
    academicCriteria: scheme.eligibility.academicCriteria,
    courseInstitutionCriteria: scheme.eligibility.courseInstitutionCriteria,
    otherConditions: scheme.eligibility.otherConditions,
    requiredDocuments: scheme.requiredDocuments.join('\n'),
    status: scheme.status,
  };
}

function createId(name: string, code: string) {
  const slug = code.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function SchemeAdministrationClient({ schemes, summaries }: SchemeAdministrationClientProps) {
  const initialSchemes = useMemo(() => createInitialManagedSchemes(schemes, summaries), [schemes, summaries]);
  const [records, setRecords] = useState<ManagedScheme[]>(initialSchemes);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [windowFilter, setWindowFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SchemeFormValues>(blankForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [storageMessage, setStorageMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    const searchValue = new URLSearchParams(window.location.search).get('search');
    if (searchValue) setQuery(searchValue);

    try {
      const stored = window.localStorage.getItem(ADMIN_SCHEMES_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isManagedSchemeList(parsed)) setRecords(parsed);
        else setStorageMessage('Saved scheme data is invalid. Illustrative default records are shown.');
      }
    } catch {
      setStorageMessage('Saved scheme data is unavailable. Changes may not persist in this browser.');
    } finally {
      setHasLoadedStorage(true);
    }
  }, [initialSchemes]);

  useEffect(() => {
    if (!selectedId && !editingId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editingId) closeForm();
        else closeInspector();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedId, editingId]);

  function persist(nextRecords: ManagedScheme[]) {
    setRecords(nextRecords);
    if (!hasLoadedStorage) return;
    try {
      window.localStorage.setItem(ADMIN_SCHEMES_STORAGE_KEY, JSON.stringify(nextRecords));
      setStorageMessage('');
    } catch {
      setStorageMessage('Changes are active for this session but could not be saved in this browser.');
    }
  }

  const selectedScheme = selectedId ? records.find((scheme) => scheme.id === selectedId) ?? null : null;
  const summary = useMemo(() => ({
    total: records.length,
    active: records.filter(({ status }) => status === 'Active').length,
    open: records.filter((scheme) => scheme.status === 'Active' && windowLabel(scheme) === 'Open').length,
    closed: records.filter((scheme) => windowLabel(scheme) === 'Closed').length,
    upcoming: records.filter(({ status }) => status === 'Upcoming').length,
  }), [records]);
  const filterOptions = useMemo(() => ({
    years: [...new Set(records.map(({ academicYear }) => academicYear))].sort(),
    categories: [...new Set(records.map(({ category }) => category))].sort(),
  }), [records]);
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records.filter((scheme) => {
      if (normalizedQuery && !scheme.name.toLowerCase().includes(normalizedQuery) && !scheme.code.toLowerCase().includes(normalizedQuery)) return false;
      if (statusFilter !== 'all' && scheme.status !== statusFilter) return false;
      if (academicYearFilter !== 'all' && scheme.academicYear !== academicYearFilter) return false;
      if (typeFilter !== 'all' && scheme.type !== typeFilter) return false;
      if (windowFilter !== 'all' && windowLabel(scheme) !== windowFilter) return false;
      if (categoryFilter !== 'all' && scheme.category !== categoryFilter) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [academicYearFilter, categoryFilter, query, records, statusFilter, typeFilter, windowFilter]);

  function closeInspector() {
    setSelectedId(null);
  }

  function closeForm() {
    setEditingId(null);
    setForm(blankForm);
    setFormErrors({});
  }

  function openCreate() {
    setSelectedId(null);
    setEditingId(null);
    setForm(blankForm);
    setFormErrors({});
    setNotice('');
    setEditingId('__new__');
  }

  function openEdit(scheme: ManagedScheme) {
    setSelectedId(null);
    setForm(formFromScheme(scheme));
    setFormErrors({});
    setEditingId(scheme.id);
  }

  function patchForm<K extends keyof SchemeFormValues>(key: K, value: SchemeFormValues[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFormErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      delete next.form;
      return next;
    });
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Enter a scheme name.';
    if (!form.code.trim()) errors.code = 'Enter a scheme code.';
    if (records.some((scheme) =>
      scheme.code.toLowerCase() === form.code.trim().toLowerCase() && scheme.id !== editingId,
    )) errors.code = 'This scheme code is already in use.';
    if (!form.academicYear.trim()) errors.academicYear = 'Enter an academic year.';
    if (!isRealDate(form.openingDate)) errors.openingDate = 'Enter a valid opening date.';
    if (!isRealDate(form.closingDate)) errors.closingDate = 'Enter a valid closing date.';
    if (isRealDate(form.openingDate) && isRealDate(form.closingDate) && form.closingDate < form.openingDate) {
      errors.closingDate = 'Closing date must be on or after the opening date.';
    }
    const capacity = Number(form.intakeCapacity);
    if (form.intakeCapacity.trim() === '' || !Number.isInteger(capacity) || capacity < 0) {
      errors.intakeCapacity = 'Enter a non-negative whole-number intake capacity.';
    }
    if (!form.benefitAmount.trim()) errors.benefitAmount = 'Enter the benefit amount or description.';
    if (!form.benefitDuration.trim()) errors.benefitDuration = 'Enter the benefit duration.';
    if (!form.categoryRequirement.trim()) errors.categoryRequirement = 'Enter the category requirement.';
    if (!form.ageCriteria.trim()) errors.ageCriteria = 'Enter the age criteria.';
    if (!form.incomeCriteria.trim()) errors.incomeCriteria = 'Enter the income criteria.';
    if (!form.academicCriteria.trim()) errors.academicCriteria = 'Enter the academic criteria.';
    if (!form.courseInstitutionCriteria.trim()) errors.courseInstitutionCriteria = 'Enter course or institution criteria.';
    if (!form.otherConditions.trim()) errors.otherConditions = 'Enter other conditions or “None”.';
    if (!form.requiredDocuments.split(/\r?\n/).some((document) => document.trim())) {
      errors.requiredDocuments = 'Enter at least one required document.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function saveForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;
    const previousScheme = editingId && editingId !== '__new__'
      ? records.find(({ id }) => id === editingId)
      : undefined;
    const now = new Date().toISOString();
    const nextScheme: ManagedScheme = {
      id: previousScheme?.id ?? createId(form.name, form.code),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      type: form.type,
      academicYear: form.academicYear.trim(),
      openingDate: form.openingDate,
      closingDate: form.closingDate,
      intakeCapacity: Number(form.intakeCapacity),
      applications: previousScheme?.applications ?? 0,
      benefits: {
        amount: form.benefitAmount.trim(),
        duration: form.benefitDuration.trim(),
        frequency: form.benefitFrequency.trim() || 'As configured',
        additionalSupport: form.additionalSupport.trim() || 'None specified',
      },
      eligibility: {
        categoryRequirement: form.categoryRequirement.trim(),
        ageCriteria: form.ageCriteria.trim(),
        incomeCriteria: form.incomeCriteria.trim(),
        academicCriteria: form.academicCriteria.trim(),
        courseInstitutionCriteria: form.courseInstitutionCriteria.trim(),
        otherConditions: form.otherConditions.trim(),
      },
      requiredDocuments: form.requiredDocuments.split(/\r?\n/).map((document) => document.trim()).filter(Boolean),
      status: form.status,
      ministry: previousScheme?.ministry ?? 'Ministry of Tribal Affairs',
      department: previousScheme?.department ?? (form.type === 'Fellowship' ? 'Education & Fellowship Division' : 'Scholarship Division'),
      category: previousScheme?.category ?? 'Scheduled Tribe (ST)',
      categoryQuotas: previousScheme?.categoryQuotas ?? [],
      allocatedSeats: previousScheme?.allocatedSeats ?? 0,
      createdAt: previousScheme?.createdAt ?? now,
      updatedAt: now,
    };
    const nextRecords = previousScheme
      ? records.map((scheme) => scheme.id === previousScheme.id ? nextScheme : scheme)
      : [nextScheme, ...records];
    persist(nextRecords);
    setSelectedId(nextScheme.id);
    closeForm();
    setNotice(previousScheme ? 'Scheme configuration updated in this browser.' : 'Scheme created as a local demonstration record.');
  }

  function updateStatus(scheme: ManagedScheme, status: ManagedSchemeStatus) {
    const nextRecords = records.map((record) => record.id === scheme.id
      ? { ...record, status, updatedAt: new Date().toISOString() }
      : record);
    persist(nextRecords);
    setNotice(`${scheme.name}: status changed to ${status}.`);
  }

  function duplicateScheme(scheme: ManagedScheme) {
    const baseCode = `${scheme.code}-COPY`;
    let code = baseCode;
    let suffix = 2;
    while (records.some((record) => record.code.toLowerCase() === code.toLowerCase())) {
      code = `${baseCode}-${suffix}`;
      suffix += 1;
    }
    const duplicate: ManagedScheme = {
      ...scheme,
      id: createId(`${scheme.name}-copy`, code),
      name: `${scheme.name} (Copy)`,
      code,
      status: 'Draft',
      applications: 0,
      allocatedSeats: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persist([duplicate, ...records]);
    setSelectedId(duplicate.id);
    setNotice(`Draft copy created with code ${code}.`);
  }

  function clearFilters() {
    setQuery('');
    setStatusFilter('all');
    setAcademicYearFilter('all');
    setTypeFilter('all');
    setWindowFilter('all');
    setCategoryFilter('all');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 text-xs text-[#64748B]">
            <span>Administration</span><span className="px-2">/</span><span aria-current="page" className="font-medium text-[#172033]">Scheme Administration</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Scheme Administration</h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-[#64748B]">
            Manage scholarship and fellowship schemes, application windows, eligibility requirements, benefits and intake configuration.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[#E4C98F] bg-[#FFF8E8] px-2.5 py-1.5 text-[10px] font-bold tracking-[0.08em] text-[#79520F]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B7791F]" aria-hidden="true" />DEMO DATA
          </span>
          <button type="button" onClick={openCreate} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2">
            <Plus size={15} aria-hidden="true" />Create Scheme
          </button>
        </div>
      </div>

      {notice && <div role="status" className="flex items-center gap-2 border border-[#B6E3D0] bg-[#EAF7F1] px-4 py-2.5 text-xs text-[#126044]"><CheckCircle2 size={15} aria-hidden="true" />{notice}<button type="button" className="ml-auto rounded p-1 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#16805B]" onClick={() => setNotice('')} aria-label="Dismiss confirmation"><X size={14} aria-hidden="true" /></button></div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Schemes', value: summary.total, icon: FileText, color: 'text-[#173F7A]' },
          { label: 'Active Schemes', value: summary.active, icon: ShieldCheck, color: 'text-[#16805B]' },
          { label: 'Applications Open', value: summary.open, icon: CheckCircle2, color: 'text-[#16805B]' },
          { label: 'Applications Closed', value: summary.closed, icon: CalendarDays, color: 'text-[#B7791F]' },
          { label: 'Upcoming Schemes', value: summary.upcoming, icon: Clock3, color: 'text-[#2563A8]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <section key={label} className="min-w-0 border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-medium leading-4 text-[#64748B]">{label}</p><Icon size={17} className={`shrink-0 ${color}`} aria-hidden="true" /></div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#172033]">{value.toLocaleString('en-IN')}</p>
          </section>
        ))}
      </div>

      <div className="flex items-start gap-2 border border-[#C7D9EF] bg-[#EEF5FC] px-4 py-3 text-xs leading-5 text-[#334155]">
        <Info size={16} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />
        <p>Scheme details, application volumes, benefits, and quota values are illustrative demonstration data. Applicant-level eligibility is assessed through the Screening workflow; this catalog does not determine individual eligibility.</p>
      </div>

      <section className="border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]" aria-label="Scheme catalog filters">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="relative sm:col-span-2">
            <span className="sr-only">Search by scheme name or code</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-3 text-[#64748B]" aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Scheme name / code" className={`${inputClass} pl-9`} />
          </label>
          <FilterSelect label="Filter by status" value={statusFilter} onChange={setStatusFilter}>
            <option value="all">All statuses</option>
            {(['Active', 'Draft', 'Upcoming', 'Closed', 'Inactive'] as ManagedSchemeStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by academic year" value={academicYearFilter} onChange={setAcademicYearFilter}>
            <option value="all">All academic years</option>
            {filterOptions.years.map((year) => <option key={year} value={year}>{year}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by scheme type" value={typeFilter} onChange={setTypeFilter}>
            <option value="all">All types</option><option value="Scholarship">Scholarship</option><option value="Fellowship">Fellowship</option>
          </FilterSelect>
          <FilterSelect label="Filter by application window" value={windowFilter} onChange={setWindowFilter}>
            <option value="all">All windows</option><option value="Open">Open</option><option value="Upcoming">Upcoming</option><option value="Closed">Closed</option>
          </FilterSelect>
          <FilterSelect label="Filter by category" value={categoryFilter} onChange={setCategoryFilter}>
            <option value="all">All categories</option>
            {filterOptions.categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </FilterSelect>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[#64748B]">Showing <strong className="font-semibold text-[#172033]">{filteredRecords.length}</strong> of {records.length} schemes</p>
          <button type="button" onClick={clearFilters} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Clear filters</button>
        </div>
      </section>

      {storageMessage && <p role="status" className="border border-[#E4C98F] bg-[#FFF8E8] px-4 py-2.5 text-xs text-[#79520F]">{storageMessage}</p>}

      {filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center border border-[#DCE3EC] bg-white px-6 py-12 text-center">
          <Search size={25} className="text-[#64748B]" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold text-[#172033]">No schemes found</h2>
          <p className="mt-1 text-xs text-[#64748B]">Change the search or filters, or create a scheme.</p>
          <button type="button" onClick={clearFilters} className="mt-3 rounded-lg bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Clear filters</button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)] xl:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1420px] text-left text-xs text-[#172033]" aria-label="Scholarship and fellowship scheme catalog">
                <thead className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                  <tr>{['Scheme', 'Scheme Code', 'Type', 'Academic Year', 'Application Window', 'Intake Capacity', 'Applications', 'Benefits', 'Status', 'Action'].map((heading) => <th key={heading} scope="col" className="px-3 py-3">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F5]">
                  {filteredRecords.map((scheme) => {
                    const windowStatus = windowLabel(scheme);
                    return (
                      <tr key={scheme.id} className="hover:bg-[#F8FAFC]/70">
                        <td className="max-w-[280px] px-3 py-3.5"><p className="line-clamp-2 font-semibold text-[#172033]">{scheme.name}</p><p className="mt-0.5 text-[10px] text-[#64748B]">{scheme.category}</p></td>
                        <td className="whitespace-nowrap px-3 py-3.5 font-mono font-semibold text-[#173F7A]">{scheme.code}</td>
                        <td className="whitespace-nowrap px-3 py-3.5">{scheme.type}</td>
                        <td className="whitespace-nowrap px-3 py-3.5">{scheme.academicYear}</td>
                        <td className="whitespace-nowrap px-3 py-3.5"><p className={`text-[10px] font-semibold ${windowClasses[windowStatus]}`}>{windowStatus}</p><p className="mt-0.5 text-[10px] text-[#64748B]">{scheme.openingDate} – {scheme.closingDate}</p></td>
                        <td className="whitespace-nowrap px-3 py-3.5">{scheme.intakeCapacity.toLocaleString('en-IN')}</td>
                        <td className="whitespace-nowrap px-3 py-3.5">{scheme.applications.toLocaleString('en-IN')}</td>
                        <td className="max-w-[210px] px-3 py-3.5"><p className="line-clamp-2 text-[11px]" title={scheme.benefits.amount}>{scheme.benefits.amount}</p><p className="mt-0.5 text-[10px] text-[#64748B]">{scheme.benefits.frequency}</p></td>
                        <td className="px-3 py-3.5">{statusBadge(scheme.status)}</td>
                        <td className="px-3 py-3.5 text-right"><button type="button" onClick={() => setSelectedId(scheme.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#DCE3EC] px-2.5 text-xs font-semibold text-[#173F7A] hover:bg-[#173F7A] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#2563A8]" aria-label={`Open scheme ${scheme.name}`}><Eye size={14} aria-hidden="true" />Manage</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="hidden overflow-hidden border border-[#DCE3EC] bg-white md:block xl:hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-xs text-[#172033]" aria-label="Condensed scheme catalog">
                <thead className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]"><tr><th scope="col" className="px-3 py-3">Scheme / Code</th><th scope="col" className="px-3 py-3">Type / Year</th><th scope="col" className="px-3 py-3">Window</th><th scope="col" className="px-3 py-3">Intake / Applications</th><th scope="col" className="px-3 py-3">Benefits</th><th scope="col" className="px-3 py-3">Status</th><th scope="col" className="px-3 py-3 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-[#EEF1F5]">{filteredRecords.map((scheme) => <tr key={scheme.id} className="hover:bg-[#F8FAFC]/70"><td className="max-w-[220px] px-3 py-3"><p className="line-clamp-2 font-semibold">{scheme.name}</p><p className="mt-1 font-mono text-[10px] text-[#173F7A]">{scheme.code}</p></td><td className="px-3 py-3">{scheme.type}<p className="mt-1 text-[10px] text-[#64748B]">{scheme.academicYear}</p></td><td className="px-3 py-3"><p className={`text-[10px] font-semibold ${windowClasses[windowLabel(scheme)]}`}>{windowLabel(scheme)}</p><p className="mt-1 whitespace-nowrap text-[10px] text-[#64748B]">{scheme.openingDate} – {scheme.closingDate}</p></td><td className="px-3 py-3">{scheme.intakeCapacity.toLocaleString('en-IN')}<p className="mt-1 text-[10px] text-[#64748B]">{scheme.applications.toLocaleString('en-IN')} applications</p></td><td className="max-w-[170px] px-3 py-3 text-[10px]">{scheme.benefits.amount}</td><td className="px-3 py-3">{statusBadge(scheme.status)}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => setSelectedId(scheme.id)} className="min-h-9 rounded-md border border-[#DCE3EC] px-2.5 text-xs font-semibold text-[#173F7A] focus:outline-none focus:ring-2 focus:ring-[#2563A8]" aria-label={`Open scheme ${scheme.name}`}>Manage</button></td></tr>)}</tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredRecords.map((scheme) => <article key={scheme.id} className="border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-sm font-semibold text-[#172033]">{scheme.name}</h2><p className="mt-1 font-mono text-[10px] text-[#173F7A]">{scheme.code}</p></div>{statusBadge(scheme.status)}</div><div className="mt-3 grid grid-cols-2 gap-2 text-[11px]"><div><p className="text-[#64748B]">Type · Year</p><p className="mt-0.5 font-medium text-[#172033]">{scheme.type} · {scheme.academicYear}</p></div><div><p className="text-[#64748B]">Window</p><p className={`mt-0.5 font-semibold ${windowClasses[windowLabel(scheme)]}`}>{windowLabel(scheme)}</p></div><div><p className="text-[#64748B]">Intake</p><p className="mt-0.5 font-medium text-[#172033]">{scheme.intakeCapacity.toLocaleString('en-IN')}</p></div><div><p className="text-[#64748B]">Applications</p><p className="mt-0.5 font-medium text-[#172033]">{scheme.applications.toLocaleString('en-IN')}</p></div></div><p className="mt-3 text-xs text-[#334155]">{scheme.benefits.amount}</p><button type="button" onClick={() => setSelectedId(scheme.id)} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2" aria-label={`Manage scheme ${scheme.name}`}><Eye size={14} aria-hidden="true" />Manage scheme</button></article>)}
          </div>
        </>
      )}

      <p className="border-t border-[#DCE3EC] pt-4 text-[11px] leading-5 text-[#64748B]">Illustrative SIH 2026 scheme catalog only. Scheme rules must follow official notifications; applicant eligibility decisions belong in Screening.</p>

      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="scheme-inspector-title">
          <button type="button" className="fixed inset-0 cursor-default bg-slate-900/40" onClick={closeInspector} aria-label="Close scheme inspector" />
          <aside className="relative z-10 flex h-full w-full flex-col border-l border-[#DCE3EC] bg-white shadow-2xl lg:max-w-[720px]">
            <header className="flex items-start justify-between gap-3 border-b border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{statusBadge(selectedScheme.status)}<span className="font-mono text-[11px] font-semibold text-[#173F7A]">{selectedScheme.code}</span></div><h2 id="scheme-inspector-title" className="mt-1 text-base font-bold text-[#172033]">{selectedScheme.name}</h2><p className="mt-0.5 text-xs text-[#64748B]">{selectedScheme.type} · {selectedScheme.academicYear}</p></div><button type="button" onClick={closeInspector} aria-label="Close scheme inspector" className="shrink-0 rounded-lg p-2 text-[#64748B] hover:bg-slate-200/70 hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563A8]"><X size={18} aria-hidden="true" /></button></header>
            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              <section aria-labelledby="scheme-basic-heading"><h3 id="scheme-basic-heading" className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">Basic information</h3><dl className="grid grid-cols-2 gap-x-4 gap-y-3 border border-[#DCE3EC] p-3 sm:grid-cols-3">{[['Scheme name', selectedScheme.name], ['Scheme code', selectedScheme.code], ['Scheme type', selectedScheme.type], ['Ministry', selectedScheme.ministry], ['Department', selectedScheme.department], ['Academic year', selectedScheme.academicYear], ['Status', selectedScheme.status]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[10px] text-[#64748B]">{label}</dt><dd className="mt-0.5 break-words text-xs font-semibold text-[#172033]">{value}</dd></div>)}</dl></section>
              <section aria-labelledby="scheme-window-heading" className="border border-[#DCE3EC] p-3"><h3 id="scheme-window-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Application window</h3><div className="mt-3 grid grid-cols-2 gap-3"><div><p className="text-[10px] text-[#64748B]">Opening date</p><p className="mt-1 text-xs font-semibold text-[#172033]">{selectedScheme.openingDate}</p></div><div><p className="text-[10px] text-[#64748B]">Closing date</p><p className="mt-1 text-xs font-semibold text-[#172033]">{selectedScheme.closingDate}</p></div></div><div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#EEF1F5] pt-3"><span className={`text-xs font-semibold ${windowClasses[windowLabel(selectedScheme)]}`}>{windowLabel(selectedScheme)}</span>{daysRemaining(selectedScheme) !== null && <span className="text-[10px] text-[#64748B]">{daysRemaining(selectedScheme)} days remaining</span>}</div></section>
              <section aria-labelledby="scheme-quota-heading" className="border border-[#DCE3EC] p-3"><div className="flex items-start justify-between gap-2"><div><h3 id="scheme-quota-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Intake &amp; quota</h3><p className="mt-1 text-[10px] text-[#64748B]">Quota values are illustrative demo figures.</p></div><span className="rounded bg-[#FFF8E8] px-2 py-1 text-[9px] font-bold text-[#79520F]">DEMO QUOTA</span></div><dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Total intake', selectedScheme.intakeCapacity.toLocaleString('en-IN')], ['Allocated seats', selectedScheme.allocatedSeats.toLocaleString('en-IN')], ['Remaining seats', Math.max(0, selectedScheme.intakeCapacity - selectedScheme.allocatedSeats).toLocaleString('en-IN')], ['Applications', selectedScheme.applications.toLocaleString('en-IN')]].map(([label, value]) => <div key={label}><dt className="text-[10px] text-[#64748B]">{label}</dt><dd className="mt-1 text-sm font-bold text-[#172033]">{value}</dd></div>)}</dl><div className="mt-3 space-y-2 border-t border-[#EEF1F5] pt-3"><p className="text-[10px] font-semibold text-[#334155]">Category / state allocation</p>{selectedScheme.categoryQuotas.length > 0 ? selectedScheme.categoryQuotas.map((quota, index) => <div key={`${quota.category}-${index}`} className="flex flex-wrap justify-between gap-2 text-[11px]"><span className="text-[#334155]">{quota.category} · {quota.region}</span><span className="font-medium text-[#172033]">{quota.seats} demo seats</span></div>) : <p className="text-[11px] text-[#64748B]">No separate allocation configured.</p>}</div></section>
              <section aria-labelledby="scheme-benefits-heading" className="border border-[#DCE3EC] p-3"><h3 id="scheme-benefits-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Benefits</h3><dl className="mt-3 grid grid-cols-2 gap-3"><div><dt className="text-[10px] text-[#64748B]">Amount</dt><dd className="mt-1 text-xs font-semibold text-[#172033]">{selectedScheme.benefits.amount}</dd></div><div><dt className="text-[10px] text-[#64748B]">Duration</dt><dd className="mt-1 text-xs font-semibold text-[#172033]">{selectedScheme.benefits.duration}</dd></div><div><dt className="text-[10px] text-[#64748B]">Frequency</dt><dd className="mt-1 text-xs font-semibold text-[#172033]">{selectedScheme.benefits.frequency}</dd></div><div><dt className="text-[10px] text-[#64748B]">Additional benefits / support</dt><dd className="mt-1 text-xs text-[#334155]">{selectedScheme.benefits.additionalSupport}</dd></div></dl></section>
              <section aria-labelledby="scheme-eligibility-heading" className="border border-[#DCE3EC] p-3"><h3 id="scheme-eligibility-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Eligibility summary</h3><dl className="mt-3 space-y-2">{[['ST/category requirement', selectedScheme.eligibility.categoryRequirement], ['Age criteria', selectedScheme.eligibility.ageCriteria], ['Income criteria', selectedScheme.eligibility.incomeCriteria], ['Academic criteria', selectedScheme.eligibility.academicCriteria], ['Course / institution criteria', selectedScheme.eligibility.courseInstitutionCriteria], ['Other conditions', selectedScheme.eligibility.otherConditions]].map(([label, value]) => <div key={label} className="border-t border-[#EEF1F5] pt-2 first:border-0 first:pt-0"><dt className="text-[10px] text-[#64748B]">{label}</dt><dd className="mt-0.5 text-[11px] leading-5 text-[#334155]">{value}</dd></div>)}</dl><p className="mt-3 border-t border-[#EEF1F5] pt-2 text-[10px] leading-4 text-[#64748B]">These criteria summarize scheme configuration only. Individual eligibility is reviewed through the Screening workflow.</p></section>
              <section aria-labelledby="scheme-documents-heading" className="border border-[#DCE3EC] p-3"><h3 id="scheme-documents-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Required documents</h3><ul className="mt-3 space-y-2">{selectedScheme.requiredDocuments.map((document, index) => <li key={`${document}-${index}`} className="flex items-start gap-2 text-[11px] leading-4 text-[#334155]"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]"><CheckCircle2 size={11} aria-hidden="true" /></span>{document}</li>)}</ul></section>
            </div>
            <footer className="flex flex-wrap gap-2 border-t border-[#DCE3EC] bg-[#F8FAFC] p-3 sm:p-4">
              <button type="button" onClick={() => openEdit(selectedScheme)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2"><Edit3 size={14} aria-hidden="true" />Edit Scheme</button>
              {selectedScheme.status !== 'Active' && <button type="button" onClick={() => updateStatus(selectedScheme, 'Active')} className="min-h-10 rounded-lg border border-[#B6E3D0] bg-[#EAF7F1] px-3 text-xs font-semibold text-[#126044] hover:bg-[#DDF2E8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Activate</button>}
              {selectedScheme.status !== 'Inactive' && <button type="button" onClick={() => updateStatus(selectedScheme, 'Inactive')} className="min-h-10 rounded-lg border border-[#DCE3EC] bg-white px-3 text-xs font-semibold text-[#334155] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Deactivate</button>}
              <button type="button" onClick={() => duplicateScheme(selectedScheme)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563A8]"><Copy size={14} aria-hidden="true" />Duplicate Scheme</button>
            </footer>
          </aside>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="scheme-form-title">
          <button type="button" className="fixed inset-0 cursor-default" onClick={closeForm} aria-label="Close scheme form" />
          <div className="relative z-10 flex h-full w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:border sm:border-[#DCE3EC]">
            <header className="flex items-center justify-between gap-3 border-b border-[#DCE3EC] bg-[#F8FAFC] px-4 py-3 sm:px-5"><div><h2 id="scheme-form-title" className="text-base font-bold text-[#172033]">{editingId === '__new__' ? 'Create Scheme' : 'Edit Scheme'}</h2><p className="mt-0.5 text-[11px] text-[#64748B]">Configuration is saved in this browser only.</p></div><button type="button" onClick={closeForm} aria-label="Close scheme form" className="rounded-lg p-2 text-[#64748B] hover:bg-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#2563A8]"><X size={18} aria-hidden="true" /></button></header>
            <form onSubmit={saveForm} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
                {formErrors.form && <p role="alert" className="flex items-center gap-2 border border-[#F0C7CA] bg-[#FDF0F0] p-3 text-xs text-[#A52C37]"><AlertCircle size={15} aria-hidden="true" />{formErrors.form}</p>}
                <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Basic configuration</h3><div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Scheme name" required value={form.name} error={formErrors.name} onChange={(value) => patchForm('name', value)} />
                  <FormInput label="Scheme code" required value={form.code} error={formErrors.code} onChange={(value) => patchForm('code', value)} />
                  <Field label="Scheme type" required><select value={form.type} onChange={(event) => patchForm('type', event.target.value as SchemeFormValues['type'])} className={inputClass}><option>Scholarship</option><option>Fellowship</option></select></Field>
                  <FormInput label="Academic year" required value={form.academicYear} error={formErrors.academicYear} placeholder="2026–27" onChange={(value) => patchForm('academicYear', value)} />
                  <Field label="Status" required><select value={form.status} onChange={(event) => patchForm('status', event.target.value as ManagedSchemeStatus)} className={inputClass}>{(['Active', 'Draft', 'Upcoming', 'Closed', 'Inactive'] as ManagedSchemeStatus[]).map((status) => <option key={status}>{status}</option>)}</select></Field>
                  <div className="hidden sm:block" />
                </div></section>
                <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Application window &amp; intake</h3><div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Opening date" required type="date" value={form.openingDate} error={formErrors.openingDate} onChange={(value) => patchForm('openingDate', value)} />
                  <FormInput label="Closing date" required type="date" value={form.closingDate} error={formErrors.closingDate} onChange={(value) => patchForm('closingDate', value)} />
                  <FormInput label="Intake capacity" required type="number" min="0" step="1" value={form.intakeCapacity} error={formErrors.intakeCapacity} onChange={(value) => patchForm('intakeCapacity', value)} />
                </div></section>
                <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Benefits</h3><div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Benefit amount / description" required value={form.benefitAmount} error={formErrors.benefitAmount} onChange={(value) => patchForm('benefitAmount', value)} />
                  <FormInput label="Duration" required value={form.benefitDuration} error={formErrors.benefitDuration} onChange={(value) => patchForm('benefitDuration', value)} />
                  <FormInput label="Frequency" value={form.benefitFrequency} onChange={(value) => patchForm('benefitFrequency', value)} />
                  <FormInput label="Additional benefits / support" value={form.additionalSupport} onChange={(value) => patchForm('additionalSupport', value)} />
                </div></section>
                <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Eligibility summary</h3><div className="grid gap-3 sm:grid-cols-2">
                  <FormTextarea label="ST / category requirement" required value={form.categoryRequirement} error={formErrors.categoryRequirement} onChange={(value) => patchForm('categoryRequirement', value)} />
                  <FormTextarea label="Age criteria" required value={form.ageCriteria} error={formErrors.ageCriteria} onChange={(value) => patchForm('ageCriteria', value)} />
                  <FormTextarea label="Income criteria" required value={form.incomeCriteria} error={formErrors.incomeCriteria} onChange={(value) => patchForm('incomeCriteria', value)} />
                  <FormTextarea label="Academic criteria" required value={form.academicCriteria} error={formErrors.academicCriteria} onChange={(value) => patchForm('academicCriteria', value)} />
                  <FormTextarea label="Course / institution criteria" required value={form.courseInstitutionCriteria} error={formErrors.courseInstitutionCriteria} onChange={(value) => patchForm('courseInstitutionCriteria', value)} />
                  <FormTextarea label="Other conditions" required value={form.otherConditions} error={formErrors.otherConditions} onChange={(value) => patchForm('otherConditions', value)} />
                </div></section>
                <section><h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Required documents</h3><FormTextarea label="Required documents (one per line)" required value={form.requiredDocuments} error={formErrors.requiredDocuments} onChange={(value) => patchForm('requiredDocuments', value)} /></section>
              </div>
              <footer className="flex flex-wrap justify-end gap-2 border-t border-[#DCE3EC] bg-[#F8FAFC] p-3 sm:px-5"><button type="button" onClick={closeForm} className="min-h-10 rounded-lg border border-[#DCE3EC] bg-white px-4 text-xs font-semibold text-[#334155] hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Cancel</button><button type="submit" className="min-h-10 rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2">{editingId === '__new__' ? 'Create Scheme' : 'Save Changes'}</button></footer>
            </form>
          </div>
        </div>
      )}
    </div>
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
  const id = `scheme-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <Field label={label} required={required}>
      <input {...inputProps} id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={inputClass} />
      {error && <span id={`${id}-error`} className="mt-1 block text-[10px] text-[#A52C37]">{error}</span>}
    </Field>
  );
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
  const id = `scheme-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <Field label={label} required={required}>
      <textarea id={id} rows={3} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={textareaClass} />
      {error && <span id={`${id}-error`} className="mt-1 block text-[10px] text-[#A52C37]">{error}</span>}
    </Field>
  );
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
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-lg border border-[#DCE3EC] bg-white px-3 pr-8 text-xs font-medium text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20">{children}</select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-[#64748B]" aria-hidden="true" />
    </label>
  );
}
