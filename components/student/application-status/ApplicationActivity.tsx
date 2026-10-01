import Link from 'next/link';
import { Bell, CalendarDays, CheckCircle2, Clock3, MessageSquareText } from 'lucide-react';
import type { ActivityEvent, Communication } from '@/lib/applicationTracking';

export function ApplicationActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <section aria-labelledby="application-activity-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-center gap-2 border-b border-[#EEF1F5] pb-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Clock3 size={16} aria-hidden="true" /></span><div><h2 id="application-activity-heading" className="text-sm font-semibold text-[#172033]">Application Activity</h2><p className="mt-1 text-[11px] text-[#64748B]">Recent workflow updates</p></div></div>
      <ol className="mt-4">
        {events.map((event, index) => (
          <li id={event.id} key={event.id} className="relative flex min-w-0 gap-3 pb-4 last:pb-0">
            {index < events.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px bg-[#DCE3EC]" aria-hidden="true" />}
            <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C9D8E8] bg-white text-[#2563A8]"><CheckCircle2 size={13} aria-hidden="true" /></span>
            <div className="min-w-0 flex-1"><div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h3 className="break-words text-xs font-semibold text-[#172033]">{event.title}</h3><span className="inline-flex items-center gap-1 text-[10px] text-[#64748B]"><CalendarDays size={12} aria-hidden="true" />{event.date}</span></div><p className="mt-1 text-[11px] leading-5 text-[#64748B]">{event.description}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function CommunicationCard({ communications }: { communications: Communication[] }) {
  return (
    <section aria-labelledby="recent-communications-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-center gap-2 border-b border-[#EEF1F5] pb-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Bell size={16} aria-hidden="true" /></span><div><h2 id="recent-communications-heading" className="text-sm font-semibold text-[#172033]">Recent Communications</h2><p className="mt-1 text-[11px] text-[#64748B]">Application notices</p></div></div>
      <ul className="divide-y divide-[#EEF1F5]">
        {communications.map((communication) => (
          <li key={communication.id} className="flex min-w-0 flex-col gap-2 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="flex min-w-0 items-start gap-2.5"><MessageSquareText size={15} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="break-words text-xs font-semibold text-[#172033]">{communication.title}</h3><span className="text-[10px] text-[#64748B]">{communication.date}</span></div><p className="mt-1 text-[11px] leading-5 text-[#64748B]">{communication.message}</p></div></div>
            <Link href={`#${communication.activityId}`} className="inline-flex min-h-9 w-fit shrink-0 items-center rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">View</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}