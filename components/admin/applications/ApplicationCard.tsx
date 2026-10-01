import React from 'react';
import { Eye, MapPin, Calendar, Building, BookOpen } from 'lucide-react';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import type { AdminApplicationRecord } from '@/lib/adminData';

type ApplicationCardProps = {
  application: AdminApplicationRecord;
  onSelect: (app: AdminApplicationRecord) => void;
};

export function ApplicationCard({ application, onSelect }: ApplicationCardProps) {
  return (
    <div className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] space-y-3.5 hover:border-[#2563A8]/40 transition-colors">
      {/* Header: ID + Status + Date */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xs font-bold text-[#173F7A]">
            {application.applicationId}
          </span>
          <p className="mt-0.5 text-sm font-semibold text-[#172033]">
            {application.applicantName}
          </p>
        </div>
        <ApplicationStatusBadge value={application.status} size="sm" />
      </div>

      {/* Scheme & Academic Details */}
      <div className="space-y-1 rounded-lg bg-[#F8FAFC] p-2.5 text-xs text-[#172033]">
        <p className="font-medium text-[#173F7A] line-clamp-1">{application.schemeName}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Building size={12} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{application.institutionName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <BookOpen size={12} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{application.course}</span>
        </div>
      </div>

      {/* Meta details */}
      <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-[#64748B]">
        <div className="flex items-center gap-1">
          <MapPin size={13} className="text-[#64748B]" aria-hidden="true" />
          <span>
            {application.district}, {application.state}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <Calendar size={13} className="text-[#64748B]" aria-hidden="true" />
          <span>Submitted {application.submittedDate}</span>
        </div>
      </div>

      {/* Workflow & Verification Status Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-[#EEF1F5] pt-2.5">
        <span className="text-[11px] text-[#64748B]">Stage:</span>
        <ApplicationStatusBadge type="stage" value={application.currentStage} size="sm" showIcon={false} />
        
        <span className="text-[11px] text-[#64748B] ml-1">Verif:</span>
        <ApplicationStatusBadge type="verification" value={application.verificationStatus} size="sm" />

        {application.deficiencyStatus !== 'None' && (
          <>
            <span className="text-[11px] text-[#64748B] ml-1">Deficiency:</span>
            <ApplicationStatusBadge type="deficiency" value={application.deficiencyStatus} size="sm" />
          </>
        )}
      </div>

      {/* Action button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => onSelect(application)}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#173F7A]/20 bg-[#173F7A]/5 hover:bg-[#173F7A]/10 text-xs font-semibold text-[#173F7A] py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
        >
          <Eye size={14} aria-hidden="true" />
          <span>Review Application</span>
        </button>
      </div>
    </div>
  );
}