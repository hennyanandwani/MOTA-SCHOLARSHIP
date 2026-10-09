'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HelpCircle, LogOut, Settings, UserRound } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

type AccountMenuProps = {
  userName?: string;
  role?: string;
  avatarInitials?: string;
  context?: 'student' | 'admin';
};

const menuItemClassName = 'flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs font-medium text-[#334155] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]';

export function AccountMenu({
  userName,
  role,
  avatarInitials,
  context,
}: AccountMenuProps) {
  const t = useStudentTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = context === 'admin' || (context === undefined && pathname.startsWith('/admin'));
  const displayName = userName ?? (isAdmin ? 'MoTA Administrator' : 'Aarav Bhil');
  const displayRole = role ?? (isAdmin ? 'MoTA Administration' : 'Student');
  const displayInitials = avatarInitials ?? (isAdmin ? 'MA' : 'AB');

  const profileHref = isAdmin ? '/admin/profile' : '/student/profile';
  const settingsHref = isAdmin ? '/admin/settings' : '/student/settings';
  const helpHref = isAdmin ? '/admin/help' : '/student/help';
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (!items?.length) return;

      const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLElement);
      let nextIndex: number | undefined;

      if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1 + items.length) % items.length;
      if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = items.length - 1;

      if (nextIndex !== undefined) {
        event.preventDefault();
        items[nextIndex].focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function toggleMenu() {
    setOpen((current) => {
      const next = !current;
      if (next) requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
      return next;
    });
  }

  function closeAfterNavigation() {
    setOpen(false);
  }

  function handleSignOut() {
    setOpen(false);
    router.push('/');
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t('Open account menu')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={toggleMenu}
        className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
      >
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-[#173F7A]">
          {displayInitials}
        </span>
        <span className="hidden min-w-0 max-w-[240px] text-left md:block">
          <span className="block text-xs font-semibold text-[#172033]">{displayName}</span>
          <span className="block truncate text-[10px] text-slate-500">{t(displayRole)}</span>
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          id="account-menu"
          role="menu"
          aria-label={t('Account menu')}
          className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-[#DCE3EC] bg-white p-2 shadow-lg"
        >
          <div role="group" aria-label="Account identity" className="flex min-w-0 items-center gap-3 px-2.5 py-2.5">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#173F7A] text-xs font-bold text-white">{displayInitials}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#172033]">{displayName}</span>
              <span className="mt-0.5 block text-[11px] text-[#64748B]">{t(displayRole)}</span>
            </span>
          </div>

          <div className="my-1 border-t border-[#EEF1F5]" role="separator" />
          <Link href={profileHref} role="menuitem" onClick={closeAfterNavigation} className={menuItemClassName}><UserRound size={15} aria-hidden="true" />{t('Profile')}</Link>
          <Link href={settingsHref} role="menuitem" onClick={closeAfterNavigation} className={menuItemClassName}><Settings size={15} aria-hidden="true" />{t('Settings')}</Link>
          <Link href={helpHref} role="menuitem" onClick={closeAfterNavigation} className={menuItemClassName}><HelpCircle size={15} aria-hidden="true" />{t('Help & Support')}</Link>
          <div className="my-1 border-t border-[#EEF1F5]" role="separator" />
          <button type="button" role="menuitem" onClick={handleSignOut} className={`${menuItemClassName} text-[#A8323D] hover:bg-rose-50`}>
            <LogOut size={15} aria-hidden="true" />{t('Sign out')}
          </button>
        </div>
      )}
    </div>
  );
}