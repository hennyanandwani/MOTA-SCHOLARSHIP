'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const applications = [
  {
    scheme: 'National Fellowship for ST Students',
    id: 'NFST-2026-00124',
    submitted: '18 Sep 2026',
    stage: 'Document Verification',
    status: 'Under Review',
    statusClass: 'bg-blue-50 text-[#1D5796] ring-blue-200',
    action: 'View',
  },
  {
    scheme: 'Post Matric Scholarship',
    id: 'PMS-2026-00842',
    submitted: '12 Sep 2026',
    stage: 'Deficiency',
    status: 'Action Required',
    statusClass: 'bg-amber-50 text-[#94600D] ring-amber-200',
    action: 'Resolve',
  },
  {
    scheme: 'Higher Education Support',
    id: 'HES-2026-00217',
    submitted: '04 Sep 2026',
    stage: 'Eligibility Verification',
    status: 'Under Review',
    statusClass: 'bg-blue-50 text-[#1D5796] ring-blue-200',
    action: 'View',
  },
];

function StatusBadge({ status, statusClass }: { status: string; statusClass: string }) {
  const t = useStudentTranslation();
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClass}`}>{t(status)}</span>;
}

export function ApplicationsTable() {
  const t = useStudentTranslation();
  return (
    <section id="applications" className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE3EC] px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-base font-semibold text-[#172033]">{t('My Applications')}</h2>
          <p className="mt-1 text-xs text-[#64748B]">{t('Sample records for dashboard preview')}</p>
        </div>
        <Link href="#applications" className="text-xs font-semibold text-[#2563A8] hover:underline">{t('View all')}</Link>
      </div>

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
                <td className="max-w-56 px-5 py-4 font-semibold text-[#172033]">{application.scheme}</td>
                <td className="whitespace-nowrap px-4 py-4">{application.id}</td>
                <td className="whitespace-nowrap px-4 py-4">{application.submitted}</td>
                <td className="px-4 py-4">{t(application.stage)}</td>
                <td className="px-4 py-4"><StatusBadge status={application.status} statusClass={application.statusClass} /></td>
                <td className="px-5 py-4">
                  <Link href="#application-progress" className="inline-flex items-center gap-1 font-semibold text-[#2563A8] hover:underline">
                    {t(application.action)}<ArrowUpRight size={13} aria-hidden="true" />
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
              <div>
                <h3 className="text-sm font-semibold text-[#172033]">{application.scheme}</h3>
                <p className="mt-1 text-[11px] text-[#64748B]">{application.id}</p>
              </div>
              <StatusBadge status={application.status} statusClass={application.statusClass} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-[#64748B]">{t('Submitted')}</p><p className="mt-1 font-medium text-[#172033]">{application.submitted}</p></div>
              <div><p className="text-[#64748B]">{t('Current stage')}</p><p className="mt-1 font-medium text-[#172033]">{t(application.stage)}</p></div>
            </div>
            <Link href="#application-progress" className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563A8]">
              {t(application.action)}<ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}