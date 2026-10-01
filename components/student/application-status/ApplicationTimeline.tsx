import { AlertCircle, Check, Circle, Clock3 } from 'lucide-react';
import type { ApplicationStage } from '@/lib/applicationTracking';

const stateLabels = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending',
} as const;

export function ApplicationTimeline({ stages }: { stages: ApplicationStage[] }) {
  return (
    <section aria-labelledby="workflow-timeline-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="border-b border-[#EEF1F5] pb-3">
        <h2 id="workflow-timeline-heading" className="text-sm font-semibold text-[#172033]">Application Workflow</h2>
        <p className="mt-1 text-[11px] text-[#64748B]">Current stage: Document Verification</p>
      </div>
      <ol className="mt-4">
        {stages.map((stage, index) => {
          const current = stage.status === 'in_progress';
          const completed = stage.status === 'completed';
          const Icon = completed ? Check : current ? Clock3 : Circle;
          const iconClass = completed ? 'border-[#16805B] bg-[#16805B] text-white' : current ? 'border-[#2563A8] bg-blue-50 text-[#2563A8] ring-4 ring-blue-50' : 'border-[#CBD5E1] bg-white text-[#94A3B8]';
          const labelClass = completed ? 'text-[#126747]' : current ? 'text-[#173F7A]' : 'text-[#64748B]';

          return (
            <li key={stage.id} aria-current={current ? 'step' : undefined} className="relative flex min-w-0 gap-3 pb-5 last:pb-0">
              {index < stages.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px ${completed ? 'bg-[#A7D6C5]' : 'bg-[#DCE3EC]'}`} aria-hidden="true" />}
              <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${iconClass}`}>
                <Icon size={15} aria-hidden="true" />
              </span>
              <div className={`min-w-0 flex-1 rounded-lg border p-3 ${current ? 'border-blue-200 bg-blue-50/60' : 'border-transparent'}`}>
                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <h3 className={`break-words text-xs font-semibold ${labelClass}`}>{stage.name}</h3>
                  <span className={`inline-flex w-fit items-center gap-1.5 text-[10px] font-semibold ${labelClass}`}>
                    {current ? <AlertCircle size={12} aria-hidden="true" /> : <Icon size={12} aria-hidden="true" />}
                    {stateLabels[stage.status]}
                  </span>
                </div>
                {stage.date && <p className="mt-1 text-[10px] text-[#64748B]">{stage.date}</p>}
                {stage.description && <p className="mt-1 text-[11px] leading-4 text-[#64748B]">{stage.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}