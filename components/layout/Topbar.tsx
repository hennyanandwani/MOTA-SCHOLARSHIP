'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { AccountMenu } from '@/components/layout/AccountMenu';
import { AdminTopbarActions } from '@/components/layout/AdminTopbarActions';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';
import {
  ADMIN_PROFILE_STORAGE_KEY,
  ADMIN_PROFILE_UPDATED_EVENT,
  getAdminProfileInitials,
  INITIAL_ADMIN_PROFILE,
  normalizeAdminProfile,
  type AdminProfile,
} from '@/lib/adminProfileData';

type TopbarProps = {
  title?: string;
  subtitle?: string;
  role?: string;
  context?: 'student' | 'admin';
};

export function Topbar({
  title,
  subtitle,
  role,
  context,
}: TopbarProps) {
  const pathname = usePathname();
  const t = useStudentTranslation();
  const isAdmin = context === 'admin' || (context === undefined && pathname.startsWith('/admin'));
  const pageTitle = title ?? (isAdmin ? 'Admin Dashboard' : role ?? 'Dashboard');
  const pageSubtitle = subtitle ?? (isAdmin ? 'Manage and monitor scholarship and fellowship operations' : 'Manage your scholarship and fellowship applications');
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(INITIAL_ADMIN_PROFILE);

  useEffect(() => {
    if (!isAdmin) return;
    const applyProfile = (value: unknown) => {
      setAdminProfile(normalizeAdminProfile(value) ?? INITIAL_ADMIN_PROFILE);
    };
    const readStoredProfile = () => {
      try {
        const raw = window.localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
        applyProfile(raw ? JSON.parse(raw) as unknown : null);
      } catch {
        applyProfile(null);
      }
    };
    const onProfileUpdated = (event: Event) => {
      applyProfile((event as CustomEvent<unknown>).detail);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== ADMIN_PROFILE_STORAGE_KEY) return;
      try {
        applyProfile(event.newValue ? JSON.parse(event.newValue) as unknown : null);
      } catch {
        applyProfile(null);
      }
    };

    readStoredProfile();
    window.addEventListener(ADMIN_PROFILE_UPDATED_EVENT, onProfileUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ADMIN_PROFILE_UPDATED_EVENT, onProfileUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [isAdmin]);

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
              {t(pageSubtitle)}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAdmin ? <AdminTopbarActions /> : (
            <>
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
                aria-label={t('Notifications')}
              >
                <Bell size={19} />
              </button>
            </>
          )}

          <div className="hidden h-7 w-px bg-slate-200 sm:block" />

          <AccountMenu
            context={isAdmin ? 'admin' : 'student'}
            userName={isAdmin ? adminProfile.name : 'Aarav Bhil'}
            role={isAdmin ? `${adminProfile.designation} · ${adminProfile.department}` : (role ?? 'Student')}
            avatarInitials={isAdmin ? getAdminProfileInitials(adminProfile.name) : 'AB'}
          />
        </div>
      </div>
    </header>
  );
}