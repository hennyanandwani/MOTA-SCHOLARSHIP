import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  FileText,
  FolderOpen,
  GraduationCap,
  Settings2,
  Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NotificationCategory, NotificationItem } from '@/lib/notifications';
import { notificationCategoryLabels } from '@/lib/notifications';

const categoryIcons: Record<NotificationCategory, LucideIcon> = {
  application: FileText,
  document: FolderOpen,
  action: AlertCircle,
  scheme: GraduationCap,
  system: Settings2,
};

export function NotificationCard({ notification, onOpen }: { notification: NotificationItem; onOpen: (notification: NotificationItem) => void }) {
  const Icon = categoryIcons[notification.category];
  const unread = notification.status === 'unread';
  return (
    <article className={`min-w-0 rounded-xl border p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] transition sm:p-5 ${unread ? 'border-blue-200 bg-blue-50/35' : 'border-[#DCE3EC] bg-white'}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${unread ? 'bg-blue-100 text-[#2563A8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
          <Icon size={18} aria-hidden="true" />
          {unread && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#2563A8]" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button type="button" onClick={() => onOpen(notification)} aria-label={`Open notification: ${notification.title}`} className={`break-words text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] ${unread ? 'font-bold text-[#172033]' : 'font-semibold text-[#334155]'}`}>{notification.title}</button>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#64748B]"><span>{notificationCategoryLabels[notification.category]}</span><span aria-hidden="true">·</span><time dateTime={notification.dateTime}>{notification.date}</time><span aria-hidden="true">·</span><span className="font-medium">{unread ? 'Unread' : 'Read'}</span></div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              {notification.priority === 'important' && <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-[#80520B]"><Star size={11} aria-hidden="true" />Important</span>}
              {unread && <span className="inline-flex w-fit items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#1D5796]">Unread</span>}
            </div>
          </div>
          <p className="mt-2 break-words text-xs leading-5 text-[#64748B]">{notification.message}</p>
          {(notification.actionLabel && notification.actionHref) && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#DCE3EC]/70 pt-3"><button type="button" onClick={() => onOpen(notification)} className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">View details</button><Link href={notification.actionHref} className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] sm:w-auto">{notification.actionLabel}<ArrowRight size={13} aria-hidden="true" /></Link></div>}
          {notification.applicationId && <p className="mt-2 break-all text-[10px] text-[#64748B]">{notification.schemeName} · {notification.applicationId}</p>}
        </div>
      </div>
    </article>
  );
}