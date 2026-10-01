import Link from 'next/link';
import { ChevronDown, ExternalLink, HelpCircle, Info } from 'lucide-react';
import { FAQ_DATA, HELP_CATEGORIES, type FAQItem } from '@/lib/helpContent';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

interface HelpFAQProps {
  expandedFaqs: string[];
  onToggleFaq: (id: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  searchQuery: string;
}

export function HelpFAQ({
  expandedFaqs,
  onToggleFaq,
  selectedCategory,
  onSelectCategory,
  searchQuery,
}: HelpFAQProps) {
  const t = useStudentTranslation();

  const query = searchQuery.trim().toLowerCase();

  const filteredFaqs = FAQ_DATA.filter((faq) => {
    const matchesCategory = !selectedCategory || faq.categoryId === selectedCategory;
    const matchesSearch =
      !query ||
      faq.question.toLowerCase().includes(query) ||
      faq.categoryName.toLowerCase().includes(query) ||
      faq.answer.some((ans) => ans.toLowerCase().includes(query)) ||
      (faq.note && faq.note.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#173F7A]">
            <HelpCircle size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 id="faq-heading" className="text-base font-bold text-[#172033]">
              {t('Frequently Asked Questions')}
            </h2>
            <p className="text-xs text-[#64748B]">
              {t('Clear answers regarding rules, timelines, document compliance, and verification.')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#DCE3EC] pb-3">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            selectedCategory === null
              ? 'bg-[#173F7A] text-white shadow-xs'
              : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#172033]'
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]`}
        >
          {t('All Questions')} ({FAQ_DATA.length})
        </button>
        {HELP_CATEGORIES.map((cat) => {
          const count = FAQ_DATA.filter((f) => f.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isSelected
                  ? 'bg-[#173F7A] text-white shadow-xs'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#172033]'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]`}
            >
              {t(cat.title)} ({count})
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion List */}
      {filteredFaqs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DCE3EC] bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#172033]">
            {t('No FAQs found matching your criteria.')}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            {t('Try searching with different terms or select "All Questions".')}
          </p>
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className="mt-3 inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#173F7A] hover:bg-blue-100"
          >
            {t('Reset category filters')}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqs.includes(faq.id);
            const panelId = `faq-panel-${faq.id}`;
            const buttonId = `faq-btn-${faq.id}`;

            return (
              <div
                key={faq.id}
                className={`rounded-xl border transition ${
                  isExpanded
                    ? 'border-[#2563A8] bg-[#FAFCFF] shadow-xs'
                    : 'border-[#DCE3EC] bg-white hover:border-[#B8C9DC]'
                }`}
              >
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => onToggleFaq(faq.id)}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  className="flex w-full min-h-12 items-center justify-between gap-3 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-inset"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                      {t(faq.categoryName)}
                    </span>
                    <h3 className="text-sm font-semibold text-[#172033]">
                      {t(faq.question)}
                    </h3>
                  </div>

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                      isExpanded
                        ? 'rotate-180 border-blue-200 bg-blue-50 text-[#173F7A]'
                        : 'border-[#DCE3EC] text-[#64748B]'
                    }`}
                  >
                    <ChevronDown size={15} aria-hidden="true" />
                  </span>
                </button>

                {isExpanded && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="border-t border-[#EEF1F5] px-4 py-3.5 text-xs leading-relaxed text-[#334155]"
                  >
                    <div className="space-y-2 text-[#475569]">
                      {faq.answer.map((para, i) => (
                        <p key={i}>{t(para)}</p>
                      ))}
                    </div>

                    {faq.note && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                        <Info size={14} className="shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
                        <span>{t(faq.note)}</span>
                      </div>
                    )}

                    {faq.link && (
                      <div className="mt-3 pt-2 border-t border-[#EEF1F5]">
                        <Link
                          href={faq.link.href}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
                        >
                          {t(faq.link.label)}
                          <ExternalLink size={12} aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}