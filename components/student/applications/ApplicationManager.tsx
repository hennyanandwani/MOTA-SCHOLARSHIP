'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileText,
  Filter,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  studentApplications,
  type ApplicationStatus,
  type StudentApplication,
} from '@/lib/applications';

type SortOption = 'Recently Updated' | 'Recently Submitted' | 'Oldest First';
type StatusFilter = ApplicationStatus | 'All';
type TypeFilter = StudentApplication['type'] | 'All';

const statusOptions: StatusFilter[] = [
  'All',
  'Draft',
  'Submitted',
  'Under Review',
  'Action Required',
  'Selected',
  'Not Selected',
];

const selectClassName =
  'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';
const buttonClassName =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';

const statusStyles: Record<ApplicationStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700 ring-slate-200',
  Submitted: 'bg-blue-50 text-[#1D5796] ring-blue-200',
  'Under Review': 'bg-blue-50 text-[#1D5796] ring-blue-200',
  'Action Required': 'bg-amber-50 text-[#94600D] ring-amber-200',
  Selected: 'bg-emerald-50 text-[#126747] ring-emerald-200',
  'Not Selected': 'bg-rose-50 text-[#A8323D] ring-rose-200',
};

const statusIcons: Record<ApplicationStatus, LucideIcon> = {
  Draft: CircleDashed,
  Submitted: FileText,
  'Under Review': Clock3,
  'Action Required': AlertCircle,
  Selected: CheckCircle2,
  'Not Selected': AlertCircle,
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const Icon = statusIcons[status];

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[status]}`}
    >
      <Icon size={13} aria-hidden="true" />
      {status}
    </span>
  );
}

function ApplicationProgress({ application }: { application: StudentApplication }) {
  return (
    <div className="min-w-[110px]">
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#334155]">
        <span>{application.progress}%</span>
        <span className="font-normal text-[#64748B]">{application.completedStages} of 5</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E3EAF2]"
        role="progressbar"
        aria-label={`${application.scheme} progress`}
        aria-valuenow={application.progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-[#2563A8]"
          style={{ width: `${application.progress}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] leading-4 text-[#64748B]">
        {application.completedStages} of 5 stages completed
      </p>
    </div>
  );
}

function actionFor(application: StudentApplication) {
  if (application.status === 'Action Required') return 'Fix Issue';
  if (application.status === 'Selected' || application.status === 'Not Selected') {
    return 'View Details';
  }
  return 'View Application';
}

function ApplicationAction({ application }: { application: StudentApplication }) {
  const label = actionFor(application);

  return (
    <Link
      href={`/student/applications/${application.id}`}
      aria-label={`${label}: ${application.scheme}`}
      className="inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] transition hover:border-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2"
    >
      {label}
      <ArrowRight size={13} aria-hidden="true" />
    </Link>
  );
}

