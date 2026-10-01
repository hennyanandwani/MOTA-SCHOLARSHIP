import { CalendarDays, CircleCheck } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const activity = [
  { date: '20 Sep 2026', text: 'Academic information updated' },
  { date: '18 Sep 2026', text: 'ST Certificate information added' },
  { date: '15 Sep 2026', text: 'Contact information updated' },
];

export function ProfileActivity() {
  const t = useStudentTranslation();
  return (
    <section aria-labelledby="profile-activity-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <h2 id="profile-activity-heading" className="text-sm font-semibold text-[#172033]">{t('Profile Activity')}</h2>
      <ol className="mt-4 space-y-0">
        {activity.map((item, index) => (
          <li key={item.date} className="relative flex min-w-0 gap-3 pb-4 last:pb-0">
            {index < activity.length - 1 && <span aria-hidden="true" className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px bg-[#DCE3EC]" />}
            <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C9D8E8] bg-white text-[#2563A8]"><CircleCheck size={14} aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-xs font-semibold text-[#334155]">{t(item.text)}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#64748B]"><CalendarDays size={12} aria-hidden="true" />{t(item.date)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}