'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';
import {
  LayoutDashboard,
  Search,
  FileText,
  FolderOpen,
  Bell,
  UserRound,
  Settings,
  HelpCircle,
  LogOut,
  GraduationCap,
  ClipboardCheck,
  Activity,
  Users,
  ShieldCheck,
} from 'lucide-react';

type NavigationItem = {
  label: string;
  href: string;
  icon?: React.ElementType;
};

type SidebarProps = {
  items?: NavigationItem[];
  title?: string;
};

const defaultItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/student',
    icon: LayoutDashboard,
  },
  {
    label: 'Recommended Schemes',
    href: '/student/recommended-schemes',
    icon: Search,
  },
  {
    label: 'All Schemes',
    href: '/student/all-schemes',
    icon: GraduationCap,
  },
  {
    label: 'My Applications',
    href: '/student/applications',
    icon: FileText,
  },
  {
    label: 'Documents',
    href: '/student/documents',
    icon: FolderOpen,
  },
  {
    label: 'Notifications',
    href: '/student/notifications',
    icon: Bell,
  },
];

const navigationIcons: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Overview: LayoutDashboard,
  'Recommended Schemes': Search,
  'All Schemes': GraduationCap,
  Applications: FileText,
  'My Applications': FileText,
  Documents: FolderOpen,
  'Action Required': ClipboardCheck,
  Notifications: Bell,
  'Verification Queue': ClipboardCheck,
  Deficiencies: Activity,
  Screening: Users,
  Selection: ShieldCheck,
  Schemes: GraduationCap,
  'Rule Configuration': Settings,
  Communications: Bell,
  'Analytics & Reports': Activity,
  'Audit Logs': FolderOpen,
};

export function Sidebar({ items = defaultItems, title = 'Student Portal' }: SidebarProps) {
  const pathname = usePathname();
  const t = useStudentTranslation();

  return (
    <aside className="relative z-20 flex w-full shrink-0 flex-col border-b border-[#DCE3EC] bg-white lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
      {/* Brand */}
      <div className="hidden h-20 items-center gap-3 border-b border-[#DCE3EC] px-6 lg:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173F7A] text-xs font-bold text-white">
          <Image
            src="/images/india-emblem.svg"
            alt={t('Government of India emblem')}
            width={20}
            height={32}
            className="brightness-0 invert"
          />
        </div>

        <div>
          <p className="text-sm font-bold text-[#172033]">
            {t('Scholarship Portal')}
          </p>

          <p className="text-[10px] text-slate-500">{t(title)}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2 lg:px-4 lg:py-6">
        <p className="hidden px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:block">
          {t('Workspace')}
        </p>

        <nav className="flex min-w-0 flex-wrap gap-1 lg:mt-3 lg:block lg:space-y-1">
          {items.map((item) => {
            const Icon = item.icon ?? navigationIcons[item.label];

            const isActive =
              pathname === item.href ||
              (item.href !== '/student' &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 shrink items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition lg:gap-3 lg:rounded-xl ${
                  isActive
                    ? 'bg-blue-50 text-[#173F7A]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#173F7A]'
                }`}
              >
                {Icon && <Icon size={18} />}

                <span className="min-w-0">{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Account */}
        <p className="mt-8 hidden px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 lg:block">
          {t('Account')}
        </p>

        <nav className="mt-3 hidden space-y-1 lg:block">
          <Link
            href="/student/profile"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === '/student/profile' ? 'bg-blue-50 text-[#173F7A]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#173F7A]'}`}
          >
            <UserRound size={18} />
            {t('Profile')}
          </Link>

          <Link
            href="/student/settings"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === '/student/settings' ? 'bg-blue-50 text-[#173F7A]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#173F7A]'}`}
          >
            <Settings size={18} />
            {t('Settings')}
          </Link>

          <Link
            href="/student/help"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-[#173F7A]"
          >
            <HelpCircle size={18} />
            {t('Help & Support')}
          </Link>
        </nav>
      </div>

      {/* User */}
      <div className="hidden border-t border-[#DCE3EC] p-4 lg:block">
        <div className="flex items-center gap-3 rounded-xl bg-[#F6F8FB] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173F7A] text-xs font-bold text-white">
            ST
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#172033]">
              {t('Student Account')}
            </p>

            <p className="truncate text-[10px] text-slate-500">
              {t('Scheduled Tribe Student')}
            </p>
          </div>

          <button
            type="button"
            className="text-slate-400 transition hover:text-red-500"
            title={t('Logout')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}