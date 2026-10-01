import { Info, MapPinCheckInside } from 'lucide-react';
import type { Application } from '@/lib/applicationTracking';

export function ApplicationProgress({ application }: { application: Application }) {
  return (
    <section aria-labelledby="current-stage-heading" className="rounded-xl border border-[#C9D8E8] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><MapPinCheckInside size={19} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2563A8]">Current stage</p>
            <h2 id="current-stage-heading" className="mt-1 break-words text-base font-bold text-[#172033]">{application.currentStage}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#64748B]">Your application has been submitted and is currently undergoing official verification.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
          <span className="text-2xl font-bold text-[#173F7A]">{application.progress}%</span>
          <span className="text-[10px] text-[#64748B]">Overall progress</span>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E3EAF2]" role="progressbar" aria-label="Application progress" aria-valuenow={application.progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-[#2563A8] transition-[width]" style={{ width: `${application.progress}%` }} />
      </div>
      <p className="mt-3 flex items-start gap-1.5 border-t border-[#EEF1F5] pt-3 text-[10px] leading-4 text-[#64748B]"><Info size={13} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />Status updates are based on the official application workflow.</p>
    </section>
  );
}