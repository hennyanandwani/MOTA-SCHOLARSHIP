'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Eye,
  FileQuestion,
  Flag,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { AdminApplicationRecord } from '@/lib/adminData';
import {
  createInitialScreeningCases,
  isStoredScreeningState,
  mergeScreeningState,
  SCREENING_STORAGE_KEY,
  toStoredScreeningState,
  type CriterionResult,
  type EligibilityCriterion,
  type OfficialReviewStatus,
  type ScreeningActivity,
  type ScreeningCase,
  type ScreeningStatus,
} from '@/lib/adminScreeningData';

type ScreeningPageClientProps = {
  applications: AdminApplicationRecord[];
};

type ScreeningAction =
  | 'Mark Reviewed'
  | 'Request Clarification'
  | 'Flag for Exception Review'
  | 'Refer for Verification';

const screeningStatuses: ScreeningStatus[] = [
  'Preliminary Match',
  'Criteria Not Met',
  'Missing Information',
  'Borderline / Exception',
  'Pending Official Review',
  'Reviewed',
];

const criterionResultStyles: Record<CriterionResult, string> = {
  Matched: 'border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]',
  Failed: 'border-[#F0C7CA] bg-[#FDF0F0] text-[#A52C37]',
  Missing: 'border-[#F1D7A8] bg-[#FFF8E8] text-[#8A5B12]',
  'Needs Review': 'border-[#F1D7A8] bg-[#FFF8E8] text-[#8A5B12]',
};

const screeningStatusStyles: Record<ScreeningStatus, string> = {
  'Preliminary Match': 'border-[#B6E3D0] bg-[#EAF7F1] text-[#126044]',
  'Criteria Not Met': 'border-[#F0C7CA] bg-[#FDF0F0] text-[#A52C37]',
  'Missing Information': 'border-[#F1D7A8] bg-[#FFF8E8] text-[#8A5B12]',
  'Borderline / Exception': 'border-[#F1D7A8] bg-[#FFF8E8] text-[#8A5B12]',
  'Pending Official Review': 'border-[#C7D9EF] bg-[#EEF5FC] text-[#173F7A]',
  Reviewed: 'border-[#C7D9EF] bg-[#F1F5F9] text-[#334155]',
};

const priorityStyles = {
  High: 'bg-[#FDF0F0] text-[#A52C37]',
  Medium: 'bg-[#FFF8E8] text-[#8A5B12]',
  Low: 'bg-[#EAF7F1] text-[#126044]',
} as const;

function resultIcon(result: CriterionResult) {
  if (result === 'Matched') return <CheckCircle2 size={14} aria-hidden="true" />;
  if (result === 'Failed') return <X size={14} aria-hidden="true" />;
  if (result === 'Missing') return <FileQuestion size={14} aria-hidden="true" />;
  return <AlertTriangle size={14} aria-hidden="true" />;
}

function resultCounts(criteria: EligibilityCriterion[]) {
  return criteria.reduce(
    (counts, criterion) => {
      if (criterion.result === 'Matched') counts.matched += 1;
      if (criterion.result === 'Failed') counts.failed += 1;
      if (criterion.result === 'Missing') counts.missing += 1;
      if (criterion.result === 'Needs Review') counts.needsReview += 1;
      return counts;
    },
    { matched: 0, failed: 0, missing: 0, needsReview: 0 },
  );
}

function statusBadge(status: ScreeningStatus) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-md border px-2 py-1 text-[10px] font-semibold leading-4 ${screeningStatusStyles[status]}`}>
      {status}
    </span>
  );
}

function resultBadge(result: CriterionResult) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${criterionResultStyles[result]}`}>
      {resultIcon(result)}
      {result}
    </span>
  );
}

function activityTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? timestamp
    : new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

