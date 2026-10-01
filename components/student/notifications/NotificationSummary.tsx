import { Bell, CheckCircle2, Star } from 'lucide-react';
import type { NotificationItem } from '@/lib/notifications';

export function NotificationSummary({ notifications }: { notifications: NotificationItem[] }) {
  const cards = [
    { label: 'All Notifications', value: notifications.length, Icon: Bell, tone: 'bg-blue-50 text-[#2563A8]' },
    { label: 'Unread', value: notifications.filter((item) => item.status === 'unread').length, Icon: CheckCircle2, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Important', value: notifications.filter((item) => item.priority === 'important').length, Icon: Star, tone: 'bg-amber-50 text-[#80520B]' },
  ];
  return <section aria-label="Notification summary" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">{cards.map(({ label, value, Icon, tone }) => <article key={label} className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-3.5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-4"><div className="flex min-w-0 items-center gap-2"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={16} aria-hidden="true" /></span><p className="min-w-0 text-[11px] font-medium leading-4 text-[#64748B]">{label}</p></div><p className="mt-2 text-xl font-bold text-[#172033]">{value}</p></article>)}</section>;
}