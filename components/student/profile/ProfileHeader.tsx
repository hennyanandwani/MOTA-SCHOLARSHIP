import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function ProfileHeader() {
  const t = useStudentTranslation();
  return (
    <header className="min-w-0">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">
          {t('Student Portal')}
        </Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page" className="font-medium text-[#334155]">{t('Profile')}</span>
      </nav>
      <h1 className="mt-2 text-2xl font-bold text-[#172033]">{t('My Profile')}</h1>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748B]">{t('Manage your personal, academic and application-related information.')}</p>
    </header>
  );
}