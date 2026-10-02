import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { VerificationStatus, AIMatchStatus, VerificationPriority, VerificationRecord } from '@/lib/adminVerificationData';

export type VerificationFilterState = {
  searchQuery: string;
  verificationStatus: VerificationStatus | 'all';
  aiMatch: AIMatchStatus | 'all';
  documentType: string;
  schemeId: string;
  state: string;
  priority: VerificationPriority | 'all';
  sortBy: 'newest' | 'oldest' | 'priority-high' | 'priority-low';
};

type VerificationFiltersProps = {
  filters: VerificationFilterState;
  onFilterChange: <K extends keyof VerificationFilterState>(key: K, value: VerificationFilterState[K]) => void;
  onClear: () => void;
  filteredCount: number;
  totalCount: number;
  records: VerificationRecord[];
};

export function VerificationFilters({ filters, onFilterChange, onClear, filteredCount, totalCount, records }: VerificationFiltersProps) {
  const inputCls = "h-10 w-full rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#172033] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100";
  
  const documentTypes = Array.from(new Set(records.map(r => r.documentType))).sort();
  const schemes = Array.from(new Set(records.map(r => r.schemeName))).sort();
  const states = Array.from(new Set(records.map(r => r.state))).sort();
  
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 min-w-0">
          <label htmlFor="verif-search" className="sr-only">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              id="verif-search"
              type="search"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              placeholder="Search application, applicant, document or scheme..."
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>
        
        <div className="w-full md:w-36">
          <label htmlFor="verif-status" className="mb-1 block text-[11px] font-semibold text-[#475569]">Status</label>
          <select
            id="verif-status"
            value={filters.verificationStatus}
            onChange={(e) => onFilterChange('verificationStatus', e.target.value as VerificationStatus | 'all')}
            className={inputCls}
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        
        <div className="w-full md:w-36">
          <label htmlFor="ai-match" className="mb-1 block text-[11px] font-semibold text-[#475569]">AI Match</label>
          <select
            id="ai-match"
            value={filters.aiMatch}
            onChange={(e) => onFilterChange('aiMatch', e.target.value as AIMatchStatus | 'all')}
            className={inputCls}
          >
            <option value="all">All Results</option>
            <option value="Match">Match</option>
            <option value="Partial Match">Partial Match</option>
            <option value="Mismatch">Mismatch</option>
            <option value="Unable to Compare">Unable to Compare</option>
          </select>
        </div>
        
        <div className="w-full md:w-36">
          <label htmlFor="doc-type" className="mb-1 block text-[11px] font-semibold text-[#475569]">Doc Type</label>
          <select
            id="doc-type"
            value={filters.documentType}
            onChange={(e) => onFilterChange('documentType', e.target.value)}
            className={inputCls}
          >
            <option value="">All Types</option>
            {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        
        <div className="w-full md:w-32">
          <label htmlFor="sort-by" className="mb-1 block text-[11px] font-semibold text-[#475569]">Sort By</label>
          <select
            id="sort-by"
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value as VerificationFilterState['sortBy'])}
            className={inputCls}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority-high">Highest Priority</option>
            <option value="priority-low">Lowest Priority</option>
          </select>
        </div>
        
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-4 text-sm font-medium text-[#475569] transition-colors hover:bg-slate-50 hover:text-[#172033]"
        >
          <RotateCcw size={16} />
          <span>Clear</span>
        </button>
      </div>
      
      <div className="flex items-center justify-between border-t border-[#DCE3EC] pt-3 text-[11px] text-[#64748B]">
        <span>Showing {filteredCount} of {totalCount} documents</span>
      </div>
    </div>
  );
}