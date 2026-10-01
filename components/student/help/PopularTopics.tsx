import Link from 'next/link';
import { ChevronDown, ExternalLink, HelpCircle } from 'lucide-react';
import { POPULAR_TOPICS, type PopularTopicItem } from '@/lib/helpContent';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

interface PopularTopicsProps {
  expandedTopics: string[];
  onToggleTopic: (id: string) => void;
  searchQuery?: string;
  selectedCategory?: string | null;
}

export function PopularTopics({
  expandedTopics,
  onToggleTopic,
  searchQuery = '',
  selectedCategory = null,
}: PopularTopicsProps) {
  const t = useStudentTranslation();

  // Filter popular topics based on search or category
  const filteredTopics = POPULAR_TOPICS.filter((topic) => {
    const matchesCategory =
      !selectedCategory ||
      topic.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      topic.title.toLowerCase().includes(query) ||
      topic.summary.toLowerCase().includes(query) ||
      topic.details.some((d) => d.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  if (filteredTopics.length === 0 && (searchQuery || selectedCategory)) {
    return null;
  }

  return (
    <section aria-labelledby="popular-help-topics-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#173F7A]">
          <HelpCircle size={16} aria-hidden="true" />
        </span>
        <div>
          <h2 id="popular-help-topics-heading" className="text-base font-bold text-[#172033]">
            {t('Popular Help Topics')}
          </h2>
          <p className="text-xs text-[#64748B]">
            {t('Frequently requested guidance and step-by-step application walkthroughs.')}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {filteredTopics.map((topic) => {
          const isExpanded = expandedTopics.includes(topic.id);
          const panelId = `panel-${topic.id}`;
          const buttonId = `button-${topic.id}`;

          return (
            <article
              key={topic.id}
              className={`rounded-xl border transition ${
                isExpanded
                  ? 'border-[#2563A8] bg-[#FAFCFF] shadow-sm'
                  : 'border-[#DCE3EC] bg-white hover:border-[#B8C9DC]'
              }`}
            >
              <button
                id={buttonId}
                type="button"
                onClick={() => onToggleTopic(topic.id)}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                className="flex w-full min-h-12 items-center justify-between gap-3 px-4 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-inset"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-[#EEF2F6] px-2 py-0.5 text-[10px] font-semibold text-[#173F7A]">
                      {t(topic.badgeText)}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      {t(topic.category)}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-[#172033]">
                    {t(topic.title)}
                  </h3>
                </div>

                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                    isExpanded
                      ? 'rotate-180 border-blue-200 bg-blue-50 text-[#173F7A]'
                      : 'border-[#DCE3EC] text-[#64748B]'
                  }`}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </span>
              </button>

              {isExpanded && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="border-t border-[#EEF1F5] px-4 py-4 text-xs leading-relaxed text-[#334155]"
                >
                  <p className="font-medium text-[#172033] mb-3">
                    {t(topic.summary)}
                  </p>
                  <ul className="space-y-1.5 pl-1 text-[#475569]">
                    {topic.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#173F7A]" />
                        <span>{t(detail)}</span>
                      </li>
                    ))}
                  </ul>

                  {topic.quickLink && (
                    <div className="mt-4 pt-3 border-t border-[#EEF1F5]">
                      <Link
                        href={topic.quickLink.href}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
                      >
                        {t(topic.quickLink.label)}
                        <ExternalLink size={13} aria-hidden="true" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}