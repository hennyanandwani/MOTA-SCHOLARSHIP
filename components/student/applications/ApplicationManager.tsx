'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  fetchStudentApplications,
  type StudentApplicationRecord,
} from '@/lib/studentApplicationsApi';

type SortOption = 'Recently Updated' | 'Recently Submitted' | 'Oldest First';
type StatusFilter =
  | 'All'
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Manual Review'
  | 'Recommended for approval'
  | 'Approved'
  | 'Rejected'
  | 'Document Action Required';
type TypeFilter = 'All' | 'Scholarship' | 'Fellowship';

const statusOptions: StatusFilter[] = [
  'All',
  'Draft',
  'Submitted',
  'Under Review',
  'Manual Review',
  'Recommended for approval',
  'Approved',
  'Rejected',
  'Document Action Required',
];

const selectClassName =
  'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';
const buttonClassName =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 ring-slate-200',
  SUBMITTED: 'bg-blue-50 text-[#1D5796] ring-blue-200',
  PENDING_VERIFICATION: 'bg-blue-50 text-[#1D5796] ring-blue-200',
  FLAGGED_FOR_MANUAL_REVIEW: 'bg-amber-50 text-[#94600D] ring-amber-200',
  RECOMMENDED_FOR_APPROVAL: 'bg-sky-50 text-sky-700 ring-sky-200',
  APPROVED_BY_OFFICER: 'bg-emerald-50 text-[#126747] ring-emerald-200',
  REJECTED_BY_OFFICER: 'bg-rose-50 text-[#A8323D] ring-rose-200',
};

const statusIcons: Record<string, LucideIcon> = {
  DRAFT: CircleDashed,
  SUBMITTED: FileText,
  PENDING_VERIFICATION: Clock3,
  FLAGGED_FOR_MANUAL_REVIEW: AlertCircle,
  RECOMMENDED_FOR_APPROVAL: Clock3,
  APPROVED_BY_OFFICER: CheckCircle2,
  REJECTED_BY_OFFICER: AlertCircle,
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_VERIFICATION: 'Under Review',
  FLAGGED_FOR_MANUAL_REVIEW: 'Manual Review',
  RECOMMENDED_FOR_APPROVAL: 'Recommended for approval',
  APPROVED_BY_OFFICER: 'Approved',
  REJECTED_BY_OFFICER: 'Rejected',
};

function hasDocumentAction(application: StudentApplicationRecord): boolean {
  return application.documents.some(
    (document) =>
      document.verificationStatus === 'FLAGGED' ||
      document.verificationStatus === 'REJECTED',
  );
}

function StatusBadge({ status }: { status: string }) {
  const Icon = statusIcons[status] ?? FileText;
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[status] ?? 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
      <Icon size={13} aria-hidden="true" />
      {statusLabels[status] ?? status}
    </span>
  );
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function stageFor(status: string): string {
  switch (status) {
    case 'DRAFT': return 'Draft in progress';
    case 'SUBMITTED': return 'Awaiting verification';
    case 'PENDING_VERIFICATION': return 'Verification in progress';
    case 'FLAGGED_FOR_MANUAL_REVIEW': return 'Manual review';
    case 'RECOMMENDED_FOR_APPROVAL': return 'Awaiting officer decision';
    case 'APPROVED_BY_OFFICER': return 'Approved';
    case 'REJECTED_BY_OFFICER': return 'Rejected';
    default: return 'Status unavailable';
  }
}

function actionHref(application: StudentApplicationRecord): string {
  const schemeId = encodeURIComponent(application.schemeId);
  return application.status === 'DRAFT'
    ? `/student/schemes/${schemeId}/apply`
    : `/student/schemes/${schemeId}/apply/review`;
}

