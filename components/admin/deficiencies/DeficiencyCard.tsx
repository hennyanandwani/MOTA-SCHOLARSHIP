import React from 'react';
import { DeficiencyStatusBadge, SeverityBadge } from './DeficiencyStatusBadge';
import type { DeficiencyRecord } from '@/lib/adminDeficiencyData';
import { Calendar, MapPin } from 'lucide-react';

type DeficiencyCardProps = {
  record: DeficiencyRecord;
  onReview: (record: DeficiencyRecord) => void;
};

export function DeficiencyCard({ record, onReview }: DeficiencyCardProps) {
  return (
    <div className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] lg:hidden">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            {record.applicationId}
          </div>
          <div className="text-sm font-bold text-[#172033]">{record.applicantName}</div>
        </div>
        <SeverityBadge severity={record.severity} />
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="text-xs text-[#172033] font-medium leading-tight">
          {record.deficiency}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <MapPin size={12} />
          {record.district}, {record.state}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Calendar size={12} />
          Deadline: {record.cureDeadline}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
        <DeficiencyStatusBadge status={record.status} />
        <button
          onClick={() => onReview(record)}
          className="text-xs font-bold text-[#2563A8] hover:underline"
        >
          Review Details
        </button>
      </div>
    </div>
  );
}
