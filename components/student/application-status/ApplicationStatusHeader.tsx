import Link from 'next/link';
import { AlertCircle, Award, ChevronRight, Clock3, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Application, ApplicationStatusLabel } from '@/lib/applicationTracking';

const statusPresentation: Record<ApplicationStatusLabel, { Icon: LucideIcon; className: string }> = {
  Submitted: { Icon: FileText, className: 'border-blue-200 bg-blue-50 text-[#1D5796]' },
  'Under Review': { Icon: Clock3, className: 'border-blue-200 bg-blue-50 text-[#1D5796]' },
  'Action Required': { Icon: AlertCircle, className: 'border-amber-200 bg-amber-50 text-[#80520B]' },
  Selected: { Icon: Award, className: 'border-emerald-200 bg-emerald-50 text-[#126747]' },
  'Not Selected': { Icon: AlertCircle, className: 'border-[#DCE3EC] bg-[#F8FAFC] text-[#475569]' },
};

export function ApplicationStatusHeader({ application }: { application: Application }) {
  const status = statusPresentation[application.status];
  const StatusIcon = status.Icon;

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link href="/student/applications" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">My Applications</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <Link href="#application-summary" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Application</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page" className="font-medium text-[#334155]">Application Details</span>
      </nav>

      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#172033]">Application Status</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">Track the progress of your scholarship or fellowship application.</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}>
          <StatusIcon size={14} aria-hidden="true" />{application.status}
        </span>
      </header>

      <section id="application-summary" aria-label="Application details" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><FileText size={19} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold text-[#172033]">{application.schemeName}</p>
            <p className="mt-1 break-all text-xs text-[#64748B]">{application.id}</p>
          </div>
        </div>
        <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 border-t border-[#EEF1F5] pt-4 sm:grid-cols-4">
          <InfoItem label="Academic year" value={application.academicYear} />
          <InfoItem label="Application type" value={application.type} />
          <InfoItem label="Submitted date" value={application.submittedDate} />
          <InfoItem label="Current status" value={application.status} />
        </dl>
      </section>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-[10px] text-[#64748B]">{label}</dt><dd className="mt-1 break-words text-xs font-semibold text-[#172033]">{value}</dd></div>;
}