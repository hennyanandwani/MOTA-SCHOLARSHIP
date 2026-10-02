import React from 'react';
import { Eye, MapPin } from 'lucide-react';
import {
  VerificationStatusBadge,
  OCRStatusBadge,
  AIMatchBadge,
  PriorityBadge,
} from './VerificationStatusBadge';
import type { VerificationRecord } from '@/lib/adminVerificationData';

type VerificationCardProps = {
  record: VerificationRecord;
  onSelect: (record: VerificationRecord) => void;
};

export function VerificationCard({ record, onSelect }: VerificationCardProps) {
  return (
    <div className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <PriorityBadge priority={record.priority} />
            <span className="text-xs font-mono font-semibold text-[#173F7A]">{record.applicationId}</span>
          </div>
          <h3 className="text-sm font-semibold text-[#172033] line-clamp-1">{record.applicantName}</h3>
          <div className="flex items-center gap-1 text-xs text-[#64748B] mt-0.5">
            <MapPin size={12} className="shrink-0" />
            <span>{record.district}, {record.state}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelect(record)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#173F7A] px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#123362] focus:outline-none focus:ring-2 focus:ring-[#2563A8] shrink-0"
        >
          <Eye size={13} aria-hidden="true" />
          Review
        </button>
      </div>

      <div className="mb-3 space-y-2 border-t border-[#DCE3EC] pt-3">
        <div>
          <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Scheme</div>
          <div className="text-xs text-[#334155] line-clamp-1">{record.schemeName}</div>
        </div>
        <div>
          <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Document</div>
          <div className="text-xs text-[#334155]">{record.documentName}</div>
          <div className="text-[10px] text-[#94A3B8]">{record.documentType}</div>
        </div>
        <div className="text-[10px] text-[#64748B]">Uploaded: {record.uploadedAt}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[#DCE3EC] pt-3">
        <div>
          <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">OCR</div>
          <OCRStatusBadge status={record.ocrStatus} />
        </div>
        <div>
          <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">AI Match</div>
          <AIMatchBadge status={record.aiMatch} />
        </div>
        <div className="col-span-2">
          <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold mb-1">Status</div>
          <VerificationStatusBadge status={record.verificationStatus} />
        </div>
      </div>
    </div>
  );
}