function ApplicationAction({ application }: { application: StudentApplicationRecord }) {
  const label = application.status === 'DRAFT'
    ? 'Continue application'
    : hasDocumentAction(application)
      ? 'Review documents'
      : 'View application';
  const href = hasDocumentAction(application)
    ? `/student/schemes/${encodeURIComponent(application.schemeId)}/apply/documents`
    : actionHref(application);

  return (
    <Link
      href={href}
      aria-label={`${label}: ${application.schemeName}`}
      className="inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] transition hover:border-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2"
    >
      {label}<ArrowRight size={13} aria-hidden="true" />
    </Link>
  );
}

function ApplicationCard({ application }: { application: StudentApplicationRecord }) {
  const flaggedDocuments = application.documents.filter(
    (document) =>
      document.verificationStatus === 'FLAGGED' ||
      document.verificationStatus === 'REJECTED',
  );
  return (
    <article id={`application-${application.id}`} className="min-w-0 space-y-4 p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[#DCE3EC] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
              {application.schemeType === 'FELLOWSHIP' ? 'Fellowship' : 'Scholarship'}
            </span>
            <span className="text-[11px] text-[#64748B]">Academic year {application.academicYear}</span>
          </div>
          <h3 className="mt-2 break-words text-sm font-semibold leading-5 text-[#172033]">{application.schemeName}</h3>
          <p className="mt-1 break-all text-xs text-[#64748B]">{application.applicationNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {flaggedDocuments.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-[#94600D] ring-1 ring-inset ring-amber-200">
              <AlertCircle size={13} aria-hidden="true" />Document action required
            </span>
          )}
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
        <div>
          <p className="text-[#64748B]">Submitted</p>
          <p className="mt-1 font-medium text-[#172033]">{formatDate(application.submittedAt)}</p>
        </div>
        <div>
          <p className="text-[#64748B]">Last updated</p>
          <p className="mt-1 font-medium text-[#172033]">{formatDate(application.updatedAt)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[#64748B]">Current status</p>
          <p className="mt-1 break-words font-medium text-[#172033]">{stageFor(application.status)}</p>
        </div>
      </div>

      {flaggedDocuments.length > 0 && (
        <ul className="rounded-lg border border-amber-200 bg-[#FFFBEB] px-3 py-2 text-xs text-[#765719]">
          {flaggedDocuments.map((document) => (
            <li key={document.id}>
              {document.type.replaceAll('_', ' ')}: {document.verificationRemarks || document.verificationStatus}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 border-t border-[#EEF1F5] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-[#64748B]">Last activity: {formatDate(application.updatedAt)}</p>
        <ApplicationAction application={application} />
      </div>
    </article>
  );
}

export function ApplicationManager() {
  const [allApplications, setAllApplications] = useState<StudentApplicationRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [schemeType, setSchemeType] = useState<TypeFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('Recently Updated');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    fetchStudentApplications()
      .then((records) => {
        if (active) setAllApplications(records);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error
            ? error.message
            : 'Unable to load your applications. Please try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const applications = useMemo(() => allApplications
    .filter((application) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query ||
        application.schemeName.toLowerCase().includes(query) ||
        application.applicationNumber.toLowerCase().includes(query);
      const label = statusLabels[application.status] ?? application.status;
      const matchesStatus = status === 'All' ||
        (status === 'Document Action Required'
          ? hasDocumentAction(application)
          : label === status);
      const type = application.schemeType === 'FELLOWSHIP' ? 'Fellowship' : 'Scholarship';
      return matchesSearch && matchesStatus && (schemeType === 'All' || type === schemeType);
    })
    .sort((first, second) => {
      if (sortBy === 'Recently Submitted') {
        return (second.submittedAt ?? '').localeCompare(first.submittedAt ?? '');
      }
      if (sortBy === 'Oldest First') {
        return (first.submittedAt ?? first.createdAt).localeCompare(second.submittedAt ?? second.createdAt);
      }
      return second.updatedAt.localeCompare(first.updatedAt);
    }), [allApplications, search, status, schemeType, sortBy]);

  const actionRequiredCount = allApplications.filter(hasDocumentAction).length;
  const completedCount = allApplications.filter((application) =>
    application.status === 'APPROVED_BY_OFFICER' ||
    application.status === 'REJECTED_BY_OFFICER',
  ).length;
  const inProgressCount = allApplications.filter((application) =>
    application.status !== 'DRAFT' &&
    application.status !== 'APPROVED_BY_OFFICER' &&
    application.status !== 'REJECTED_BY_OFFICER',
  ).length;

  function clearFilters() {
    setSearch('');
    setStatus('All');
    setSchemeType('All');
    setSortBy('Recently Updated');
  }

  return (
    <div className="space-y-5">
      <section className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-[#172033]">My Applications</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">
            Track your scholarship and fellowship applications from submission to final decision.
          </p>
        </div>
        <Link href="/student/all-schemes" className={`${buttonClassName} w-full shrink-0 sm:w-auto`}>
          <Plus size={17} aria-hidden="true" />New Application
        </Link>
      </section>

      {loading ? (
        <section role="status" className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Loading applications">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-[#DCE3EC] bg-white" />)}
        </section>
      ) : loadError ? (
        <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <h2 className="text-sm font-semibold text-[#A8323D]">Applications could not be loaded</h2>
          <p className="mt-1 text-sm text-[#7F2931]">{loadError}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 text-xs font-semibold text-[#A8323D]">
            <RotateCcw size={14} aria-hidden="true" />Try again
          </button>
        </section>
      ) : (
        <>
          <section aria-label="Application summary" className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard label="Total Applications" value={allApplications.length} detail="Saved to your account" Icon={FileText} iconClass="bg-blue-50 text-[#2563A8]" />
            <SummaryCard label="In Progress" value={inProgressCount} detail="Submitted or awaiting a decision" Icon={Clock3} iconClass="bg-sky-50 text-sky-700" />
            <SummaryCard label="Action Required" value={actionRequiredCount} detail="Documents flagged or rejected" Icon={AlertCircle} iconClass="bg-amber-50 text-[#B7791F]" />
            <SummaryCard label="Completed" value={completedCount} detail="Officer decision recorded" Icon={CheckCircle2} iconClass="bg-emerald-50 text-[#16805B]" />
          </section>

          {actionRequiredCount > 0 && (
            <section id="action-required" aria-labelledby="action-required-title" className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#E9D5A5] bg-[#FFFBEB] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[#94600D]"><AlertCircle size={19} aria-hidden="true" /></span>
                <div className="min-w-0">
                  <h2 id="action-required-title" className="text-sm font-bold text-[#573B0A]">Action required</h2>
                  <p className="mt-1 text-xs leading-5 text-[#765719]">{actionRequiredCount} application{actionRequiredCount === 1 ? '' : 's'} contain a flagged or rejected document.</p>
                </div>
              </div>
              <button type="button" onClick={() => setStatus('Document Action Required')} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#C9A34E] bg-white px-4 text-sm font-semibold text-[#684B10]">
                Review documents<ArrowRight size={15} aria-hidden="true" />
              </button>
            </section>
          )}

          <section aria-label="Search and filter applications" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.6fr)_repeat(3,minmax(140px,1fr))]">
              <div className="min-w-0 sm:col-span-2 xl:col-span-1">
                <label htmlFor="application-search" className="text-xs font-medium text-[#475569]">Search applications</label>
                <div className="relative mt-1.5">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
                  <input id="application-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by scheme name or application ID..." className="h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white pl-9 pr-3 text-sm text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>
              <FilterSelect id="application-status" label="Status" value={status} onChange={(value) => setStatus(value as StatusFilter)} options={statusOptions} />
              <FilterSelect id="application-type" label="Scheme Type" value={schemeType} onChange={(value) => setSchemeType(value as TypeFilter)} options={['All', 'Scholarship', 'Fellowship']} />
              <FilterSelect id="application-sort" label="Sort" value={sortBy} onChange={(value) => setSortBy(value as SortOption)} options={['Recently Updated', 'Recently Submitted', 'Oldest First']} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1F5] pt-3">
              <p className="inline-flex items-center gap-1.5 text-xs text-[#64748B]"><ArrowDownWideNarrow size={14} aria-hidden="true" />Sorted by {sortBy.toLowerCase()}</p>
              <button type="button" onClick={clearFilters} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-[#2563A8] transition hover:bg-blue-50"><RotateCcw size={14} aria-hidden="true" />Clear filters</button>
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]" aria-label="Application results">
            {applications.length > 0 ? (
              <>
                <div className="hidden 2xl:block overflow-x-auto">
                  <table className="w-full min-w-[980px] table-fixed text-left">
                    <colgroup>
                      <col className="w-[22%]" /><col className="w-[17%]" /><col className="w-[12%]" />
                      <col className="w-[12%]" /><col className="w-[17%]" /><col className="w-[12%]" /><col className="w-[8%]" />
                    </colgroup>
                    <thead className="bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                      <tr>
                        <th scope="col" className="px-4 py-3">Scheme</th>
                        <th scope="col" className="px-3 py-3">Application reference</th>
                        <th scope="col" className="px-3 py-3">Submitted</th>
                        <th scope="col" className="px-3 py-3">Last updated</th>
                        <th scope="col" className="px-3 py-3">Current status</th>
                        <th scope="col" className="px-3 py-3">Status</th>
                        <th scope="col" className="px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF1F5]">
                      {applications.map((application) => (
                        <tr id={`application-${application.id}`} key={application.id} className="align-top text-xs text-[#475569]">
                          <td className="break-words px-4 py-4">
                            <p className="font-semibold leading-5 text-[#172033]">{application.schemeName}</p>
                            <p className="mt-1 text-[10px] text-[#64748B]">{application.schemeType === 'FELLOWSHIP' ? 'Fellowship' : 'Scholarship'} · {application.academicYear}</p>
                          </td>
                          <td className="break-all px-3 py-4 text-[11px]">{application.applicationNumber}</td>
                          <td className="px-3 py-4 whitespace-nowrap">{formatDate(application.submittedAt)}</td>
                          <td className="px-3 py-4 whitespace-nowrap">{formatDate(application.updatedAt)}</td>
                          <td className="break-words px-3 py-4">{stageFor(application.status)}</td>
                          <td className="px-3 py-4"><StatusBadge status={application.status} /></td>
                          <td className="px-3 py-4"><ApplicationAction application={application} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-[#EEF1F5] 2xl:hidden">
                  {applications.map((application) => <ApplicationCard key={application.id} application={application} />)}
                </div>
                <div className="flex flex-col gap-2 border-t border-[#DCE3EC] bg-[#F8FAFC] px-4 py-3 text-xs text-[#64748B] sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p>Showing {applications.length} of {allApplications.length} applications</p>
                  <p>All matching applications are shown</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563A8]"><Search size={21} aria-hidden="true" /></span>
                <h2 className="mt-4 text-base font-semibold text-[#172033]">{allApplications.length === 0 ? 'No applications yet' : 'No applications found'}</h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-[#64748B]">
                  {allApplications.length === 0
                    ? 'Applications you save or submit will appear here.'
                    : 'Try changing your search or filters, or explore available schemes to start a new application.'}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {allApplications.length > 0 && <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-4 text-sm font-semibold text-[#173F7A]">Clear filters</button>}
                  <Link href="/student/all-schemes" className={buttonClassName}>Explore Schemes</Link>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  Icon,
  iconClass,
}: {
  label: string;
  value: number;
  detail: string;
  Icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium leading-4 text-[#64748B] sm:text-sm">{label}</p>
          <p className="mt-2 text-2xl font-bold leading-none text-[#172033]">{value.toString().padStart(2, '0')}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${iconClass}`}><Icon size={18} aria-hidden="true" /></span>
      </div>
      <p className="mt-3 text-[11px] leading-4 text-[#64748B]">{detail}</p>
    </article>
  );
}

function FilterSelect<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: T;
  onChange: (value: string) => void;
  options: readonly T[];
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-xs font-medium text-[#475569]">{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={selectClassName}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}
