import { Check } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const stages = [
  'Submitted',
  'Document Verification',
  'Eligibility Verification',
  'Officer Scrutiny',
  'Screening',
  'Selection',
];

export function ApplicationProgress() {
  const t = useStudentTranslation();
  return (
    <section id="application-progress" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#172033]">{t('Application Progress')}</h2>
          <p className="mt-1 text-xs text-[#64748B]">National Fellowship for ST Students</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1D5796]">{t('Current stage')}</span>
      </div>

      <ol className="mt-5 grid gap-0 sm:grid-cols-6 sm:gap-2">
        {stages.map((stage, index) => {
          const isComplete = index === 0;
          const isCurrent = index === 1;

          return (
            <li key={stage} className="relative flex min-h-11 items-start gap-3 sm:min-h-0 sm:flex-col sm:gap-2">
              {index < stages.length - 1 && <span className="absolute left-[11px] top-6 h-full w-px bg-[#DCE3EC] sm:left-3 sm:top-3 sm:h-px sm:w-[calc(100%-0.5rem)]" aria-hidden="true" />}
              <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${isComplete ? 'border-[#16805B] bg-[#16805B] text-white' : isCurrent ? 'border-[#2563A8] bg-white text-[#2563A8] ring-4 ring-blue-50' : 'border-[#CBD5E1] bg-white text-[#64748B]'}`}>
                {isComplete ? <Check size={13} aria-hidden="true" /> : index + 1}
              </span>
              <span className={`pt-1 text-xs leading-4 sm:pt-0 sm:text-[11px] ${isCurrent ? 'font-semibold text-[#173F7A]' : isComplete ? 'font-medium text-[#16805B]' : 'text-[#64748B]'}`}>
                {t(stage)}
                {isCurrent && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-[#2563A8] sm:hidden">{t('Now')}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 rounded-lg bg-blue-50/70 px-3 py-2.5 text-xs text-[#31577F]">
        {t('Your application is currently being reviewed.')}
      </p>
    </section>
  );
}