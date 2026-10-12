'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';
import type { DashboardApplication } from '@/components/student/dashboardTypes';

const stages = [
  'Application Submitted',
  'Awaiting verification',
  'Eligibility Verification',
  'Officer Scrutiny',
  'Screening / Selection',
  'Outcome',
];

function getCurrentStageIndex(status: string): number {
  if (status === 'DRAFT') return 0;
  if (status === 'SUBMITTED' || status === 'PENDING_VERIFICATION' || status === 'FLAGGED_FOR_MANUAL_REVIEW') return 1;
  if (status === 'RECOMMENDED_FOR_APPROVAL') return 4;
  if (status === 'APPROVED_BY_OFFICER' || status === 'REJECTED_BY_OFFICER') return 5;
  return 0;
}

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

  const currentIndex = getCurrentStageIndex(application.status);
  const stageNames = application.status === 'DRAFT'
    ? ['Draft in progress', ...stages.slice(1)]
    : stages;

  return (
    <section id="application-progress" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#172033]">{t('Application Progress')}</h2>
          <p className="mt-1 text-xs text-[#64748B]">{application.schemeName}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1D5796]">{t(application.statusLabel)}</span>
      </div>

      <ol className="mt-5 grid gap-0 sm:grid-cols-6 sm:gap-2">
        {stageNames.map((stage, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={stage} className="relative flex min-h-11 items-start gap-3 sm:min-h-0 sm:flex-col sm:gap-2">
              {index < stageNames.length - 1 && <span className={`absolute left-[11px] top-6 h-full w-px sm:left-3 sm:top-3 sm:h-px sm:w-[calc(100%-0.5rem)] ${isComplete ? 'bg-[#A7D6C5]' : 'bg-[#DCE3EC]'}`} aria-hidden="true" />}
              <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${isComplete ? 'border-[#16805B] bg-[#16805B] text-white' : isCurrent ? 'border-[#2563A8] bg-white text-[#2563A8] ring-4 ring-blue-50' : 'border-[#CBD5E1] bg-white text-[#64748B]'}`}>
                {isComplete ? <Check size={13} aria-hidden="true" /> : index + 1}
              </span>
              <span className={`pt-1 text-xs leading-4 sm:pt-0 sm:text-[11px] ${isCurrent ? 'font-semibold text-[#173F7A]' : isComplete ? 'font-medium text-[#16805B]' : 'text-[#64748B]'}`}>
                {t(stage)}
                {isCurrent && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-[#2563A8] sm:hidden">{t('Current')}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 rounded-lg bg-blue-50/70 px-3 py-2.5 text-xs text-[#31577F]">
        {t(application.status === 'SUBMITTED'
          ? 'Your application is submitted and awaiting verification.'
          : `Current stage: ${application.currentStage}.`)}
      </p>
      <Link href={application.status === 'DRAFT' ? application.applicationHref : application.reviewHref} className="mt-3 inline-flex text-xs font-semibold text-[#2563A8] hover:underline">
        {t('View application')}
      </Link>
    </section>
  );
}
