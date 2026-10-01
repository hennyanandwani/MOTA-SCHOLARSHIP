import type { NotificationItem } from '@/lib/notifications';
import { NotificationCard } from '@/components/student/notifications/NotificationCard';
import { NotificationEmptyState } from '@/components/student/notifications/NotificationEmptyState';

export function NotificationList({ notifications, totalNotifications, onOpen, onClear }: { notifications: NotificationItem[]; totalNotifications: number; onOpen: (notification: NotificationItem) => void; onClear: () => void }) {
  if (notifications.length === 0) return <NotificationEmptyState zeroNotifications={totalNotifications === 0} onClear={onClear} />;
  return (
    <section aria-label="Notification list" className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-[#172033]">Earlier</h2><p className="text-[11px] text-[#64748B]">Showing {notifications.length} of {totalNotifications}</p></div>
      <div className="grid min-w-0 gap-3">{notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} onOpen={onOpen} />)}</div>
    </section>
  );
}