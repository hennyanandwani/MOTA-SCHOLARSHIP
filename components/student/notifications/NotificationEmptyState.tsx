import { Bell, Search } from 'lucide-react';

export function NotificationEmptyState({ zeroNotifications = false, onClear }: { zeroNotifications?: boolean; onClear: () => void }) {
  const Icon = zeroNotifications ? Bell : Search;
  return (
    <section className="flex min-w-0 flex-col items-center rounded-xl border border-dashed border-[#B8C9DC] bg-white px-5 py-10 text-center" aria-labelledby="notifications-empty-heading">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563A8]"><Icon size={20} aria-hidden="true" /></span>
      <h3 id="notifications-empty-heading" className="mt-3 text-sm font-semibold text-[#172033]">{zeroNotifications ? 'You’re all caught up' : 'No notifications found'}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#64748B]">{zeroNotifications ? 'You don’t have any notifications right now.' : 'Try changing your search or notification filters.'}</p>
      {!zeroNotifications && <button type="button" onClick={onClear} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Clear Filters</button>}
    </section>
  );
}