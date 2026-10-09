'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileCheck2,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  createInitialSelectionCases,
  isStoredSelectionState,
  mergeSelectionState,
  SELECTION_STORAGE_KEY,
  toStoredSelectionState,
  type SanctionStatus,
  type SelectionActivity,
  type SelectionApprovalStatus,
  type SelectionCase,
  type SelectionStatus,
} from '@/lib/adminSelectionData';
import type { AdminApplicationRecord, AdminSchemeSummary } from '@/lib/adminData';

type SelectionPageClientProps = {
  applications: AdminApplicationRecord[];
  schemes: AdminSchemeSummary[];
};

type SelectionAction =
  | 'Record selected'
  | 'Place on waitlist'
  | 'Mark not recommended'
  | 'Submit for approval'
  | 'Approve selection'
  | 'Return for review'
  | 'Mark sanction ready'
  | 'Submit sanction'
  | 'Record sanction issued';

const priorityClasses = {
  High: 'bg-[#FDF0F0] text-[#A52C37]',
  Medium: 'bg-[#FFF8E8] text-[#8A5B12]',
  Low: 'bg-[#EAF7F1] text-[#126044]',
} as const;

const statusClasses: Record<SelectionStatus, string> = {
  Recommended: 'border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]',
  Selected: 'border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]',
  Waitlisted: 'border-[#E4C98F] bg-[#FFF8E8] text-[#79520F]',
  'Not Recommended': 'border-[#F0C7CA] bg-[#FDF0F0] text-[#A52C37]',
};

const approvalClasses: Record<SelectionApprovalStatus, string> = {
  'Pending Approval': 'border-[#C7D9EF] bg-[#EEF5FC] text-[#173F7A]',
  Approved: 'border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]',
  'Returned for Review': 'border-[#E4C98F] bg-[#FFF8E8] text-[#79520F]',
};

