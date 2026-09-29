import { RotateCcw } from 'lucide-react';
import type { AcademicLevel, SchemeStatus, SchemeType } from '@/lib/schemes';

export type SchemeTypeFilter = SchemeType | 'All';
export type AcademicLevelFilter = AcademicLevel | 'All';
export type SchemeStatusFilter = SchemeStatus | 'All';
export type SchemeSort = 'Deadline' | 'Recently Added' | 'Scheme Name';

type SchemeFiltersProps = {
  schemeType: SchemeTypeFilter;
  academicLevel: AcademicLevelFilter;
  status: SchemeStatusFilter;
  sortBy: SchemeSort;
  onSchemeTypeChange: (value: SchemeTypeFilter) => void;
  onAcademicLevelChange: (value: AcademicLevelFilter) => void;
  onStatusChange: (value: SchemeStatusFilter) => void;
  onSortByChange: (value: SchemeSort) => void;
  onClear: () => void;
};

const selectClassName = 'mt-1.5 h-10 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';

export function SchemeFilters({
  schemeType,
  academicLevel,
  status,
  sortBy,
  onSchemeTypeChange,
  onAcademicLevelChange,
  onStatusChange,
  onSortByChange,
  onClear,
}: SchemeFiltersProps) {
  return (
    <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="min-w-0">
        <label htmlFor="scheme-type" className="text-xs font-medium text-[#475569]">Scheme Type</label>
        <select id="scheme-type" value={schemeType} onChange={(event) => onSchemeTypeChange(event.target.value as SchemeTypeFilter)} className={selectClassName}>
          <option>All</option>
          <option>Scholarship</option>
          <option>Fellowship</option>
        </select>
      </div>

      <div className="min-w-0">
        <label htmlFor="academic-level" className="text-xs font-medium text-[#475569]">Academic Level</label>
        <select id="academic-level" value={academicLevel} onChange={(event) => onAcademicLevelChange(event.target.value as AcademicLevelFilter)} className={selectClassName}>
          <option>All</option>
          <option>Pre-Matric</option>
          <option>Post-Matric</option>
          <option>Undergraduate</option>
          <option>Postgraduate</option>
          <option>Research</option>
        </select>
      </div>

      <div className="min-w-0">
        <label htmlFor="scheme-status" className="text-xs font-medium text-[#475569]">Status</label>
        <select id="scheme-status" value={status} onChange={(event) => onStatusChange(event.target.value as SchemeStatusFilter)} className={selectClassName}>
          <option>All</option>
          <option>Open</option>
          <option>Upcoming</option>
          <option>Closed</option>
        </select>
      </div>

      <div className="min-w-0">
        <label htmlFor="scheme-sort" className="text-xs font-medium text-[#475569]">Sort By</label>
        <select id="scheme-sort" value={sortBy} onChange={(event) => onSortByChange(event.target.value as SchemeSort)} className={selectClassName}>
          <option>Deadline</option>
          <option>Recently Added</option>
          <option>Scheme Name</option>
        </select>
      </div>

      <button type="button" onClick={onClear} className="inline-flex min-h-10 items-center justify-center gap-2 justify-self-start rounded-lg px-2 text-xs font-semibold text-[#2563A8] transition hover:bg-blue-50 sm:col-span-2 xl:col-span-4">
        <RotateCcw size={14} aria-hidden="true" />
        Clear filters
      </button>
    </div>
  );
}