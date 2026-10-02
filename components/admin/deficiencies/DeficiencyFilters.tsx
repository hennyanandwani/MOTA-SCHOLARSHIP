import React from 'react';
import { Search, X } from 'lucide-react';
import type { DeficiencyStatus, DeficiencySeverity, DeficiencyType } from '@/lib/adminDeficiencyData';

export type DeficiencyFiltersState = {
  search: string;
  status: DeficiencyStatus | 'all';
  severity: DeficiencySeverity | 'all';
  type: DeficiencyType | 'all';
  scheme: string;
  state: string;
  sortBy: 'newest' | 'oldest' | 'severity-high' | 'deadline-nearest';
};

type DeficiencyFiltersProps = {
  filters: DeficiencyFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<DeficiencyFiltersState>>;
  totalCount: number;
  filteredCount: number;
};

export function DeficiencyFilters({ filters, setFilters, totalCount, filteredCount }: DeficiencyFiltersProps) {
  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      severity: 'all',
      type: 'all',
      scheme: '',
      state: '',
      sortBy: 'newest',
    });
  };

  return (
    <div className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={16} />
          <input
            type="text"
            placeholder="Search Application..."
            className="w-full rounded-lg border border-[#DCE3EC] py-2 pl-10 pr-4 text-sm outline-none focus:border-[#2563A8] focus:ring-1"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>

        <select
          className="rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-sm outline-none"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any }))}
        >
          <option value="all">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Notice Sent">Notice Sent</option>
          <option value="Awaiting Response">Awaiting Response</option>
          <option value="Resubmitted">Resubmitted</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          className="rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-sm outline-none"
          value={filters.severity}
          onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value as any }))}
        >
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          className="rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-sm outline-none"
          value={filters.sortBy}
          onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as any }))}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="severity-high">Highest Severity</option>
        </select>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-[#64748B]">
          Showing <strong>{filteredCount}</strong> of {totalCount}
        </span>
        <button onClick={clearFilters} className="text-xs font-medium text-[#2563A8] hover:underline flex items-center gap-1">
          <X size={14} /> Clear Filters
        </button>
      </div>
    </div>
  );
}