const sanctionClasses: Record<SanctionStatus, string> = {
  'Not Started': 'text-[#64748B]',
  'Sanction Ready': 'text-[#126044]',
  Submitted: 'text-[#173F7A]',
  Sanctioned: 'text-[#126044]',
};

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex max-w-full items-center rounded-md border px-2 py-1 text-[10px] font-semibold leading-4 ${className}`}>{children}</span>;
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
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-[#DCE3EC] bg-white px-3 pr-8 text-xs font-medium text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-[#64748B]" aria-hidden="true" />
    </label>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function SelectionPageClient({ applications, schemes }: SelectionPageClientProps) {
  const initialCases = useMemo(
    () => createInitialSelectionCases(applications, schemes),
    [applications, schemes],
  );
  const [cases, setCases] = useState<SelectionCase[]>(initialCases);
  const [query, setQuery] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectionFilter, setSelectionFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('merit');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [formError, setFormError] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SELECTION_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isStoredSelectionState(parsed)) {
          setCases(mergeSelectionState(initialCases, parsed));
        } else {
          setStorageMessage('Saved selection state is invalid. Illustrative default records are shown.');
        }
      }
    } catch {
      setStorageMessage('Saved selection state is unavailable. Changes may not persist in this browser.');
    } finally {
      setHasLoadedStorage(true);
    }
  }, [initialCases]);

  useEffect(() => {
    if (!selectedId) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeInspector();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedId]);

  function persist(nextCases: SelectionCase[]) {
    setCases(nextCases);
    if (!hasLoadedStorage) return;
    try {
      window.localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(toStoredSelectionState(nextCases)));
      setStorageMessage('');
    } catch {
      setStorageMessage('Changes are active for this session but could not be saved in this browser.');
    }
  }

  function closeInspector() {
    setSelectedId(null);
    setReviewNote('');
    setFormError('');
  }

  const selectedCase = selectedId
    ? cases.find(({ application }) => application.applicationId === selectedId) ?? null
    : null;

  const options = useMemo(() => ({
    schemes: [...new Map(cases.map(({ application }) => [application.schemeId, application.schemeName])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1])),
    states: [...new Set(cases.map(({ application }) => application.state))].sort(),
    categories: [...new Set(cases.map(({ application }) => application.category))].sort(),
  }), [cases]);

  const filteredCases = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = cases.filter(({ application, selectionStatus, approvalStatus, priority }) => {
      if (search && !application.applicationId.toLowerCase().includes(search) && !application.applicantName.toLowerCase().includes(search)) return false;
      if (schemeFilter !== 'all' && application.schemeId !== schemeFilter) return false;
      if (stateFilter !== 'all' && application.state !== stateFilter) return false;
      if (categoryFilter !== 'all' && application.category !== categoryFilter) return false;
      if (selectionFilter !== 'all' && selectionStatus !== selectionFilter) return false;
      if (approvalFilter !== 'all' && approvalStatus !== approvalFilter) return false;
      if (priorityFilter !== 'all' && priority !== priorityFilter) return false;
      return true;
    });

    return filtered.sort((first, second) => {
      if (sortBy === 'score') return second.totalMeritScore - first.totalMeritScore;
      if (sortBy === 'application-date') return second.application.submittedDate.localeCompare(first.application.submittedDate);
      return first.rank - second.rank;
    });
  }, [approvalFilter, cases, categoryFilter, priorityFilter, query, schemeFilter, selectionFilter, sortBy, stateFilter]);

  const metrics = useMemo(() => {
    const schemeIds = new Set(cases.map(({ application }) => application.schemeId));
    const quotaCapacity = schemes
      .filter(({ schemeId }) => schemeIds.has(schemeId))
      .reduce((total, scheme) => total + scheme.totalSlots, 0);
    return {
      totalScreened: cases.length,
      recommended: cases.filter(({ selectionStatus }) => selectionStatus === 'Recommended').length,
      selected: cases.filter(({ selectionStatus }) => selectionStatus === 'Selected').length,
      pendingApproval: cases.filter(({ selectionStatus, approvalStatus }) =>
        selectionStatus === 'Selected' && approvalStatus === 'Pending Approval',
      ).length,
      sanctionReady: cases.filter(({ sanctionStatus }) => sanctionStatus === 'Sanction Ready').length,
      quotaRemaining: Math.max(
        0,
        quotaCapacity - cases.filter(({ selectionStatus }) => selectionStatus === 'Selected').length,
      ),
    };
  }, [cases, schemes]);

  function clearFilters() {
    setQuery('');
    setSchemeFilter('all');
    setStateFilter('all');
    setCategoryFilter('all');
    setSelectionFilter('all');
    setApprovalFilter('all');
    setPriorityFilter('all');
    setSortBy('merit');
  }

  function updateCase(action: SelectionAction) {
    if (!selectedCase) return;
    const note = reviewNote.trim();
    if (!note) {
      setFormError('Enter an official review note before recording this action.');
      return;
    }
    if (action === 'Mark sanction ready' && selectedCase.approvalStatus !== 'Approved') {
      setFormError('Selection approval is required before marking a case sanction ready.');
      return;
    }
    if (action === 'Submit sanction' && selectedCase.sanctionStatus !== 'Sanction Ready') {
      setFormError('Mark the case sanction ready before submitting the sanction.');
      return;
    }
    if (action === 'Record sanction issued' && selectedCase.sanctionStatus !== 'Submitted') {
      setFormError('Submit the sanction before recording it as issued.');
      return;
    }

    const changes: Partial<SelectionCase> = {};
    if (action === 'Record selected') {
      changes.selectionStatus = 'Selected';
      changes.approvalStatus = 'Pending Approval';
    }
    if (action === 'Place on waitlist') changes.selectionStatus = 'Waitlisted';
    if (action === 'Mark not recommended') changes.selectionStatus = 'Not Recommended';
    if (action === 'Submit for approval') {
      if (selectedCase.selectionStatus !== 'Selected') {
        setFormError('Record a selection decision before submitting it for approval.');
        return;
      }
      changes.approvalStatus = 'Pending Approval';
    }
    if (action === 'Approve selection') {
      if (selectedCase.selectionStatus !== 'Selected') {
        setFormError('Only a selected application can be approved.');
        return;
      }
      changes.approvalStatus = 'Approved';
    }
    if (action === 'Return for review') changes.approvalStatus = 'Returned for Review';
    if (action === 'Mark sanction ready') changes.sanctionStatus = 'Sanction Ready';
    if (action === 'Submit sanction') changes.sanctionStatus = 'Submitted';
    if (action === 'Record sanction issued') changes.sanctionStatus = 'Sanctioned';

    const timestamp = new Date().toISOString();
    const activity: SelectionActivity = {
      id: `${selectedCase.application.applicationId}-${Date.now()}`,
      timestamp,
      action,
      details: note,
      actor: 'MoTA Administrator',
      isDemo: false,
    };
    const updatedCase: SelectionCase = {
      ...selectedCase,
      ...changes,
      reviewNotes: [
        ...selectedCase.reviewNotes,
        {
          id: `${selectedCase.application.applicationId}-note-${Date.now()}`,
          timestamp,
          author: 'MoTA Administrator',
          action,
          note,
        },
      ],
      activities: [...selectedCase.activities, activity],
      updatedAt: timestamp,
    };
    persist(cases.map((item) =>
      item.application.applicationId === selectedId ? updatedCase : item,
    ));
    setReviewNote('');
    setFormError('');
  }

  const schemeSelectedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    cases.forEach(({ application, selectionStatus }) => {
      if (selectionStatus === 'Selected') {
        counts.set(application.schemeId, (counts.get(application.schemeId) ?? 0) + 1);
      }
    });
    return counts;
  }, [cases]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 text-xs text-[#64748B]">
            <span>Administration</span><span className="px-2">/</span><span aria-current="page" className="font-medium text-[#172033]">Selection &amp; Sanction</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Selection &amp; Sanction</h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-[#64748B]">
            Review merit-ranked applications, manage quota allocation, and process selection and sanction decisions.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[#E4C98F] bg-[#FFF8E8] px-2.5 py-1.5 text-[10px] font-bold tracking-[0.08em] text-[#79520F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B7791F]" aria-hidden="true" />DEMO DATA
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total Screened', value: metrics.totalScreened, icon: FileCheck2, color: 'text-[#173F7A]' },
          { label: 'Recommended for Selection', value: metrics.recommended, icon: Award, color: 'text-[#2563A8]' },
          { label: 'Selected', value: metrics.selected, icon: CheckCircle2, color: 'text-[#16805B]' },
          { label: 'Pending Approval', value: metrics.pendingApproval, icon: Clock3, color: 'text-[#B7791F]' },
          { label: 'Sanction Ready', value: metrics.sanctionReady, icon: ShieldCheck, color: 'text-[#16805B]' },
          { label: 'Quota Remaining', value: metrics.quotaRemaining, icon: Info, color: 'text-[#64748B]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <section key={label} className="min-w-0 border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium leading-4 text-[#64748B]">{label}</p>
              <Icon size={17} className={`shrink-0 ${color}`} aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#172033]">{value.toLocaleString('en-IN')}</p>
          </section>
        ))}
      </div>

      <div className="flex items-start gap-2 border border-[#C7D9EF] bg-[#EEF5FC] px-4 py-3 text-xs leading-5 text-[#334155]">
        <Info size={16} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />
        <p><strong className="font-semibold text-[#173F7A]">Merit ranking and selection recommendation.</strong> Scores, rankings, and quota figures are illustrative demo data. They support transparent review and do not replace authorized official decisions. Official review required before selection or sanction.</p>
      </div>

      <section className="border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]" aria-label="Selection queue filters">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <label className="relative sm:col-span-2">
            <span className="sr-only">Search by application ID or applicant</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-3 text-[#64748B]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Application ID / Applicant"
              className="h-10 w-full rounded-lg border border-[#DCE3EC] bg-white pl-9 pr-3 text-xs text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
            />
          </label>
          <FilterSelect label="Filter by scheme" value={schemeFilter} onChange={setSchemeFilter}>
            <option value="all">All schemes</option>
            {options.schemes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by state" value={stateFilter} onChange={setStateFilter}>
            <option value="all">All states</option>
            {options.states.map((state) => <option key={state} value={state}>{state}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by category" value={categoryFilter} onChange={setCategoryFilter}>
            <option value="all">All categories</option>
            {options.categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by selection status" value={selectionFilter} onChange={setSelectionFilter}>
            <option value="all">All selection statuses</option>
            {(['Recommended', 'Selected', 'Waitlisted', 'Not Recommended'] as SelectionStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by approval status" value={approvalFilter} onChange={setApprovalFilter}>
            <option value="all">All approval statuses</option>
            {(['Pending Approval', 'Approved', 'Returned for Review'] as SelectionApprovalStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by priority" value={priorityFilter} onChange={setPriorityFilter}>
            <option value="all">All priorities</option>
            <option value="High">High priority</option>
            <option value="Medium">Medium priority</option>
            <option value="Low">Low priority</option>
          </FilterSelect>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[#64748B]">Showing <strong className="font-semibold text-[#172033]">{filteredCases.length}</strong> of {cases.length} screened applications</p>
          <div className="flex items-center gap-2">
            <label htmlFor="selection-sort" className="text-[11px] font-medium text-[#64748B]">Sort by</label>
            <select id="selection-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 rounded-lg border border-[#DCE3EC] bg-white px-2.5 text-xs text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20">
              <option value="merit">Merit rank</option>
              <option value="score">Merit score</option>
              <option value="application-date">Application date</option>
            </select>
            <button type="button" onClick={clearFilters} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Clear filters</button>
          </div>
        </div>
      </section>

      {storageMessage && <p role="status" className="border border-[#E4C98F] bg-[#FFF8E8] px-4 py-2.5 text-xs text-[#79520F]">{storageMessage}</p>}

      {cases.length > 0 && (
        <section aria-label="Illustrative quota allocation" className="border border-[#DCE3EC] bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#172033]">Quota allocation</h2>
              <p className="mt-0.5 text-[10px] text-[#64748B]">Illustrative scheme-level capacity and recorded selections</p>
            </div>
            <span className="text-[10px] text-[#64748B]">Figures are demo-only</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {options.schemes.map(([schemeId, schemeName]) => {
              const scheme = schemes.find(({ schemeId: id }) => id === schemeId);
              const capacity = scheme?.totalSlots ?? 0;
              const selected = schemeSelectedCounts.get(schemeId) ?? 0;
              const usedPercentage = capacity > 0 ? Math.min(100, (selected / capacity) * 100) : 0;
              return (
                <div key={schemeId} className="border border-[#EEF1F5] p-3">
                  <p className="line-clamp-2 min-h-8 text-[11px] font-semibold text-[#172033]">{schemeName}</p>
                  <div className="mt-2 flex justify-between text-[10px] text-[#64748B]">
                    <span>{selected} selected</span><span>{Math.max(0, capacity - selected).toLocaleString('en-IN')} remaining</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-[#E8EDF3]" role="progressbar" aria-label={`${schemeName} illustrative quota used`} aria-valuenow={Math.round(usedPercentage)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-[#2563A8]" style={{ width: `${usedPercentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {filteredCases.length === 0 ? (
        <div className="flex flex-col items-center border border-[#DCE3EC] bg-white px-6 py-12 text-center">
          <Search size={25} className="text-[#64748B]" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold text-[#172033]">No selection cases found</h2>
          <p className="mt-1 text-xs text-[#64748B]">Try changing the search or filters.</p>
          <button type="button" onClick={clearFilters} className="mt-3 rounded-lg bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Clear filters</button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)] xl:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px] text-left text-xs text-[#172033]" aria-label="Selection and sanction queue">
                <thead className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                  <tr>
                    {['Rank', 'Priority', 'Application ID', 'Applicant', 'Scheme', 'State', 'Category', 'Merit Score', 'Quota', 'Recommendation', 'Selection Status', 'Approval Status', 'Action'].map((heading) => <th key={heading} scope="col" className="px-3 py-3">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F5]">
                  {filteredCases.map((selectionCase) => {
                    const app = selectionCase.application;
                    const selectedInScheme = schemeSelectedCounts.get(app.schemeId) ?? 0;
                    return (
                      <tr key={app.applicationId} className="hover:bg-[#F8FAFC]/70">
                        <td className="px-3 py-3.5 font-mono font-bold text-[#173F7A]">#{selectionCase.rank}</td>
                        <td className="px-3 py-3.5"><span className={`rounded px-2 py-1 text-[10px] font-semibold ${priorityClasses[selectionCase.priority]}`}>{selectionCase.priority}</span></td>
                        <td className="whitespace-nowrap px-3 py-3.5 font-mono font-semibold text-[#173F7A]">{app.applicationId}</td>
                        <td className="px-3 py-3.5"><p className="font-semibold">{app.applicantName}</p><p className="mt-0.5 text-[10px] text-[#64748B]">{app.academicLevel ?? app.course}</p></td>
                        <td className="max-w-[190px] px-3 py-3.5"><p className="line-clamp-2" title={app.schemeName}>{app.schemeName}</p></td>
                        <td className="px-3 py-3.5">{app.state}</td>
                        <td className="px-3 py-3.5">{app.category}</td>
                        <td className="whitespace-nowrap px-3 py-3.5"><span className="font-semibold">{selectionCase.totalMeritScore.toFixed(1)}</span><span className="text-[#64748B]"> / 100</span></td>
                        <td className="px-3 py-3.5"><span className="block text-[10px] font-medium">{selectionCase.quotaName}</span><span className="text-[10px] text-[#64748B]">{selectedInScheme}/{selectionCase.quotaCapacity.toLocaleString('en-IN')} filled</span></td>
                        <td className="max-w-[150px] px-3 py-3.5 text-[10px] text-[#334155]">{selectionCase.recommendation}</td>
                        <td className="px-3 py-3.5"><Badge className={statusClasses[selectionCase.selectionStatus]}>{selectionCase.selectionStatus}</Badge></td>
                        <td className="px-3 py-3.5"><Badge className={approvalClasses[selectionCase.approvalStatus]}>{selectionCase.approvalStatus}</Badge></td>
                        <td className="px-3 py-3.5 text-right"><button type="button" onClick={() => setSelectedId(app.applicationId)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#DCE3EC] px-2.5 text-xs font-semibold text-[#173F7A] hover:bg-[#173F7A] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#2563A8]" aria-label={`Review selection for ${app.applicationId}, ${app.applicantName}`}><Eye size={14} aria-hidden="true" />Review</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="hidden overflow-hidden border border-[#DCE3EC] bg-white md:block xl:hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs text-[#172033]" aria-label="Condensed selection and sanction queue">
                <thead className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                  <tr><th scope="col" className="px-3 py-3">Rank / applicant</th><th scope="col" className="px-3 py-3">Scheme / State</th><th scope="col" className="px-3 py-3">Score / quota</th><th scope="col" className="px-3 py-3">Recommendation</th><th scope="col" className="px-3 py-3">Status</th><th scope="col" className="px-3 py-3 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F5]">
                  {filteredCases.map((item) => (
                    <tr key={item.application.applicationId} className="hover:bg-[#F8FAFC]/70">
                      <td className="px-3 py-3"><p className="font-mono font-semibold text-[#173F7A]">#{item.rank} · {item.application.applicationId}</p><p className="mt-1 font-semibold">{item.application.applicantName}</p><span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${priorityClasses[item.priority]}`}>{item.priority}</span></td>
                      <td className="max-w-[200px] px-3 py-3"><p className="line-clamp-2">{item.application.schemeName}</p><p className="mt-1 text-[10px] text-[#64748B]">{item.application.state}</p></td>
                      <td className="px-3 py-3"><p className="font-semibold">{item.totalMeritScore.toFixed(1)} / 100</p><p className="mt-1 text-[10px] text-[#64748B]">{item.quotaName}</p></td>
                      <td className="max-w-[150px] px-3 py-3 text-[10px]">{item.recommendation}</td>
                      <td className="px-3 py-3"><Badge className={statusClasses[item.selectionStatus]}>{item.selectionStatus}</Badge><p className="mt-1 text-[10px] text-[#64748B]">{item.approvalStatus}</p></td>
                      <td className="px-3 py-3 text-right"><button type="button" onClick={() => setSelectedId(item.application.applicationId)} className="min-h-9 rounded-md border border-[#DCE3EC] px-2.5 text-xs font-semibold text-[#173F7A] focus:outline-none focus:ring-2 focus:ring-[#2563A8]" aria-label={`Review selection for ${item.application.applicationId}, ${item.application.applicantName}`}>Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredCases.map((item) => (
              <article key={item.application.applicationId} className="border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="font-mono text-xs font-semibold text-[#173F7A]">Rank #{item.rank} · {item.application.applicationId}</p><h2 className="mt-1 text-sm font-semibold text-[#172033]">{item.application.applicantName}</h2></div>
                  <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${priorityClasses[item.priority]}`}>{item.priority}</span>
                </div>
                <p className="mt-2 text-xs text-[#334155]">{item.application.schemeName}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#64748B]"><MapPin size={13} aria-hidden="true" />{item.application.state} · {item.application.category}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2"><strong className="text-sm text-[#172033]">{item.totalMeritScore.toFixed(1)}<span className="font-normal text-[#64748B]"> / 100</span></strong><Badge className={statusClasses[item.selectionStatus]}>{item.selectionStatus}</Badge></div>
                <p className="mt-2 text-[11px] text-[#64748B]">{item.recommendation} · {item.approvalStatus}</p>
                <button type="button" onClick={() => setSelectedId(item.application.applicationId)} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2" aria-label={`Review selection for ${item.application.applicationId}, ${item.application.applicantName}`}><Eye size={15} aria-hidden="true" />Review case</button>
              </article>
            ))}
          </div>
        </>
      )}

      <p className="border-t border-[#DCE3EC] pt-4 text-[11px] leading-5 text-[#64748B]">
        All applicant, merit, quota, and sanction details are illustrative SIH demonstration data. Final selection and sanction require authorized official review.
      </p>

      {selectedCase && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="selection-inspector-title">
          <button type="button" className="fixed inset-0 cursor-default bg-slate-900/40" onClick={closeInspector} aria-label="Close selection inspector" />
          <aside className="relative z-10 flex h-full w-full flex-col border-l border-[#DCE3EC] bg-white shadow-2xl lg:max-w-[720px]">
            <header className="flex items-start justify-between gap-3 border-b border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="break-all font-mono text-xs font-bold text-[#173F7A]">{selectedCase.application.applicationId}</span><span className="rounded bg-[#EEF5FC] px-2 py-1 text-[10px] font-semibold text-[#173F7A]">Merit rank #{selectedCase.rank}</span></div>
                <h2 id="selection-inspector-title" className="mt-1 truncate text-base font-bold text-[#172033]">{selectedCase.application.applicantName}</h2>
                <p className="mt-0.5 line-clamp-2 text-xs text-[#64748B]">{selectedCase.application.schemeName}</p>
              </div>
              <button type="button" onClick={closeInspector} aria-label="Close selection inspector" className="shrink-0 rounded-lg p-2 text-[#64748B] hover:bg-slate-200/70 hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563A8]"><X size={18} aria-hidden="true" /></button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              <section aria-labelledby="applicant-summary-heading">
                <h3 id="applicant-summary-heading" className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">Applicant summary</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border border-[#DCE3EC] p-3 sm:grid-cols-3">
                  {[
                    ['Application ID', selectedCase.application.applicationId],
                    ['Applicant name', selectedCase.application.applicantName],
                    ['Scheme', selectedCase.application.schemeName],
                    ['Academic year', selectedCase.application.academicYear],
                    ['State / district', `${selectedCase.application.state} · ${selectedCase.application.district}`],
                    ['Category', selectedCase.application.category],
                    ['Current stage', selectedCase.application.currentStage],
                    ['Application status', selectedCase.application.status],
                  ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[10px] text-[#64748B]">{label}</dt><dd className="mt-0.5 break-words text-xs font-semibold text-[#172033]">{value}</dd></div>)}
                </dl>
              </section>

              <section aria-labelledby="merit-breakdown-heading" className="border border-[#DCE3EC]">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#EEF1F5] p-3">
                  <div><h3 id="merit-breakdown-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Merit ranking</h3><p className="mt-1 text-[10px] text-[#64748B]">Illustrative factor calculation · inspect underlying records during official review</p></div>
                  <div className="text-right"><p className="text-[10px] text-[#64748B]">Total Merit Score</p><p className="text-xl font-bold text-[#173F7A]">{selectedCase.totalMeritScore.toFixed(1)}<span className="text-xs font-medium text-[#64748B]"> / 100</span></p></div>
                </div>
                <ul className="divide-y divide-[#EEF1F5]">
                  {selectedCase.meritFactors.map((factor) => (
                    <li key={factor.id} className="p-3">
                      <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-[#172033]">{factor.label}</span><span className="whitespace-nowrap text-xs font-semibold text-[#173F7A]">{factor.score} / {factor.maximum}</span></div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-[#E8EDF3]" role="progressbar" aria-label={`${factor.label} illustrative score`} aria-valuenow={factor.score} aria-valuemin={0} aria-valuemax={factor.maximum}><div className="h-full rounded-full bg-[#2563A8]" style={{ width: `${(factor.score / factor.maximum) * 100}%` }} /></div>
                      <p className="mt-1 text-[10px] text-[#64748B]">{factor.basis}</p>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-[#EEF1F5] bg-[#F8FAFC] px-3 py-2 text-[10px] leading-4 text-[#64748B]">The merit breakdown is a demonstration aid, not an unquestionable decision or substitute for the published scheme rules and official scrutiny.</p>
              </section>

              <section aria-labelledby="recommendation-heading" className="border border-[#DCE3EC] p-3">
                <h3 id="recommendation-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Selection recommendation</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2"><Badge className={statusClasses[selectedCase.selectionStatus]}>{selectedCase.selectionStatus}</Badge><span className="text-xs font-medium text-[#334155]">{selectedCase.recommendation}</span></div>
                <p className="mt-2 text-[11px] leading-5 text-[#64748B]">Official review required. A recommendation or merit rank does not constitute final selection.</p>
              </section>

              <section aria-labelledby="quota-heading" className="border border-[#DCE3EC] p-3">
                <h3 id="quota-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Quota allocation</h3>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-semibold text-[#172033]">{selectedCase.quotaName}</p><p className="mt-1 text-[10px] text-[#64748B]">{selectedCase.application.schemeName}</p></div><p className="text-xs font-semibold text-[#173F7A]">{schemeSelectedCounts.get(selectedCase.application.schemeId) ?? 0} / {selectedCase.quotaCapacity.toLocaleString('en-IN')} demo slots recorded</p></div>
                <p className="mt-2 text-[10px] leading-4 text-[#64748B]">Quota capacities are illustrative placeholders from scheme summary data; confirm notified allocation before any official decision.</p>
              </section>

              <section aria-labelledby="approval-heading" className="border border-[#DCE3EC] p-3">
                <h3 id="approval-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Selection &amp; sanction workflow</h3>
                <ol className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    ['Selection', selectedCase.selectionStatus],
                    ['Approval', selectedCase.approvalStatus],
                    ['Sanction', selectedCase.sanctionStatus],
                  ].map(([label, value], index) => <li key={label} className="border border-[#EEF1F5] p-2.5"><p className="text-[10px] text-[#64748B]">{index + 1}. {label}</p><p className={`mt-1 text-xs font-semibold ${label === 'Selection' ? 'text-[#172033]' : label === 'Approval' ? approvalClasses[selectedCase.approvalStatus].split(' ').pop() : sanctionClasses[selectedCase.sanctionStatus]}`}>{value}</p></li>)}
                </ol>
              </section>

              <section aria-labelledby="review-actions-heading" className="border border-[#DCE3EC] p-3">
                <h3 id="review-actions-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Authorized official actions</h3>
                <label htmlFor="selection-review-note" className="mt-3 block text-[11px] font-semibold text-[#334155]">Review note <span className="font-normal text-[#64748B]">(required)</span></label>
                <textarea id="selection-review-note" value={reviewNote} onChange={(event) => { setReviewNote(event.target.value); setFormError(''); }} rows={3} maxLength={1000} placeholder="Record the basis for your selection, approval, or sanction action." className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-[#DCE3EC] px-3 py-2 text-xs leading-5 text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20" />
                <div className="mt-1 flex items-center justify-between gap-2">{formError ? <p role="alert" className="text-[11px] text-[#A52C37]">{formError}</p> : <span className="text-[10px] text-[#64748B]">Persisted in this browser only.</span>}<span className="ml-auto text-[10px] text-[#64748B]">{reviewNote.length}/1000</span></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selectedCase.selectionStatus !== 'Selected' && <button type="button" onClick={() => updateCase('Record selected')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2"><CheckCircle2 size={15} aria-hidden="true" />Record selected</button>}
                  {selectedCase.selectionStatus !== 'Waitlisted' && <button type="button" onClick={() => updateCase('Place on waitlist')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] px-3 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Place on waitlist</button>}
                  {selectedCase.selectionStatus !== 'Not Recommended' && <button type="button" onClick={() => updateCase('Mark not recommended')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] px-3 text-xs font-semibold text-[#A52C37] hover:bg-[#FDF0F0] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Mark not recommended</button>}
                  {selectedCase.selectionStatus === 'Selected' && selectedCase.approvalStatus !== 'Approved' && <button type="button" onClick={() => updateCase('Submit for approval')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Submit for approval</button>}
                  {selectedCase.selectionStatus === 'Selected' && selectedCase.approvalStatus !== 'Approved' && <button type="button" onClick={() => updateCase('Approve selection')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#B6E3D0] bg-[#EAF7F1] px-3 text-xs font-semibold text-[#126044] hover:bg-[#DDF2E8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]"><ShieldCheck size={15} aria-hidden="true" />Approve selection</button>}
                  {selectedCase.selectionStatus === 'Selected' && selectedCase.approvalStatus !== 'Returned for Review' && <button type="button" onClick={() => updateCase('Return for review')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#E4C98F] px-3 text-xs font-semibold text-[#79520F] hover:bg-[#FFF8E8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Return for review</button>}
                  {selectedCase.approvalStatus === 'Approved' && selectedCase.sanctionStatus === 'Not Started' && <button type="button" onClick={() => updateCase('Mark sanction ready')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2"><FileCheck2 size={15} aria-hidden="true" />Mark sanction ready</button>}
                  {selectedCase.sanctionStatus === 'Sanction Ready' && <button type="button" onClick={() => updateCase('Submit sanction')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Submit sanction</button>}
                  {selectedCase.sanctionStatus === 'Submitted' && <button type="button" onClick={() => updateCase('Record sanction issued')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#B6E3D0] bg-[#EAF7F1] px-3 text-xs font-semibold text-[#126044] hover:bg-[#DDF2E8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">Record sanction issued</button>}
                </div>
              </section>

              {selectedCase.reviewNotes.length > 0 && (
                <section aria-labelledby="selection-notes-heading" className="border border-[#DCE3EC] p-3">
                  <h3 id="selection-notes-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Official review notes</h3>
                  <ul className="mt-2 space-y-3">{[...selectedCase.reviewNotes].reverse().map((note) => <li key={note.id} className="border-l-2 border-[#2563A8] pl-3"><p className="text-xs leading-5 text-[#334155]">{note.note}</p><p className="mt-1 text-[10px] text-[#64748B]">{note.action} · {note.author} · {formatTimestamp(note.timestamp)}</p></li>)}</ul>
                </section>
              )}

              <section aria-labelledby="selection-activity-heading">
                <h3 id="selection-activity-heading" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#64748B]"><Clock3 size={14} aria-hidden="true" />Activity history</h3>
                <ol className="space-y-0 border-l border-[#DCE3EC] pl-4">
                  {[...selectedCase.activities].reverse().map((activity) => (
                    <li key={activity.id} className="relative pb-4 last:pb-0">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#2563A8] ring-1 ring-[#C7D9EF]" aria-hidden="true" />
                      <div className="flex flex-wrap items-center gap-1.5"><h4 className="text-xs font-semibold text-[#172033]">{activity.action}</h4>{activity.isDemo && <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[9px] font-semibold text-[#64748B]">DEMO</span>}</div>
                      <p className="mt-1 text-[11px] leading-5 text-[#64748B]">{activity.details}</p>
                      <p className="mt-0.5 text-[10px] text-[#64748B]">{activity.actor} · {formatTimestamp(activity.timestamp)}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <footer className="border-t border-[#DCE3EC] bg-[#F8FAFC] px-4 py-3 text-[10px] leading-4 text-[#64748B] sm:px-5">
              <span className="inline-flex items-start gap-1.5"><AlertTriangle size={13} className="mt-0.5 shrink-0 text-[#B7791F]" aria-hidden="true" />Selection, approval, and sanction actions are recorded locally for demonstration. Final authority remains with the designated official.</span>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}
