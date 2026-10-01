import { BookOpen, UserRound } from 'lucide-react';
import type { Application } from '@/lib/applicationTracking';

export function ApplicationSummary({ application }: { application: Application }) {
  return (
    <section aria-labelledby="application-summary-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="border-b border-[#EEF1F5] pb-3">
        <h2 id="application-summary-heading" className="text-sm font-semibold text-[#172033]">Application Summary</h2>
        <p className="mt-1 text-[11px] text-[#64748B]">Demo profile details for this application</p>
      </div>
      <div className="mt-4 grid min-w-0 gap-5 md:grid-cols-2">
        <SummaryGroup title="Personal" Icon={UserRound} fields={[
          ['Applicant Name', application.applicant.name],
          ['Application ID', application.id],
          ['State', application.applicant.state],
          ['District', application.applicant.district],
        ]} />
        <SummaryGroup title="Academic" Icon={BookOpen} fields={[
          ['Institution', application.academic.institution],
          ['Course / Program', application.academic.course],
          ['Academic Level', application.academic.level],
          ['Academic Year', application.academic.year],
        ]} />
      </div>
    </section>
  );
}

function SummaryGroup({
  title,
  Icon,
  fields,
}: {
  title: string;
  Icon: typeof UserRound;
  fields: [string, string][];
}) {
  return (
    <section aria-label={title} className="min-w-0 rounded-lg border border-[#EEF1F5] bg-[#FCFDFE] p-3.5">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-[#172033]"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Icon size={15} aria-hidden="true" /></span>{title}</h3>
      <dl className="mt-2 divide-y divide-[#EEF1F5]">
        {fields.map(([label, value]) => <div key={label} className="grid min-w-0 grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 py-2.5"><dt className="text-[10px] leading-4 text-[#64748B]">{label}</dt><dd className="break-words text-right text-xs font-medium leading-4 text-[#172033]">{value}</dd></div>)}
      </dl>
    </section>
  );
}