import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  FileCheck,
  FileText,
  FolderOpen,
  ShieldAlert,
} from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function ApplicationGuidance() {
  const t = useStudentTranslation();

  const steps = [
    {
      number: '1',
      title: 'Check application status',
      description: 'Review current stage (Institution scrutiny, State review, or DBT batching).',
      icon: FileText,
    },
    {
      number: '2',
      title: 'Review action required items',
      description: 'Check if any verifying officer has requested specific corrections or clarification.',
      icon: AlertTriangle,
    },
    {
      number: '3',
      title: 'Check document status',
      description: 'Inspect verification states of uploaded income, ST tribe, and academic certificates.',
      icon: FileCheck,
    },
    {
      number: '4',
      title: 'Correct deficiencies if requested',
      description: 'Re-upload clear, unblurred scans without losing your place in the verification pipeline.',
      icon: ShieldAlert,
    },
    {
      number: '5',
      title: 'Monitor official communications',
      description: 'Watch in-portal notifications and official SMS/Email alerts for approval notices.',
      icon: Bell,
    },
  ];

  return (
    <section
      aria-labelledby="app-guidance-heading"
      className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#138808]">
            <CheckCircle2 size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="app-guidance-heading" className="text-base font-bold text-[#172033]">
              {t('Need help with your application?')}
            </h2>
            <p className="text-xs text-[#64748B]">
              {t('Follow these 5 recommended verification checkpoints to keep your scholarship on track.')}
            </p>
          </div>
        </div>
      </div>

      {/* Step Grid */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.number}
              className="relative flex flex-col rounded-xl border border-[#EEF2F6] bg-[#F8FAFC] p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#173F7A] text-[11px] font-bold text-white">
                  {step.number}
                </span>
                <span className="text-slate-400">
                  <StepIcon size={16} aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-2.5 text-xs font-bold text-[#172033]">
                {t(step.title)}
              </h3>
              <p className="mt-1 text-[11px] leading-4 text-[#64748B]">
                {t(step.description)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-[#EEF1F5] pt-4">
        <span className="text-xs font-semibold text-[#475569]">
          {t('Quick Navigation')}:
        </span>
        <Link
          href="/student/applications"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#B8C9DC] bg-white px-3.5 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
        >
          <FileText size={14} aria-hidden="true" />
          {t('View My Applications')}
          <ArrowRight size={12} aria-hidden="true" />
        </Link>
        <Link
          href="/student/action-required"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#E9D5A5] bg-[#FFFDF5] px-3.5 text-xs font-semibold text-[#80520B] transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
        >
          <AlertTriangle size={14} aria-hidden="true" />
          {t('View Action Required')}
          <ArrowRight size={12} aria-hidden="true" />
        </Link>
        <Link
          href="/student/documents"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#B8C9DC] bg-white px-3.5 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
        >
          <FolderOpen size={14} aria-hidden="true" />
          {t('View Documents')}
          <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}