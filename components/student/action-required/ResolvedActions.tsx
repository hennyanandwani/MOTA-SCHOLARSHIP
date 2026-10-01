import { CheckCircle2, ChevronDown } from 'lucide-react';
import type { ActionItem } from '@/lib/actionRequired';

export function ResolvedActions({ actions, open = false }: { actions: ActionItem[]; open?: boolean }) {
  if (actions.length === 0) return null;
  return (
    <details open={open} className="group rounded-xl border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#126747]"><CheckCircle2 size={16} aria-hidden="true" /></span><span><span className="block text-sm font-semibold text-[#172033]">Recently Resolved</span><span className="mt-0.5 block text-[10px] text-[#64748B]">{actions.length} completed item{actions.length === 1 ? '' : 's'}</span></span></span>
        <ChevronDown size={17} className="shrink-0 text-[#64748B] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <ul className="divide-y divide-[#EEF1F5] border-t border-[#EEF1F5] px-4 sm:px-5">
        {actions.map((action) => <li key={action.id} className="flex min-w-0 flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words text-xs font-semibold text-[#334155]">{action.title}</p><p className="mt-0.5 text-[10px] text-[#64748B]">{action.schemeName} · {action.applicationId}</p></div><span className="inline-flex w-fit items-center gap-1.5 text-[10px] font-semibold text-[#126747]"><CheckCircle2 size={13} aria-hidden="true" />Resolved · {action.raisedDate}</span></li>)}
      </ul>
    </details>
  );
}