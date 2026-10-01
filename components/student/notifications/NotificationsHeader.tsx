import Link from 'next/link';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';

export function NotificationsHeader({ unreadCount, onMarkAllRead }: { unreadCount: number; onMarkAllRead: () => void }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page" className="font-medium text-[#334155]">Notifications</span>
      </nav>
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0"><div className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Bell size={16} aria-hidden="true" /></span><h1 className="text-2xl font-bold text-[#172033]">Notifications</h1></div><p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">Stay updated about your applications, documents and important scholarship information.</p></div>
        <button type="button" disabled={unreadCount === 0} onClick={onMarkAllRead} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-4 text-sm font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] disabled:cursor-not-allowed disabled:text-[#94A3B8] sm:w-auto"><CheckCheck size={16} aria-hidden="true" />Mark all as read</button>
      </header>
    </>
  );
}