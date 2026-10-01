import Link from 'next/link';
import { ChevronRight, HelpCircle } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function HelpHeader() {
  const t = useStudentTranslation();

  return (
    <div className="space-y-2">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-[#64748B]">
        <Link
          href="/student"
          className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
        >
          {t('Student Portal')}
        </Link>
        <ChevronRight size={13} aria-hidden="true" className="shrink-0 text-slate-400" />
        <span aria-current="page" className="font-medium text-[#334155]">
          {t('Help & Support')}
        </span>
      </nav>

      {/* Header */}
      <header className="flex min-w-0 flex-col gap-1 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#173F7A]">
            <HelpCircle size={20} aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">
            {t('Help & Support')}
          </h1>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-[#64748B]">
          {t(
            'Find answers, understand the application process, and get help with scholarship and fellowship services.'
          )}
        </p>
      </header>
    </div>
  );
}