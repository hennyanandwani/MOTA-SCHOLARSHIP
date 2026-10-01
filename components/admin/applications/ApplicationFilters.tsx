import React from 'react';
import { Search, X, RotateCcw, Filter } from 'lucide-react';
import type {
  ApplicationStatus,
  WorkflowStage,
  VerificationStatus,
  DeficiencyStatus,
} from '@/lib/adminData';

export type FilterState = {
  searchQuery: string;
  status: string;
  currentStage: string;
  verificationStatus: string;
  deficiencyStatus: string;
  scheme: string;
  state: string;
};

type ApplicationFiltersProps = {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearFilters: () => void;
  schemeOptions: { id: string; name: string }[];
  stateOptions: string[];
  filteredCount: number;
  totalCount: number;
};

export function ApplicationFilters({
  filters,
  onFilterChange,
  onClearFilters,
  schemeOptions,
  stateOptions,
  filteredCount,
  totalCount,
}: ApplicationFiltersProps) {
  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.status !== 'all' ||
    filters.currentStage !== 'all' ||
    filters.verificationStatus !== 'all' ||
    filters.deficiencyStatus !== 'all' ||
    filters.scheme !== 'all' ||
    filters.state !== 'all';

  return (
    <div className="rounded-xl border border-[#DCE3EC] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <label htmlFor="search-applications" className="sr-only">
            Search applications by ID, name, scheme, state, or district
          </label>
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="search-applications"
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            placeholder="Search by Application ID, Name, Scheme, State, District..."
            className="w-full rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] py-2.5 pl-10 pr-9 text-xs text-[#172033] placeholder:text-[#64748B] focus:border-[#2563A8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563A8]/20 transition-colors"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFilterChange('searchQuery', '')}
              aria-label="Clear search input"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#172033] p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-[#2563A8]"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Clear Filters button & count summary */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-medium text-[#64748B]">
            Showing <strong className="font-semibold text-[#172033]">{filteredCount}</strong> of{' '}
            <span className="text-[#172033]">{totalCount}</span> applications
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE3EC] bg-white px-3 py-1.5 text-xs font-semibold text-[#173F7A] hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 border-t border-[#EEF1F5] pt-3.5">
        {/* Status Filter */}
        <div>
          <label htmlFor="filter-status" className="block text-[11px] font-medium text-[#64748B] mb-1">
            Application Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 text-xs text-[#172033] focus:border-[#2563A8] focus:outline-none focus:ring-1 focus:ring-[#2563A8]"
          >
            <option value="all">All Statuses</option>
            <option value="Under Review">Under Review</option>
            <option value="Action Required">Action Required</option>
            <option value="Verified">Verified</option>
            <option value="Screened">Screened</option>
            <option value="Selected">Selected</option>
            <option value="Sanctioned">Sanctioned</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Current Stage Filter */}
        <div>
          <label htmlFor="filter-stage" className="block text-[11px] font-medium text-[#64748B] mb-1">
            Current Stage
          </label>
          <select
            id="filter-stage"
            value={filters.currentStage}
            onChange={(e) => onFilterChange('currentStage', e.target.value)}
            className="w-full rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 text-xs text-[#172033] focus:border-[#2563A8] focus:outline-none focus:ring-1 focus:ring-[#2563A8]"
          >
            <option value="all">All Stages</option>
            <option value="Submitted">1. Submitted</option>
            <option value="Verification">2. Verification</option>
            <option value="Scrutiny">3. Scrutiny</option>
            <option value="Screening">4. Screening</option>
            <option value="Selection">5. Selection</option>
            <option value="Disbursement">6. Disbursement</option>
          </select>
        </div>

        {/* Verification Status */}
        <div>
          <label htmlFor="filter-verification" className="block text-[11px] font-medium text-[#64748B] mb-1">
            Verification
          </label>
          <select
            id="filter-verification"
            value={filters.verificationStatus}
            onChange={(e) => onFilterChange('verificationStatus', e.target.value)}
            className="w-full rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 text-xs text-[#172033] focus:border-[#2563A8] focus:outline-none focus:ring-1 focus:ring-[#2563A8]"
          >
            <option value="all">All Verification</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Verified">Verified</option>
            <option value="Discrepancy Flagged">Discrepancy Flagged</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        {/* Deficiency Status */}
        <div>
          <label htmlFor="filter-deficiency" className="block text-[11px] font-medium text-[#64748B] mb-1">
            Deficiency
          </label>
          <select
            id="filter-deficiency"
            value={filters.deficiencyStatus}
            onChange={(e) => onFilterChange('deficiencyStatus', e.target.value)}
            className="w-full rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 text-xs text-[#172033] focus:border-[#2563A8] focus:outline-none focus:ring-1 focus:ring-[#2563A8]"
          >
            <option value="all">All Deficiency</option>
            <option value="None">None</option>
            <option value="Notice Issued">Notice Issued</option>
            <option value="Student Resubmitted">Student Resubmitted</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>

        {/* Scheme Filter */}
        <div>
          <label htmlFor="filter-scheme" className="block text-[11px] font-medium text-[#64748B] mb-1">
            Scheme
          </label>
          <select
            id="filter-scheme"
            value={filters.scheme}
            onChange={(e) => onFilterChange('scheme', e.target.value)}
            className="w-full rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 text-xs text-[#172033] focus:border-[#2563A8] focus:outline-none focus:ring-1 focus:ring-[#2563A8]"
          >
            <option value="all">All Schemes</option>
            {schemeOptions.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </select>
        </div>

        {/* State Filter */}
        <div>
          <label htmlFor="filter-state" className="block text-[11px] font-medium text-[#64748B] mb-1">
            State / UT
          </label>
          <select
            id="filter-state"
            value={filters.state}
            onChange={(e) => onFilterChange('state', e.target.value)}
            className="w-full rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 text-xs text-[#172033] focus:border-[#2563A8] focus:outline-none focus:ring-1 focus:ring-[#2563A8]"
          >
            <option value="all">All States</option>
            {stateOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}