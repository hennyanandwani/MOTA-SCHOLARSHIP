import { Clock, Trash2, ArrowRight } from 'lucide-react';
import { POPULAR_TOPICS, FAQ_DATA } from '@/lib/helpContent';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

interface RecentlyViewedProps {
  recentTopicIds: string[];
  onSelectTopic: (id: string) => void;
  onClearHistory: () => void;
}

export function RecentlyViewed({
  recentTopicIds,
  onSelectTopic,
  onClearHistory,
}: RecentlyViewedProps) {
  const t = useStudentTranslation();

  if (recentTopicIds.length === 0) return null;

  const resolvedItems = recentTopicIds
    .map((id) => {
      const pop = POPULAR_TOPICS.find((p) => p.id === id);
      if (pop) {
        return { id: pop.id, title: pop.title, category: pop.category, type: 'Popular' };
      }
      const faq = FAQ_DATA.find((f) => f.id === id);
      if (faq) {
        return { id: faq.id, title: faq.question, category: faq.categoryName, type: 'FAQ' };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (resolvedItems.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-[#173F7A]" aria-hidden="true" />
          <h2 id="recently-viewed-heading" className="text-xs font-bold uppercase tracking-wider text-[#172033]">
            {t('Recently Viewed Topics')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <Trash2 size={11} aria-hidden="true" />
          {t('Clear history')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {resolvedItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTopic(item.id)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE3EC] bg-white px-3 py-1.5 text-xs text-[#172033] shadow-2xs transition hover:border-[#2563A8] hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
          >
            <span className="max-w-[240px] truncate font-medium text-left">
              {t(item.title)}
            </span>
            <ArrowRight size={12} className="shrink-0 text-[#2563A8]" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}