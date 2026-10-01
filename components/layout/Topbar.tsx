'use client';

import { Bell, Search } from 'lucide-react';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

type TopbarProps = {
  title?: string;
  subtitle?: string;
  role?: string;
};

export function Topbar({
  title,
  subtitle = 'Manage your scholarship and fellowship applications',
  role,
}: TopbarProps) {
  const pageTitle = title ?? role ?? 'Dashboard';
  const t = useStudentTranslation();

  return (
    <header className="sticky top-0 z-30 border-b border-[#DCE3EC] bg-white lg:ml-64">
      <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-bold text-[#172033] sm:text-lg">
              {t(pageTitle)}
            </h1>

            <p className="hidden text-xs text-slate-500 sm:block">
              {t(subtitle)}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#173F7A]"
            title={t('Search')}
            aria-label={t('Search')}
          >
            <Search size={19} />
          </button>

          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#173F7A]"
            title="Notifications"
            aria-label={t('Notifications, 5 unread')}
          >
            <Bell size={19} />

            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#C2414B]" />
          </button>

          <div className="hidden h-7 w-px bg-slate-200 sm:block" />

          <AccountMenu userName="Aarav Bhil" role="Student" avatarInitials="AB" />
        </div>
      </div>
    </header>
  );
}