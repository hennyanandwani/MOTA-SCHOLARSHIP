import {
  ClipboardCheck,
  FileCheck,
  FileText,
  GraduationCap,
  LifeBuoy,
  User,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { HELP_CATEGORIES, type HelpCategoryItem } from '@/lib/helpContent';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const iconMap: Record<HelpCategoryItem['iconName'], LucideIcon> = {
  FileText,
  FileCheck,
  ClipboardCheck,
  GraduationCap,
  User,
  LifeBuoy,
};

interface HelpCategoriesProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function HelpCategories({ selectedCategory, onSelectCategory }: HelpCategoriesProps) {
  const t = useStudentTranslation();

  return (
    <section aria-labelledby="quick-help-categories-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="quick-help-categories-heading" className="text-base font-bold text-[#172033]">
            {t('Quick Help Categories')}
          </h2>
          <p className="text-xs text-[#64748B]">
            {t('Select a category to filter common questions, workflows, and guides.')}
          </p>
        </div>
        {selectedCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className="text-xs font-semibold text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
          >
            {t('Show all categories')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {HELP_CATEGORIES.map((category) => {
          const IconComponent = iconMap[category.iconName];
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : category.id)}
              aria-pressed={isSelected}
              className={`group flex min-w-0 flex-col rounded-xl border p-4 text-left transition ${
                isSelected
                  ? 'border-[#2563A8] bg-[#F4F8FC] ring-2 ring-[#2563A8]/20 shadow-sm'
                  : 'border-[#DCE3EC] bg-white hover:border-[#B8C9DC] hover:bg-[#F8FAFC]'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                    isSelected
                      ? 'bg-[#173F7A] text-white'
                      : 'bg-blue-50 text-[#173F7A] group-hover:bg-blue-100'
                  }`}
                >
                  <IconComponent size={20} aria-hidden="true" />
                </span>
                <span
                  className={`text-xs font-semibold flex items-center gap-1 ${
                    isSelected ? 'text-[#173F7A]' : 'text-slate-400 group-hover:text-[#173F7A]'
                  }`}
                >
                  {isSelected ? t('Active') : t('Explore')}
                  <ArrowRight size={13} aria-hidden="true" />
                </span>
              </div>

              <h3 className="mt-3 text-sm font-bold text-[#172033] group-hover:text-[#173F7A]">
                {t(category.title)}
              </h3>

              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#64748B]">
                {t(category.description)}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#EEF1F5] pt-2.5">
                {category.topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#475569]"
                  >
                    {t(topic)}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}