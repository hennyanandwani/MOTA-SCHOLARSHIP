import React from 'react';
import { Eye, MapPin } from 'lucide-react';
import {
  VerificationStatusBadge,
  OCRStatusBadge,
  AIMatchBadge,
  PriorityBadge,
} from './VerificationStatusBadge';
import type { VerificationRecord } from '@/lib/adminVerificationData';

type VerificationQueueProps = {
  records: VerificationRecord[];
  onSelect: (record: VerificationRecord) => void;
  onClearFilters: () => void;
};

export function VerificationQueue({
  records,
  onSelect,
  onClearFilters,
}: VerificationQueueProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#DCE3EC] bg-white p-12 text-center shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
        <p className="text-base font-semibold text-[#172033]">No documents found</p>
        <p className="mt-1 text-sm text-[#64748B]">Try adjusting your search or verification filters.</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-lg bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#123362] focus:outline-none focus:ring-2 focus:ring-[#2563A8]"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="hidden lg:block overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
              <th scope="col" className="py-3.5 pl-4 pr-2">Priority</th>
              <th scope="col" className="px-3 py-3.5">Application ID</th>
              <th scope="col" className="px-3 py-3.5">Applicant</th>
              <th scope="col" className="px-3 py-3.5">Scheme</th>
              <th scope="col" className="px-3 py-3.5">Document</th>
              <th scope="col" className="px-3 py-3.5">Uploaded</th>
              <th scope="col" className="px-3 py-3.5">OCR</th>
              <th scope="col" className="px-3 py-3.5">AI Match</th>
              <th scope="col" className="px-3 py-3.5">Status</th>
              <th scope="col" className="px-3 py-3.5">Reviewer</th>
              <th scope="col" className="py-3.5 pl-3 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F5] text-xs">
            {records.map((record) => (
              <tr
                key={record.id}
                className="transition-colors hover:bg-slate-50/80"
              >
                <td className="py-3 pl-4 pr-2 whitespace-nowrap">
                  <PriorityBadge priority={record.priority} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap font-mono font-semibold text-[#173F7A]">
                  {record.applicationId}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="font-semibold text-[#172033]">{record.applicantName}</div>
                  <div className="flex items-center gap-1 text-[10px] text-[#64748B]">
                    <MapPin size={10} className="shrink-0" />
                    <span>{record.district}, {record.state}</span>
                  </div>
                </td>
                <td className="px-3 py-3 max-w-[200px]">
                  <span className="line-clamp-2 text-[#334155]">{record.schemeName}</span>
                </td>
                <td className="px-3 py-3 max-w-[180px]">
                  <div className="font-medium text-[#172033] line-clamp-1">{record.documentName}</div>
                  <div className="text-[10px] text-[#64748B]">{record.documentType}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-[#64748B] text-[11px]">
                  {record.uploadedAt.split(' ')[0]}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <OCRStatusBadge status={record.ocrStatus} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <AIMatchBadge status={record.aiMatch} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <VerificationStatusBadge status={record.verificationStatus} />
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-[#475569] text-[11px]">
                  {record.reviewer === 'Unassigned' ? (
                    <span className="text-[#94A3B8]">—</span>
                  ) : (
                    record.reviewer
                  )}
                </td>
                <td className="py-3 pl-3 pr-4 whitespace-nowrap text-right">
                  <button
                    type="button"
                    onClick={() => onSelect(record)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#173F7A] px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#123362] focus:outline-none focus:ring-2 focus:ring-[#2563A8]"
                  >
                    <Eye size={13} aria-hidden="true" />
                    <span>Review</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}