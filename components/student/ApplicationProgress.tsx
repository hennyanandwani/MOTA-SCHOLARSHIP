'use client';

import Link from 'next/link';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';
import type { DashboardApplication } from '@/components/student/dashboardTypes';

export function ApplicationProgress({ application }: { application: DashboardApplication | null }) {
  const t = useStudentTranslation();
  if (!application) {
    return (
      <section id="application-progress" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
        <h2 className="text-base font-semibold text-[#172033]">{t('Application Progress')}</h2>
        <p className="mt-3 text-sm text-[#64748B]">{t('Your application progress will appear here after you save an application.')}</p>
        <Link href="/student/all-schemes" className="mt-3 inline-flex text-xs font-semibold text-[#2563A8] hover:underline">{t('Explore schemes')}</Link>
      </section>
    );
  }

  return (
    <section id="application-progress" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#172033]">{t('Application Progress')}</h2>
          <p className="mt-1 text-xs text-[#64748B]">{application.schemeName}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1D5796]">{t(application.statusLabel)}</span>
      </div>

      <p className="mt-4 rounded-lg bg-blue-50/70 px-3 py-3 text-xs leading-5 text-[#31577F]">
        {application.status === 'DRAFT'
          ? `Draft saved at step ${application.currentStep} of 4.`
          : `Current saved application status: ${application.statusLabel}.`}
        {application.submittedAt && ` Submitted ${application.submittedAt.slice(0, 10)}.`}
      </p>
      <Link href={application.status === 'DRAFT' ? application.applicationHref : application.reviewHref} className="mt-3 inline-flex text-xs font-semibold text-[#2563A8] hover:underline">
        {t('View application')}
      </Link>
    </section>
  );
}
