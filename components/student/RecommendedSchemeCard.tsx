import Link from 'next/link';
import { BookOpen, CalendarDays, GraduationCap } from 'lucide-react';
import type { RecommendedScheme } from '@/lib/recommendedSchemes';

type RecommendedSchemeCardProps = {
  scheme: RecommendedScheme;
};

const statusClasses = {
  Open: 'bg-emerald-50 text-[#16805B] ring-emerald-200',
  Upcoming: 'bg-blue-50 text-[#2563A8] ring-blue-200',
};

const matchClasses = {
  High: 'text-[#16805B]',
  Good: 'text-[#2563A8]',
  Review: 'text-[#B7791F]',
};

export function RecommendedSchemeCard({ scheme }: RecommendedSchemeCardProps) {
  const SchemeIcon = scheme.category === 'Fellowship' ? GraduationCap : BookOpen;

  return (
    <article id={scheme.id} className="flex min-w-0 flex-col rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]">
          <SchemeIcon size={18} aria-hidden="true" />
        </span>
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClasses[scheme.status]}`}>
          {scheme.status}
        </span>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{scheme.category}</p>
      <h3 className="mt-1 text-base font-semibold leading-6 text-[#172033]">{scheme.name}</h3>
      <p className="mt-2 min-h-10 text-xs leading-5 text-[#64748B]">{scheme.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-y border-[#EEF1F5] py-3">
        <div>
          <p className="text-[10px] text-[#64748B]">Profile Match</p>
          <p className={`mt-0.5 text-sm font-semibold ${matchClasses[scheme.match]}`}>{scheme.match}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#64748B]">Deadline</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-[#334155]">
            <CalendarDays size={13} aria-hidden="true" />{scheme.deadline}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">Relevant match factors</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {scheme.factors.map((factor) => (
            <li key={factor} className="rounded-full border border-[#DCE3EC] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-medium text-[#475569]">
              {factor}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link href={`#${scheme.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] px-3 py-2 text-xs font-semibold text-[#173F7A] transition hover:bg-[#F8FAFC]">
          View Details
        </Link>
        <Link href="#eligibility-guidance" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#173F7A] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#123362]">
          Check Eligibility
        </Link>
      </div>
    </article>
  );
}