function SelectFilter({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative min-w-0">
      <span className="sr-only">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-[#DCE3EC] bg-white px-3 pr-8 text-xs font-medium text-[#334155] outline-none transition focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-[#64748B]" aria-hidden="true" />
    </label>
  );
}

export function ScreeningPageClient({ applications }: ScreeningPageClientProps) {
  const initialCases = useMemo(() => createInitialScreeningCases(applications), [applications]);
  const [cases, setCases] = useState<ScreeningCase[]>(initialCases);
  const [query, setQuery] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [formError, setFormError] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SCREENING_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (!isStoredScreeningState(parsed)) {
          setStorageMessage('Saved screening state could not be read. Illustrative default records are shown.');
        } else {
          setCases(mergeScreeningState(initialCases, parsed));
        }
      }
    } catch {
      setStorageMessage('Saved screening state is unavailable. Changes may not persist in this browser.');
    } finally {
      setHasLoadedStorage(true);
    }
  }, [initialCases]);

  useEffect(() => {
    if (!selectedId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeInspector();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId]);

  function commitCases(nextCases: ScreeningCase[]) {
    setCases(nextCases);
    if (!hasLoadedStorage) return;
    try {
      window.localStorage.setItem(
        SCREENING_STORAGE_KEY,
        JSON.stringify(toStoredScreeningState(nextCases)),
      );
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

  const schemeOptions = useMemo(() => {
    const schemes = new Map<string, string>();
    cases.forEach(({ application }) => schemes.set(application.schemeId, application.schemeName));
    return [...schemes.entries()].sort((first, second) => first[1].localeCompare(second[1]));
  }, [cases]);
  const stateOptions = useMemo(
    () => [...new Set(cases.map(({ application }) => application.state))].sort(),
    [cases],
  );

  const filteredCases = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = cases.filter((screeningCase) => {
      const { application, criteria, screeningStatus, priority } = screeningCase;
      if (
        search &&
        !application.applicationId.toLowerCase().includes(search) &&
        !application.applicantName.toLowerCase().includes(search)
      ) return false;
      if (schemeFilter !== 'all' && application.schemeId !== schemeFilter) return false;
      if (statusFilter !== 'all' && screeningStatus !== statusFilter) return false;
      if (priorityFilter !== 'all' && priority !== priorityFilter) return false;
      if (stateFilter !== 'all' && application.state !== stateFilter) return false;
      if (resultFilter !== 'all' && !criteria.some((criterion) => criterion.result === resultFilter)) return false;
      return true;
    });

    return filtered.sort((first, second) => {
      if (sortBy === 'priority') {
        const order = { High: 0, Medium: 1, Low: 2 };
        return order[first.priority] - order[second.priority];
      }
      if (sortBy === 'oldest') {
        return first.application.submittedDate.localeCompare(second.application.submittedDate);
      }
      if (sortBy === 'applicant') {
        return first.application.applicantName.localeCompare(second.application.applicantName);
      }
      return second.application.submittedDate.localeCompare(first.application.submittedDate);
    });
  }, [cases, priorityFilter, query, resultFilter, schemeFilter, sortBy, stateFilter, statusFilter]);

  const selectedCase = selectedId
    ? cases.find(({ application }) => application.applicationId === selectedId) ?? null
    : null;
  const metrics = useMemo(() => ({
    total: cases.length,
    pending: cases.filter(({ officialReviewStatus }) => officialReviewStatus === 'Pending').length,
    matched: cases.reduce(
      (total, screeningCase) => total + resultCounts(screeningCase.criteria).matched,
      0,
    ),
    exceptions: cases.filter(({ screeningStatus }) => screeningStatus === 'Borderline / Exception').length,
    missing: cases.filter(({ criteria }) => criteria.some(({ result }) => result === 'Missing')).length,
  }), [cases]);

  function selectCase(screeningCase: ScreeningCase) {
    setSelectedId(screeningCase.application.applicationId);
    setReviewNote('');
    setFormError('');
  }

  function updateReview(action: ScreeningAction) {
    if (!selectedCase) return;
    const note = reviewNote.trim();
    if (!note) {
      setFormError('Add a review note before recording this action.');
      return;
    }

    const timestamp = new Date().toISOString();
    const noteEntry = {
      id: `${selectedCase.application.applicationId}-note-${Date.now()}`,
      timestamp,
      author: 'MoTA Administrator',
      note,
      action,
    };
    const activity: ScreeningActivity = {
      id: `${selectedCase.application.applicationId}-activity-${Date.now()}`,
      timestamp,
      action: action === 'Mark Reviewed' ? 'Review completed' : action,
      details: note,
      actor: 'MoTA Administrator',
      isDemo: false,
    };

    const actionUpdates: Record<ScreeningAction, { screeningStatus: ScreeningStatus; officialReviewStatus: OfficialReviewStatus }> = {
      'Mark Reviewed': { screeningStatus: 'Reviewed', officialReviewStatus: 'Reviewed' },
      'Request Clarification': { screeningStatus: selectedCase.screeningStatus, officialReviewStatus: 'Clarification Requested' },
      'Flag for Exception Review': { screeningStatus: 'Borderline / Exception', officialReviewStatus: 'Exception Review' },
      'Refer for Verification': { screeningStatus: 'Pending Official Review', officialReviewStatus: 'Referred for Verification' },
    };
    const updates = actionUpdates[action];
    const clarification = action === 'Request Clarification'
      ? [{
          id: `${selectedCase.application.applicationId}-clarification-${Date.now()}`,
          timestamp,
          note,
          requestedBy: 'MoTA Administrator',
        }]
      : [];

    const updatedCase: ScreeningCase = {
      ...selectedCase,
      ...updates,
      reviewNotes: [...selectedCase.reviewNotes, noteEntry],
      clarificationRequests: [...selectedCase.clarificationRequests, ...clarification],
      activities: [...selectedCase.activities, activity],
      updatedAt: timestamp,
    };
    commitCases(cases.map((screeningCase) =>
      screeningCase.application.applicationId === selectedId ? updatedCase : screeningCase,
    ));
    setReviewNote('');
    setFormError('');
  }

  function toggleFlag() {
    if (!selectedCase) return;
    const timestamp = new Date().toISOString();
    const flagged = !selectedCase.isFlagged;
    const updatedCase: ScreeningCase = {
      ...selectedCase,
      isFlagged: flagged,
      updatedAt: timestamp,
      activities: [
        ...selectedCase.activities,
        {
          id: `${selectedCase.application.applicationId}-flag-${Date.now()}`,
          timestamp,
          action: flagged ? 'Case flagged for follow-up' : 'Follow-up flag removed',
          details: flagged
            ? 'An official marked this case for follow-up; no eligibility decision was made.'
            : 'An official removed the follow-up flag.',
          actor: 'MoTA Administrator',
          isDemo: false,
        },
      ],
    };
    commitCases(cases.map((screeningCase) =>
      screeningCase.application.applicationId === selectedId ? updatedCase : screeningCase,
    ));
  }

  function clearFilters() {
    setQuery('');
    setSchemeFilter('all');
    setStatusFilter('all');
    setResultFilter('all');
    setPriorityFilter('all');
    setStateFilter('all');
    setSortBy('priority');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 text-xs text-[#64748B]">
            <span>Administration</span><span className="px-2">/</span><span aria-current="page" className="font-medium text-[#172033]">Eligibility &amp; Scrutiny</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Eligibility &amp; Scrutiny</h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-[#64748B]">
            Review applications against scheme eligibility criteria and identify cases requiring official scrutiny.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[#E4C98F] bg-[#FFF8E8] px-2.5 py-1.5 text-[10px] font-bold tracking-[0.08em] text-[#79520F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B7791F]" aria-hidden="true" />
          DEMO DATA
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total Applications', value: metrics.total, icon: ClipboardCheck, tone: 'text-[#173F7A]' },
          { label: 'Pending Screening', value: metrics.pending, icon: Clock3, tone: 'text-[#B7791F]' },
          { label: 'Matched Criteria', value: metrics.matched, icon: CheckCircle2, tone: 'text-[#16805B]' },
          { label: 'Borderline / Exception Cases', value: metrics.exceptions, icon: AlertTriangle, tone: 'text-[#B7791F]' },
          { label: 'Missing Criteria', value: metrics.missing, icon: FileQuestion, tone: 'text-[#C2414B]' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <section key={label} className="min-w-0 border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium leading-4 text-[#64748B]">{label}</p>
              <Icon size={17} className={`shrink-0 ${tone}`} aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#172033]">{value.toLocaleString('en-IN')}</p>
          </section>
        ))}
      </div>

      <section className="border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]" aria-label="Screening queue filters">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <label className="relative sm:col-span-2 xl:col-span-2">
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
          <SelectFilter id="scheme-filter" label="Filter by scheme" value={schemeFilter} onChange={setSchemeFilter}>
            <option value="all">All schemes</option>
            {schemeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </SelectFilter>
          <SelectFilter id="status-filter" label="Filter by screening status" value={statusFilter} onChange={setStatusFilter}>
            <option value="all">All screening statuses</option>
            {screeningStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </SelectFilter>
          <SelectFilter id="result-filter" label="Filter by eligibility result" value={resultFilter} onChange={setResultFilter}>
            <option value="all">All eligibility results</option>
            {(['Matched', 'Failed', 'Missing', 'Needs Review'] as CriterionResult[]).map((result) => (
              <option key={result} value={result}>{result}</option>
            ))}
          </SelectFilter>
          <SelectFilter id="priority-filter" label="Filter by priority" value={priorityFilter} onChange={setPriorityFilter}>
            <option value="all">All priorities</option>
            <option value="High">High priority</option>
            <option value="Medium">Medium priority</option>
            <option value="Low">Low priority</option>
          </SelectFilter>
          <SelectFilter id="state-filter" label="Filter by state or location" value={stateFilter} onChange={setStateFilter}>
            <option value="all">All locations</option>
            {stateOptions.map((state) => <option key={state} value={state}>{state}</option>)}
          </SelectFilter>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[#64748B]">Showing <strong className="font-semibold text-[#172033]">{filteredCases.length}</strong> of {cases.length} applications</p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-screening" className="text-[11px] font-medium text-[#64748B]">Sort by</label>
            <select
              id="sort-screening"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-9 rounded-lg border border-[#DCE3EC] bg-white px-2.5 text-xs text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
            >
              <option value="priority">Priority: High to Low</option>
              <option value="newest">Submitted: Newest</option>
              <option value="oldest">Submitted: Oldest</option>
              <option value="applicant">Applicant: A to Z</option>
            </select>
            <button type="button" onClick={clearFilters} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#2563A8]">
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {storageMessage && (
        <p role="status" className="border border-[#E4C98F] bg-[#FFF8E8] px-4 py-2.5 text-xs text-[#79520F]">
          {storageMessage}
        </p>
      )}

      <div className="flex items-start gap-2 border border-[#C7D9EF] bg-[#EEF5FC] px-4 py-3 text-xs leading-5 text-[#334155]">
        <Info size={16} className="mt-0.5 shrink-0 text-[#173F7A]" aria-hidden="true" />
        <p><strong className="font-semibold text-[#173F7A]">AI-assisted assessment.</strong> Screening criteria and profile values shown here are illustrative demo data. A preliminary match is not an approval. Final eligibility is determined through official verification.</p>
      </div>

      {filteredCases.length === 0 ? (
        <div className="flex flex-col items-center border border-[#DCE3EC] bg-white px-6 py-12 text-center">
          <Search size={25} className="text-[#64748B]" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold text-[#172033]">No screening cases found</h2>
          <p className="mt-1 text-xs text-[#64748B]">Try changing your search or filters.</p>
          <button type="button" onClick={clearFilters} className="mt-3 rounded-lg bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)] xl:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1370px] text-left text-xs text-[#172033]" aria-label="Eligibility and scrutiny screening queue">
                <thead className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th scope="col" className="px-3 py-3">Priority</th>
                    <th scope="col" className="px-3 py-3">Application ID</th>
                    <th scope="col" className="px-3 py-3">Applicant</th>
                    <th scope="col" className="px-3 py-3">Scheme</th>
                    <th scope="col" className="px-3 py-3">Location</th>
                    <th scope="col" className="px-3 py-3">Criteria Checked</th>
                    <th scope="col" className="px-3 py-3">Matched</th>
                    <th scope="col" className="px-3 py-3">Failed</th>
                    <th scope="col" className="px-3 py-3">Missing</th>
                    <th scope="col" className="px-3 py-3">Screening Status</th>
                    <th scope="col" className="px-3 py-3">Official Review</th>
                    <th scope="col" className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F5]">
                  {filteredCases.map((screeningCase) => {
                    const app = screeningCase.application;
                    const counts = resultCounts(screeningCase.criteria);
                    return (
                      <tr key={app.applicationId} className="hover:bg-[#F8FAFC]/70">
                        <td className="px-3 py-3.5">
                          <span className={`rounded px-2 py-1 text-[10px] font-semibold ${priorityStyles[screeningCase.priority]}`}>{screeningCase.priority}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 font-mono font-semibold text-[#173F7A]">{app.applicationId}</td>
                        <td className="px-3 py-3.5">
                          <p className="font-semibold">{app.applicantName}</p>
                          <p className="mt-0.5 text-[10px] text-[#64748B]">{app.category} · {app.academicLevel ?? app.course}</p>
                        </td>
                        <td className="max-w-[190px] px-3 py-3.5">
                          <span className="line-clamp-2 text-[11px]" title={app.schemeName}>{app.schemeName}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-[11px]">{app.district}, {app.state}</td>
                        <td className="px-3 py-3.5">{screeningCase.criteria.length}</td>
                        <td className="px-3 py-3.5 font-semibold text-[#16805B]">{counts.matched}</td>
                        <td className="px-3 py-3.5 font-semibold text-[#C2414B]">{counts.failed}</td>
                        <td className="px-3 py-3.5 font-semibold text-[#B7791F]">{counts.missing}</td>
                        <td className="max-w-[170px] px-3 py-3.5">{statusBadge(screeningCase.screeningStatus)}</td>
                        <td className="max-w-[155px] px-3 py-3.5 text-[10px] text-[#64748B]">{screeningCase.officialReviewStatus}</td>
                        <td className="px-3 py-3.5 text-right">
                          <button type="button" onClick={() => selectCase(screeningCase)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#DCE3EC] px-2.5 text-xs font-semibold text-[#173F7A] hover:bg-[#173F7A] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#2563A8]" aria-label={`Review screening for ${app.applicationId}, ${app.applicantName}`}>
                            <Eye size={14} aria-hidden="true" />Review Case
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="hidden overflow-hidden border border-[#DCE3EC] bg-white md:block xl:hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs text-[#172033]" aria-label="Condensed eligibility and scrutiny screening queue">
                <thead className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th scope="col" className="px-3 py-3">Application / Applicant</th>
                    <th scope="col" className="px-3 py-3">Scheme &amp; Location</th>
                    <th scope="col" className="px-3 py-3">Criteria</th>
                    <th scope="col" className="px-3 py-3">Status</th>
                    <th scope="col" className="px-3 py-3">Official Review</th>
                    <th scope="col" className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF1F5]">
                  {filteredCases.map((screeningCase) => (
                    <tr key={screeningCase.application.applicationId} className="hover:bg-[#F8FAFC]/70">
                      <td className="px-3 py-3">
                        <p className="font-mono font-semibold text-[#173F7A]">{screeningCase.application.applicationId}</p>
                        <p className="mt-1 font-semibold">{screeningCase.application.applicantName}</p>
                        <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${priorityStyles[screeningCase.priority]}`}>{screeningCase.priority} priority</span>
                      </td>
                      <td className="max-w-[210px] px-3 py-3">
                        <p className="line-clamp-2 font-medium">{screeningCase.application.schemeName}</p>
                        <p className="mt-1 text-[10px] text-[#64748B]">{screeningCase.application.district}, {screeningCase.application.state}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{screeningCase.criteria.length} checked</p>
                        <p className="mt-1 text-[10px] text-[#64748B]">{resultCounts(screeningCase.criteria).matched} matched · {resultCounts(screeningCase.criteria).failed} failed · {resultCounts(screeningCase.criteria).missing} missing</p>
                      </td>
                      <td className="max-w-[160px] px-3 py-3">{statusBadge(screeningCase.screeningStatus)}</td>
                      <td className="px-3 py-3 text-[10px] text-[#64748B]">{screeningCase.officialReviewStatus}</td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" onClick={() => selectCase(screeningCase)} className="min-h-9 rounded-md border border-[#DCE3EC] px-2.5 text-xs font-semibold text-[#173F7A] focus:outline-none focus:ring-2 focus:ring-[#2563A8]" aria-label={`Review screening for ${screeningCase.application.applicationId}, ${screeningCase.application.applicantName}`}>Review Case</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredCases.map((screeningCase) => {
              const app = screeningCase.application;
              const counts = resultCounts(screeningCase.criteria);
              return (
                <article key={app.applicationId} className="border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all font-mono text-xs font-semibold text-[#173F7A]">{app.applicationId}</p>
                      <h2 className="mt-1 text-sm font-semibold text-[#172033]">{app.applicantName}</h2>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold ${priorityStyles[screeningCase.priority]}`}>{screeningCase.priority}</span>
                  </div>
                  <p className="mt-2 text-xs text-[#334155]">{app.schemeName}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[#64748B]"><MapPin size={13} aria-hidden="true" />{app.district}, {app.state}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {statusBadge(screeningCase.screeningStatus)}
                    <span className="text-[10px] text-[#64748B]">{counts.matched} matched · {counts.failed} failed · {counts.missing} missing</span>
                  </div>
                  <button type="button" onClick={() => selectCase(screeningCase)} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2" aria-label={`Review screening for ${app.applicationId}, ${app.applicantName}`}>
                    <Eye size={15} aria-hidden="true" />Review case
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}

      <p className="border-t border-[#DCE3EC] pt-4 text-[11px] leading-5 text-[#64748B]">
        Illustrative SIH 2026 demonstration records only. AI-assisted assessment supports authorized officials; it does not approve, select, or determine final eligibility.
      </p>

      {selectedCase && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="screening-inspector-title">
          <button type="button" className="fixed inset-0 cursor-default bg-slate-900/40" onClick={closeInspector} aria-label="Close screening inspector" />
          <aside className="relative z-10 flex h-full w-full flex-col border-l border-[#DCE3EC] bg-white shadow-2xl lg:max-w-[720px]">
            <div className="flex items-start justify-between gap-3 border-b border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-all font-mono text-xs font-bold text-[#173F7A]">{selectedCase.application.applicationId}</span>
                  <span className={`rounded px-2 py-1 text-[10px] font-semibold ${priorityStyles[selectedCase.priority]}`}>{selectedCase.priority} priority</span>
                </div>
                <h2 id="screening-inspector-title" className="mt-1 truncate text-base font-bold text-[#172033]">{selectedCase.application.applicantName}</h2>
                <p className="mt-0.5 line-clamp-2 text-xs text-[#64748B]">{selectedCase.application.schemeName}</p>
              </div>
              <button type="button" onClick={closeInspector} aria-label="Close screening inspector" className="shrink-0 rounded-lg p-2 text-[#64748B] hover:bg-slate-200/70 hover:text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
              <section aria-labelledby="application-context-heading">
                <h3 id="application-context-heading" className="mb-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">Application context</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border border-[#DCE3EC] p-3 sm:grid-cols-3">
                  {[
                    ['Application ID', selectedCase.application.applicationId],
                    ['Applicant', selectedCase.application.applicantName],
                    ['Scheme', selectedCase.application.schemeName],
                    ['Academic year', selectedCase.application.academicYear],
                    ['Location', `${selectedCase.application.district}, ${selectedCase.application.state}`],
                    ['Application status', selectedCase.application.status],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-[10px] text-[#64748B]">{label}</dt>
                      <dd className="mt-0.5 break-words text-xs font-semibold text-[#172033]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section aria-labelledby="criteria-heading">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 id="criteria-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Eligibility criteria</h3>
                  <span className="text-[10px] text-[#64748B]">AI-assisted assessment · for official review</span>
                </div>
                <div className="divide-y divide-[#EEF1F5] border border-[#DCE3EC]">
                  {selectedCase.criteria.map((criterion) => (
                    <article key={criterion.id} className="space-y-2 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-[#172033]">{criterion.name}</h4>
                        {resultBadge(criterion.result)}
                      </div>
                      <dl className="grid gap-x-4 gap-y-2 text-[11px] sm:grid-cols-2">
                        <div><dt className="text-[#64748B]">Requirement</dt><dd className="mt-0.5 text-[#334155]">{criterion.requirement}</dd></div>
                        <div><dt className="text-[#64748B]">Applicant value</dt><dd className="mt-0.5 break-words font-medium text-[#172033]">{criterion.applicantValue}</dd></div>
                        <div className="sm:col-span-2"><dt className="text-[#64748B]">Evidence / source</dt><dd className="mt-0.5 text-[#334155]">{criterion.evidence}</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
              </section>

              <section aria-labelledby="screening-result-heading" className="border border-[#DCE3EC] p-3">
                <h3 id="screening-result-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Screening result</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {statusBadge(selectedCase.screeningStatus)}
                  <span className="text-[10px] text-[#64748B]">Official review: {selectedCase.officialReviewStatus}</span>
                </div>
                {(selectedCase.screeningStatus === 'Borderline / Exception' || selectedCase.screeningStatus === 'Missing Information' || selectedCase.screeningStatus === 'Criteria Not Met') && (
                  <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#79520F]">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {selectedCase.screeningStatus === 'Criteria Not Met'
                      ? 'One or more illustrative criteria did not match. Review evidence and scheme rules; do not make an automatic decision.'
                      : selectedCase.screeningStatus === 'Missing Information'
                        ? 'Required information is absent from the demo record. Request clarification or refer the application for verification.'
                        : 'One or more criteria are borderline or require verification. An authorized official must review the evidence.'}
                  </p>
                )}
                <p className="mt-2 text-[11px] leading-5 text-[#64748B]">Final eligibility is determined through official verification.</p>
              </section>

              <section aria-labelledby="official-review-heading" className="border border-[#DCE3EC] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 id="official-review-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Official review</h3>
                  <button type="button" onClick={toggleFlag} className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563A8] ${selectedCase.isFlagged ? 'border-[#E4C98F] bg-[#FFF8E8] text-[#79520F]' : 'border-[#DCE3EC] text-[#334155] hover:bg-[#F8FAFC]'}`} aria-pressed={selectedCase.isFlagged}>
                    <Flag size={13} aria-hidden="true" />{selectedCase.isFlagged ? 'Flagged for follow-up' : 'Flag for follow-up'}
                  </button>
                </div>
                <label htmlFor="screening-review-note" className="mt-3 block text-[11px] font-semibold text-[#334155]">Review note <span className="font-normal text-[#64748B]">(required for actions)</span></label>
                <textarea
                  id="screening-review-note"
                  value={reviewNote}
                  onChange={(event) => {
                    setReviewNote(event.target.value);
                    setFormError('');
                  }}
                  rows={3}
                  maxLength={1000}
                  placeholder="Record the evidence reviewed or the reason for this action."
                  className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-[#DCE3EC] px-3 py-2 text-xs leading-5 text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-[#2563A8]/20"
                />
                <div className="mt-1 flex items-center justify-between gap-2">
                  {formError ? <p role="alert" className="text-[11px] text-[#A52C37]">{formError}</p> : <span className="text-[10px] text-[#64748B]">Saved locally in this browser.</span>}
                  <span className="ml-auto text-[10px] text-[#64748B]">{reviewNote.length}/1000</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => updateReview('Mark Reviewed')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8] focus:ring-offset-2">
                    <ShieldCheck size={15} aria-hidden="true" />Mark Reviewed
                  </button>
                  <button type="button" onClick={() => updateReview('Request Clarification')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 text-xs font-semibold text-[#173F7A] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">
                    <FileQuestion size={15} aria-hidden="true" />Request Clarification
                  </button>
                  <button type="button" onClick={() => updateReview('Flag for Exception Review')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 text-xs font-semibold text-[#79520F] hover:bg-[#FFF8E8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">
                    <Flag size={15} aria-hidden="true" />Flag for Exception Review
                  </button>
                  <button type="button" onClick={() => updateReview('Refer for Verification')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563A8]">
                    <ClipboardCheck size={15} aria-hidden="true" />Refer for Verification
                  </button>
                </div>
              </section>

              {selectedCase.clarificationRequests.length > 0 && (
                <section aria-labelledby="clarification-heading" className="border border-[#E4C98F] bg-[#FFF8E8] p-3">
                  <h3 id="clarification-heading" className="text-xs font-bold text-[#79520F]">Clarification requests ({selectedCase.clarificationRequests.length})</h3>
                  <ul className="mt-2 space-y-2">
                    {selectedCase.clarificationRequests.map((request) => (
                      <li key={request.id} className="border-t border-[#E4C98F]/70 pt-2 text-[11px] leading-5 text-[#334155]">
                        <p>{request.note}</p>
                        <p className="mt-0.5 text-[10px] text-[#64748B]">{request.requestedBy} · {activityTimestamp(request.timestamp)}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {selectedCase.reviewNotes.length > 0 && (
                <section aria-labelledby="review-notes-heading" className="border border-[#DCE3EC] p-3">
                  <h3 id="review-notes-heading" className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Official review notes</h3>
                  <ul className="mt-2 space-y-3">
                    {selectedCase.reviewNotes.toReversed().map((note) => (
                      <li key={note.id} className="border-l-2 border-[#2563A8] pl-3">
                        <p className="text-xs leading-5 text-[#334155]">{note.note}</p>
                        <p className="mt-1 text-[10px] text-[#64748B]">{note.action} · {note.author} · {activityTimestamp(note.timestamp)}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section aria-labelledby="activity-history-heading">
                <h3 id="activity-history-heading" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">
                  <Clock3 size={14} aria-hidden="true" />Activity history
                </h3>
                <ol className="space-y-0 border-l border-[#DCE3EC] pl-4">
                  {[...selectedCase.activities].reverse().map((activity) => (
                    <li key={activity.id} className="relative pb-4 last:pb-0">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#2563A8] ring-1 ring-[#C7D9EF]" aria-hidden="true" />
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-[#172033]">{activity.action}</h4>
                        {activity.isDemo && <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[9px] font-semibold text-[#64748B]">DEMO</span>}
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-[#64748B]">{activity.details}</p>
                      <p className="mt-0.5 text-[10px] text-[#64748B]">{activity.actor} · {activityTimestamp(activity.timestamp)}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <div className="border-t border-[#DCE3EC] bg-[#F8FAFC] px-4 py-3 text-[10px] leading-4 text-[#64748B] sm:px-5">
              <span className="inline-flex items-start gap-1.5"><Check size={13} className="mt-0.5 shrink-0 text-[#16805B]" aria-hidden="true" />Official review actions and notes save to this browser only. No eligibility decision is made by this screening interface.</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
