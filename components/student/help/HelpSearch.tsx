import { Search, X } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

interface HelpSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  totalResults: number;
  isFiltering: boolean;
}

export function HelpSearch({
  searchQuery,
  onSearchChange,
  onClearSearch,
  totalResults,
  isFiltering,
}: HelpSearchProps) {
  const t = useStudentTranslation();

  return (
    <section aria-labelledby="help-search-heading" className="w-full">
      <h2 id="help-search-heading" className="sr-only">
        {t('Search help topics')}
      </h2>
      <div className="relative flex w-full items-center">
        <span className="pointer-events-none absolute left-3.5 flex items-center text-[#64748B]">
          <Search size={18} aria-hidden="true" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('Search help topics...')}
          aria-label={t('Search help topics')}
          className="min-h-12 w-full rounded-xl border border-[#DCE3EC] bg-white pl-10 pr-10 text-sm text-[#172033] placeholder-[#94A3B8] shadow-sm transition focus:border-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label={t('Clear search query')}
            className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] transition hover:bg-slate-100 hover:text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Result feedback */}
      {isFiltering && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-[#64748B]">
          {totalResults > 0 ? (
            <p className="font-medium text-[#173F7A]">
              {totalResults} {t(totalResults === 1 ? 'help topic found' : 'help topics found')}
            </p>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              <p className="font-semibold">{t('No help topics found')}</p>
              <p className="text-[11px] text-amber-800">{t('Try a different keyword.')}</p>
            </div>
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="ml-auto text-xs font-semibold text-[#2563A8] hover:underline"
            >
              {t('Clear search')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}