function ApplicationCard({ application }: { application: StudentApplication }) {
  return (
    <article
      id={`application-${application.id}`}
      className="min-w-0 space-y-4 p-4 sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[#DCE3EC] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
              {application.type}
            </span>
            <span className="text-[11px] text-[#64748B]">Academic year {application.academicYear}</span>
          </div>
          <h3 className="mt-2 break-words text-sm font-semibold leading-5 text-[#172033]">
            {application.scheme}
          </h3>
          <p className="mt-1 break-all text-xs text-[#64748B]">{application.id}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
        <div>
          <p className="text-[#64748B]">Submitted</p>
          <p className="mt-1 font-medium text-[#172033]">{application.submitted}</p>
        </div>
        <div>
          <p className="text-[#64748B]">Last updated</p>
          <p className="mt-1 font-medium text-[#172033]">{application.updated}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[#64748B]">Current stage</p>
          <p className="mt-1 break-words font-medium text-[#172033]">{application.stage}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#EEF1F5] pt-3 sm:flex-row sm:items-end sm:justify-between">
        <ApplicationProgress application={application} />
        <ApplicationAction application={application} />
      </div>
    </article>
  );
}

export function ApplicationManager() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [schemeType, setSchemeType] = useState<TypeFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('Recently Updated');

  const applications = [...studentApplications]
    .filter((application) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        application.scheme.toLowerCase().includes(query) ||
        application.id.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (status === 'All' || application.status === status) &&
        (schemeType === 'All' || application.type === schemeType)
      );
    })
    .sort((first, second) => {
      if (sortBy === 'Recently Submitted') {
        return second.submittedDate.localeCompare(first.submittedDate);
      }
      if (sortBy === 'Oldest First') {
        return first.submittedDate.localeCompare(second.submittedDate);
      }
      return second.updatedDate.localeCompare(first.updatedDate);
    });

  const actionRequiredApplication = studentApplications.find(
    (application) => application.status === 'Action Required',
  );

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
          <Plus size={17} aria-hidden="true" />
          New Application
        </Link>
      </section>

      <section aria-label="Application summary" className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard label="Total Applications" value="5" detail="Across your schemes" Icon={FileText} iconClass="bg-blue-50 text-[#2563A8]" />
        <SummaryCard label="In Progress" value="2" detail="Currently under review" Icon={Clock3} iconClass="bg-sky-50 text-sky-700" />
        <SummaryCard label="Action Required" value="1" detail="Needs your attention" Icon={AlertCircle} iconClass="bg-amber-50 text-[#B7791F]" />
        <SummaryCard label="Completed" value="2" detail="Final decision received" Icon={CheckCircle2} iconClass="bg-emerald-50 text-[#16805B]" />
      </section>

      {actionRequiredApplication && (
        <section
          id="action-required"
          aria-labelledby="action-required-title"
          className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#E9D5A5] bg-[#FFFBEB] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[#94600D]">
              <AlertCircle size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="action-required-title" className="text-sm font-bold text-[#573B0A]">Action required</h2>
              <p className="mt-1 text-xs leading-5 text-[#765719]">
                You have 1 application that needs your attention.
              </p>
              <p className="mt-2 break-words text-sm font-semibold text-[#172033]">
                {actionRequiredApplication.scheme}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#475569]">
                Issue: {actionRequiredApplication.issue}
              </p>
            </div>
          </div>
          <Link
            href={`#application-${actionRequiredApplication.id}`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#C9A34E] bg-white px-4 text-sm font-semibold text-[#684B10] transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94600D] focus-visible:ring-offset-2"
          >
            Fix Issue <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      )}

      <section aria-label="Search and filter applications" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.6fr)_repeat(3,minmax(140px,1fr))]">
          <div className="min-w-0 sm:col-span-2 xl:col-span-1">
            <label htmlFor="application-search" className="text-xs font-medium text-[#475569]">Search applications</label>
            <div className="relative mt-1.5">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
              <input
                id="application-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by scheme name or application ID..."
                className="h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white pl-9 pr-3 text-sm text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <FilterSelect id="application-status" label="Status" value={status} onChange={(value) => setStatus(value as StatusFilter)} options={statusOptions} />
          <FilterSelect id="application-type" label="Scheme Type" value={schemeType} onChange={(value) => setSchemeType(value as TypeFilter)} options={['All', 'Scholarship', 'Fellowship']} />
          <FilterSelect id="application-sort" label="Sort" value={sortBy} onChange={(value) => setSortBy(value as SortOption)} options={['Recently Updated', 'Recently Submitted', 'Oldest First']} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1F5] pt-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-[#64748B]">
            <ArrowDownWideNarrow size={14} aria-hidden="true" />
            Sorted by {sortBy.toLowerCase()}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-[#2563A8] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Clear filters
          </button>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]" aria-label="Application results">
        {applications.length > 0 ? (
          <>
            <div className="hidden 2xl:block">
              <div className="overflow-hidden">
                <table className="w-full table-fixed text-left">
                  <colgroup>
                    <col className="w-[18%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <thead className="bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                    <tr>
                      <th scope="col" className="px-4 py-3">Scheme</th>
                      <th scope="col" className="px-3 py-3">Application ID</th>
                      <th scope="col" className="px-3 py-3">Submitted</th>
                      <th scope="col" className="px-3 py-3">Current Stage</th>
                      <th scope="col" className="px-3 py-3">Progress</th>
                      <th scope="col" className="px-3 py-3">Status</th>
                      <th scope="col" className="px-3 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1F5]">
                    {applications.map((application) => (
                      <tr id={`application-${application.id}`} key={application.id} className="align-top text-xs text-[#475569]">
                        <td className="break-words px-4 py-4">
                          <p className="font-semibold leading-5 text-[#172033]">{application.scheme}</p>
                          <p className="mt-1 text-[10px] text-[#64748B]">{application.type} · {application.academicYear}</p>
                        </td>
                        <td className="break-all px-3 py-4 text-[11px]">{application.id}</td>
                        <td className="px-3 py-4">
                          <p className="whitespace-nowrap">{application.submitted}</p>
                          <p className="mt-1 text-[10px] text-[#64748B]">Updated {application.updated}</p>
                        </td>
                        <td className="break-words px-3 py-4">{application.stage}</td>
                        <td className="px-3 py-4"><ApplicationProgress application={application} /></td>
                        <td className="px-3 py-4"><StatusBadge status={application.status} /></td>
                        <td className="px-3 py-4"><ApplicationAction application={application} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="divide-y divide-[#EEF1F5] 2xl:hidden">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-[#DCE3EC] bg-[#F8FAFC] px-4 py-3 text-xs text-[#64748B] sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p>Showing 1–{applications.length} of {applications.length} applications</p>
              <p>All available applications are shown</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563A8]">
              <Search size={21} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-[#172033]">No applications found</h2>
            <p className="mt-1 max-w-md text-sm leading-6 text-[#64748B]">
              Try changing your search or filters, or explore available schemes to start a new application.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-4 text-sm font-semibold text-[#173F7A] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2">
                Clear filters
              </button>
              <Link href="/student/all-schemes" className={buttonClassName}>Explore Schemes</Link>
            </div>
          </div>
        )}
      </section>
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
  value: string;
  detail: string;
  Icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium leading-4 text-[#64748B] sm:text-sm">{label}</p>
          <p className="mt-2 text-2xl font-bold leading-none text-[#172033]">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${iconClass}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
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