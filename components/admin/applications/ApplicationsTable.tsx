import React from 'react';
import { Eye, FileQuestion, RotateCcw } from 'lucide-react';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import type { AdminApplicationRecord } from '@/lib/adminData';

type ApplicationsTableProps = {
  applications: AdminApplicationRecord[];
  onSelect: (app: AdminApplicationRecord) => void;
  onClearFilters: () => void;
};

export function ApplicationsTable({
  applications,
  onSelect,
  onClearFilters,
}: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#DCE3EC] bg-white p-12 text-center shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#64748B] mb-3">
          <FileQuestion size={24} aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-[#172033]">No applications found</h3>
        <p className="mt-1 max-w-sm text-xs text-[#64748B]">
          No scholarship records matched your active search query or selected filter criteria.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#173F7A] bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173F7A]/90 focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Clear Filters</span>
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#172033]" aria-label="Applications Master Registry">
          <thead className="border-b border-[#DCE3EC] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3">Application ID</th>
              <th scope="col" className="px-3 py-3.5">Applicant</th>
              <th scope="col" className="px-3 py-3.5">Scheme</th>
              <th scope="col" className="px-3 py-3.5">Location</th>
              <th scope="col" className="px-3 py-3.5">Submitted</th>
              <th scope="col" className="px-3 py-3.5">Current Stage</th>
              <th scope="col" className="px-3 py-3.5">Verification</th>
              <th scope="col" className="px-3 py-3.5">Deficiency</th>
              <th scope="col" className="px-3 py-3.5">Status</th>
              <th scope="col" className="py-3.5 pl-3 pr-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F5]">
            {applications.map((app) => (
              <tr
                key={app.applicationId}
                className="hover:bg-[#F8FAFC]/80 transition-colors group"
              >
                {/* ID */}
                <td className="py-3.5 pl-4 pr-3 font-mono font-semibold text-[#173F7A] whitespace-nowrap">
                  {app.applicationId}
                </td>

                {/* Applicant Name & Category */}
                <td className="px-3 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#172033]">{app.applicantName}</span>
                    <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                      {app.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate max-w-[150px]">
                    {app.course}
                  </div>
                </td>

                {/* Scheme */}
                <td className="px-3 py-3.5 max-w-[200px]">
                  <p className="truncate font-medium text-[#172033]" title={app.schemeName}>
                    {app.schemeName}
                  </p>
                  <p className="text-[11px] text-[#64748B] truncate" title={app.institutionName}>
                    {app.institutionName}
                  </p>
                </td>

                {/* Location */}
                <td className="px-3 py-3.5 whitespace-nowrap text-[#64748B]">
                  <span className="font-medium text-[#172033]">{app.district}</span>, {app.state}
                </td>

                {/* Submitted */}
                <td className="px-3 py-3.5 whitespace-nowrap text-[#64748B]">
                  {app.submittedDate}
                </td>

                {/* Current Stage */}
                <td className="px-3 py-3.5 whitespace-nowrap">
                  <ApplicationStatusBadge type="stage" value={app.currentStage} size="sm" showIcon={false} />
                </td>

                {/* Verification */}
                <td className="px-3 py-3.5 whitespace-nowrap">
                  <ApplicationStatusBadge type="verification" value={app.verificationStatus} size="sm" />
                </td>

                {/* Deficiency */}
                <td className="px-3 py-3.5 whitespace-nowrap">
                  <ApplicationStatusBadge type="deficiency" value={app.deficiencyStatus} size="sm" />
                </td>

                {/* Status */}
                <td className="px-3 py-3.5 whitespace-nowrap">
                  <ApplicationStatusBadge type="status" value={app.status} size="sm" />
                </td>

                {/* Action */}
                <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelect(app)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#173F7A] shadow-xs hover:bg-[#173F7A] hover:text-white hover:border-[#173F7A] focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
                    aria-label={`Review application ${app.applicationId} for ${app.applicantName}`}
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