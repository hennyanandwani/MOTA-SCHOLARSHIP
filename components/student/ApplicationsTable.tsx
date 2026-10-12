'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';
import type { DashboardApplication } from '@/components/student/dashboardTypes';

function statusClass(status: string): string {
  if (status === 'DRAFT') return 'bg-slate-50 text-slate-700 ring-slate-200';
  if (status === 'FLAGGED_FOR_MANUAL_REVIEW') return 'bg-amber-50 text-[#94600D] ring-amber-200';
  if (status === 'APPROVED_BY_OFFICER' || status === 'RECOMMENDED_FOR_APPROVAL') {
    return 'bg-emerald-50 text-[#126747] ring-emerald-200';
  }
  if (status === 'REJECTED_BY_OFFICER') return 'bg-rose-50 text-[#A8323D] ring-rose-200';
  return 'bg-blue-50 text-[#1D5796] ring-blue-200';
}

function formatSubmittedDate(value: string | null): string {
  if (!value) return 'Not submitted';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function ApplicationRows({ applications }: { applications: DashboardApplication[] }) {
  const t = useStudentTranslation();
  if (applications.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-[#64748B]">{t('You have no applications yet.')}</p>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[850px] text-left">
          <thead className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            <tr>
              <th className="px-5 py-3">{t('Scheme')}</th>
              <th className="px-4 py-3">{t('Application ID')}</th>
              <th className="px-4 py-3">{t('Submitted')}</th>
              <th className="px-4 py-3">{t('Current Stage')}</th>
              <th className="px-4 py-3">{t('Status')}</th>
              <th className="px-5 py-3">{t('Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F5]">
            {applications.map((application) => (
              <tr key={application.id} className="text-xs text-[#475569]">
                <td className="max-w-56 px-5 py-4 font-semibold text-[#172033]">{application.schemeName}</td>
                <td className="whitespace-nowrap px-4 py-4">{application.applicationNumber}</td>
                <td className="whitespace-nowrap px-4 py-4">{formatSubmittedDate(application.submittedAt)}</td>
                <td className="px-4 py-4">{application.currentStage}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClass(application.status)}`}>
                    {t(application.statusLabel)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Link href={application.status === 'DRAFT' ? application.applicationHref : application.reviewHref} className="inline-flex items-center gap-1 font-semibold text-[#2563A8] hover:underline">
                    {t(application.status === 'DRAFT' ? 'Continue' : 'View')}<ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[#EEF1F5] md:hidden">
        {applications.map((application) => (
          <article key={application.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#172033]">{application.schemeName}</h3>
                <p className="mt-1 break-all text-[11px] text-[#64748B]">{application.applicationNumber}</p>
              </div>
              <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClass(application.status)}`}>
                {t(application.statusLabel)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-[#64748B]">{t('Submitted')}</p><p className="mt-1 font-medium text-[#172033]">{formatSubmittedDate(application.submittedAt)}</p></div>
              <div><p className="text-[#64748B]">{t('Current stage')}</p><p className="mt-1 font-medium text-[#172033]">{application.currentStage}</p></div>
            </div>
            <Link href={application.status === 'DRAFT' ? application.applicationHref : application.reviewHref} className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563A8]">
              {t(application.status === 'DRAFT' ? 'Continue' : 'View')}<ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}

export function ApplicationsTable({ applications }: { applications: DashboardApplication[] }) {
  const t = useStudentTranslation();
  return (
    <section id="applications" className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE3EC] px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-base font-semibold text-[#172033]">{t('My Applications')}</h2>
          <p className="mt-1 text-xs text-[#64748B]">{t('Applications saved to your account')}</p>
        </div>
      </div>
      <ApplicationRows applications={applications} />
    </section>
  );
}
