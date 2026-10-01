import { AlertCircle, CheckCircle2, CircleDashed, FileCheck2, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const statusLabels = {
  complete: 'Complete',
  attention: 'Needs attention',
  pending: 'Pending',
} as const;

const statusClasses = {
  complete: 'text-[#126747]',
  attention: 'text-[#80520B]',
  pending: 'text-[#64748B]',
} as const;

export function ApplicationCompleteness({
  documentsComplete,
  declarationsComplete,
}: {
  documentsComplete: boolean;
  declarationsComplete: boolean;
}) {
  const items: { label: string; status: 'complete' | 'attention' | 'pending'; Icon: LucideIcon }[] = [
    { label: 'Personal information', status: 'complete', Icon: UserRound },
    { label: 'Academic information', status: 'complete', Icon: CheckCircle2 },
    { label: 'Family & bank information', status: 'complete', Icon: CheckCircle2 },
    { label: 'Required documents', status: documentsComplete ? 'complete' : 'attention', Icon: documentsComplete ? CheckCircle2 : AlertCircle },
    { label: 'Declarations', status: declarationsComplete ? 'complete' : 'pending', Icon: declarationsComplete ? CheckCircle2 : CircleDashed },
  ];

  return (
    <section aria-labelledby="completeness-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="completeness-heading" className="text-sm font-semibold text-[#172033]">Application completeness</h2>
          <p className="mt-1 text-[11px] text-[#64748B]">Review status across required sections</p>
        </div>
        <span className="text-xl font-bold text-[#173F7A]">78%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E3EAF2]" role="progressbar" aria-label="Application completeness" aria-valuenow={78} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full w-[78%] rounded-full bg-[#2563A8]" />
      </div>
      <ul className="mt-4 space-y-3">
        {items.map(({ label, status, Icon }) => (
          <li key={label} className="flex min-w-0 items-start justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-start gap-2 text-[#334155]"><Icon size={14} className={`mt-0.5 shrink-0 ${statusClasses[status]}`} aria-hidden="true" /><span>{label}</span></span>
            <span className={`shrink-0 text-right text-[10px] font-semibold ${statusClasses[status]}`}>{statusLabels[status]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-start gap-2 border-t border-[#EEF1F5] pt-3 text-[10px] leading-4 text-[#64748B]"><FileCheck2 size={13} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />Completeness is an illustrative demo indicator.</p>
    </section>
  );
}