import Link from 'next/link';
import { CalendarDays, GraduationCap } from 'lucide-react';
import type { Scheme } from '@/lib/schemes';

type SchemeCardProps = {
  scheme: Scheme;
};

const statusClassNames = {
  Open: 'bg-emerald-50 text-[#16805B] ring-emerald-200',
  Upcoming: 'bg-blue-50 text-[#2563A8] ring-blue-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function SchemeCard({ scheme }: SchemeCardProps) {
  return (
    <article id={scheme.id} className="flex min-w-0 flex-col rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]">
          <GraduationCap size={18} aria-hidden="true" />
        </span>
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClassNames[scheme.status]}`}>
          {scheme.status}
        </span>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
        {scheme.type} <span aria-hidden="true">·</span> {scheme.academicLevel}
      </p>
      <h2 className="mt-1 break-words text-base font-semibold leading-6 text-[#172033]">{scheme.name}</h2>
      <p className="mt-2 flex-1 text-xs leading-5 text-[#64748B]">{scheme.description}</p>

      <p className="mt-4 inline-flex items-center gap-1.5 border-t border-[#EEF1F5] pt-3 text-xs text-[#475569]">
        <CalendarDays size={14} className="shrink-0 text-[#64748B]" aria-hidden="true" />
        <span className="font-medium">Deadline:</span> {scheme.deadline}
      </p>

      <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
        <Link href={`#${scheme.id}`} className="inline-flex min-h-10 min-w-0 items-center justify-center rounded-lg border border-[#DCE3EC] px-3 py-2 text-xs font-semibold text-[#173F7A] transition hover:bg-[#F8FAFC]">
          View Details
        </Link>
        <Link href="/student/recommended-schemes" className="inline-flex min-h-10 min-w-0 items-center justify-center rounded-lg bg-[#173F7A] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#123362]">
          Check Eligibility
        </Link>
      </div>
    </article>
  );
}