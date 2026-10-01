'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, X } from 'lucide-react';
import type { NotificationItem } from '@/lib/notifications';
import { notificationCategoryLabels } from '@/lib/notifications';

export function NotificationDetail({ notification, onClose, onMarkRead }: { notification: NotificationItem | null; onClose: () => void; onMarkRead: (id: string) => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!notification) return;
    const previousFocus = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    closeButton.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [notification]);

  if (!notification) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="notification-detail-heading" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-xl border border-[#DCE3EC] bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Bell size={17} aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase text-[#2563A8]">{notificationCategoryLabels[notification.category]}</p><h2 id="notification-detail-heading" className="mt-1 break-words text-base font-bold text-[#172033]">{notification.title}</h2></div></div><button ref={closeButton} type="button" onClick={onClose} aria-label="Close notification details" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><X size={17} aria-hidden="true" /></button></div>
        <p className="mt-4 text-[10px] text-[#64748B]">{notification.date} · {notification.status === 'unread' ? 'Unread' : 'Read'}{notification.priority === 'important' ? ' · Important' : ''}</p>
        <p className="mt-3 text-sm leading-6 text-[#475569]">{notification.message}</p>
        {notification.applicationId && <div className="mt-4 rounded-lg border border-[#EEF1F5] bg-[#FCFDFE] p-3"><p className="text-[10px] text-[#64748B]">Related application</p><p className="mt-1 break-words text-xs font-semibold text-[#172033]">{notification.schemeName}</p><p className="mt-1 break-all text-[11px] text-[#64748B]">{notification.applicationId}</p></div>}
        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#EEF1F5] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => { onMarkRead(notification.id); onClose(); }} className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-[#DCE3EC] bg-white px-3 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] sm:w-auto">Mark as read</button>{notification.actionHref && notification.actionLabel && <Link href={notification.actionHref} onClick={() => onMarkRead(notification.id)} className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] sm:w-auto">{notification.actionLabel}<ArrowRight size={13} aria-hidden="true" /></Link>}</div>
      </section>
    </div>
  );
}