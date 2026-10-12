import { Bell } from 'lucide-react';
import { NotificationsHeader } from '@/components/student/notifications/NotificationsHeader';

export function NotificationsCenter() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <NotificationsHeader unreadCount={0} onMarkAllRead={() => undefined} showMarkAllRead={false} />
      <section className="flex min-w-0 flex-col items-center rounded-xl border border-dashed border-[#B8C9DC] bg-white px-5 py-10 text-center" aria-labelledby="notifications-empty-heading">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563A8]"><Bell size={20} aria-hidden="true" /></span>
        <h2 id="notifications-empty-heading" className="mt-3 text-sm font-semibold text-[#172033]">Notifications are not available yet</h2>
        <p className="mt-1 max-w-sm text-xs leading-5 text-[#64748B]">This portal does not yet store notification records. Application and document statuses shown in their respective sections come from your saved account data.</p>
      </section>
    </div>
  );
}
