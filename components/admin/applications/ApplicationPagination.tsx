import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ApplicationPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function ApplicationPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: ApplicationPaginationProps) {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-[#64748B] pt-2">
      {/* Summary Info */}
      <div>
        Showing <strong className="font-semibold text-[#172033]">{startItem}</strong> to{' '}
        <strong className="font-semibold text-[#172033]">{endItem}</strong> of{' '}
        <strong className="font-semibold text-[#172033]">{totalItems}</strong> applications
      </div>

      {/* Controls */}
      <nav aria-label="Applications pagination" className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className="inline-flex items-center gap-1 rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 font-medium text-[#172033] hover:bg-[#F8FAFC] disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          <span>Previous</span>
        </button>

        {/* Numbered Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page) => {
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${page}`}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563A8] ${
                  isActive
                    ? 'bg-[#173F7A] text-white shadow-xs'
                    : 'border border-[#DCE3EC] bg-white text-[#172033] hover:bg-[#F8FAFC]'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className="inline-flex items-center gap-1 rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 font-medium text-[#172033] hover:bg-[#F8FAFC] disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
        >
          <span>Next</span>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}