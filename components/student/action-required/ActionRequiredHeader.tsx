import Link from 'next/link';
import { AlertCircle, ChevronRight, Info } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function ActionRequiredHeader() {
  const t = useStudentTranslation();
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page" className="font-medium text-[#334155]">{t('Action Required')}</span>
      </nav>
      <header className="min-w-0">
        <h1 className="text-2xl font-bold text-[#172033]">{t('Action Required')}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">{t('Review pending actions and complete the required corrections for your applications.')}</p>
      </header>
      <p className="flex min-w-0 items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3.5 py-3 text-xs leading-5 text-[#31577F]"><Info size={15} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />{t('Some actions may be required before your application can move to the next stage of the official workflow.')}</p>
    </>
  );
}