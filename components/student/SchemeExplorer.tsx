'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { schemes } from '@/lib/schemes';
import type { Scheme } from '@/lib/schemes';
import { SchemeCard } from '@/components/student/SchemeCard';
import { SchemeFilters } from '@/components/student/SchemeFilters';
import type {
  AcademicLevelFilter,
  SchemeSort,
  SchemeStatusFilter,
  SchemeTypeFilter,
} from '@/components/student/SchemeFilters';
import { SchemeSearch } from '@/components/student/SchemeSearch';

const pageSize = 8;

function compareSchemes(first: Scheme, second: Scheme, sortBy: SchemeSort) {
  if (sortBy === 'Scheme Name') {
    return first.name.localeCompare(second.name);
  }

  if (sortBy === 'Recently Added') {
    return second.addedDate.localeCompare(first.addedDate);
  }

  return first.deadlineDate.localeCompare(second.deadlineDate);
}

export function SchemeExplorer() {
  const [query, setQuery] = useState('');
  const [schemeType, setSchemeType] = useState<SchemeTypeFilter>('All');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevelFilter>('All');
  const [status, setStatus] = useState<SchemeStatusFilter>('All');
  const [sortBy, setSortBy] = useState<SchemeSort>('Deadline');
  const [page, setPage] = useState(1);

  const filteredSchemes = schemes
    .filter((scheme) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${scheme.name} ${scheme.type} ${scheme.academicLevel} ${scheme.description}`
          .toLowerCase()
          .includes(normalizedQuery);

      return (
        matchesQuery &&
        (schemeType === 'All' || scheme.type === schemeType) &&
        (academicLevel === 'All' || scheme.academicLevel === academicLevel) &&
        (status === 'All' || scheme.status === status)
      );
    })
    .sort((first, second) => compareSchemes(first, second, sortBy));

  const pageCount = Math.ceil(filteredSchemes.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount, 1));
  const pageStart = (currentPage - 1) * pageSize;
  const pageSchemes = filteredSchemes.slice(pageStart, pageStart + pageSize);
  const firstResult = filteredSchemes.length === 0 ? 0 : pageStart + 1;
  const lastResult = Math.min(pageStart + pageSize, filteredSchemes.length);

  function clearFilters() {
    setQuery('');
    setSchemeType('All');
    setAcademicLevel('All');
    setStatus('All');
    setSortBy('Deadline');
    setPage(1);
  }

  return (
    <>
      <section aria-label="Search and filter schemes" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
        <SchemeSearch value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
        <SchemeFilters
          schemeType={schemeType}
          academicLevel={academicLevel}
          status={status}
          sortBy={sortBy}
          onSchemeTypeChange={(value) => { setSchemeType(value); setPage(1); }}
          onAcademicLevelChange={(value) => { setAcademicLevel(value); setPage(1); }}
          onStatusChange={(value) => { setStatus(value); setPage(1); }}
          onSortByChange={(value) => { setSortBy(value); setPage(1); }}
          onClear={clearFilters}
        />
      </section>

      <section aria-label="Scheme results" className="mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[#64748B]" aria-live="polite">
            Showing {firstResult}–{lastResult} of {filteredSchemes.length} schemes
          </p>
          <p className="text-[11px] text-[#64748B]">Prototype sample records</p>
        </div>

        {pageSchemes.length > 0 ? (
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pageSchemes.map((scheme) => <SchemeCard key={scheme.id} scheme={scheme} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-[#DCE3EC] bg-white px-5 py-10 text-center shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">
              <SearchX size={18} aria-hidden="true" />
            </span>
            <h2 className="mt-3 text-base font-semibold text-[#172033]">No schemes found</h2>
            <p className="mt-1 text-xs text-[#64748B]">Try changing your search or filters.</p>
            <button type="button" onClick={clearFilters} className="mt-4 rounded-lg bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#123362]">
              Clear Filters
            </button>
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="Scheme result pages" className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#64748B]">Page {currentPage} of {pageCount}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#DCE3EC] px-3 text-xs font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50">
                <ChevronLeft size={14} aria-hidden="true" />Previous
              </button>
              <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#DCE3EC] px-3 text-xs font-medium text-[#334155] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50">
                Next<ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}
      </section>
    </>
  );
}