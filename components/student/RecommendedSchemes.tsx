'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';
import type { DashboardScheme } from '@/components/student/dashboardTypes';

export function RecommendedSchemes({ schemes }: { schemes: DashboardScheme[] }) {
  const t = useStudentTranslation();
  return (
    <section id="recommended-schemes">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#172033]">{t('Scholarship and fellowship schemes')}</h2>
          <p className="mt-1 text-xs text-[#64748B]">{t('Active schemes from the scholarship database')}</p>
        </div>
        <Link href="/student/all-schemes" className="text-xs font-semibold text-[#2563A8] hover:underline">{t('Explore schemes')}</Link>
      </div>

      {schemes.length === 0 ? (
        <p className="mt-3 rounded-xl border border-[#DCE3EC] bg-white p-5 text-sm text-[#64748B]">
          {t('No active schemes are available right now.')}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {schemes.map((scheme) => {
            const Icon = scheme.type === 'FELLOWSHIP' ? GraduationCap : BookOpen;
            const href = `/student/schemes/${encodeURIComponent(scheme.id)}`;
            return (
              <article key={scheme.id} className="flex min-w-0 flex-col rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Icon size={18} aria-hidden="true" /></span>
                <h3 className="mt-3 text-sm font-semibold leading-5 text-[#172033]">{scheme.name}</h3>
                <p className="mt-1 min-h-8 text-xs leading-4 text-[#64748B]">{scheme.description || t(scheme.type === 'FELLOWSHIP' ? 'Fellowship' : 'Scholarship')}</p>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EEF1F5] pt-3">
                  <p className="text-[10px] text-[#64748B]">{t('Guidance only · check scheme requirements')}</p>
                  <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#2563A8] hover:underline">
                    {t('View details')}<ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] leading-5 text-[#64748B]">
        {t('These schemes are shown for guidance only. Display here does not mean that you meet eligibility criteria or will be selected.')}
      </p>
    </section>
  );
}
