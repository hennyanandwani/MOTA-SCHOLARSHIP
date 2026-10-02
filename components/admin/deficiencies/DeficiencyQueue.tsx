import React from 'react';
import { DeficiencyStatusBadge, SeverityBadge, ResponseStatusBadge } from './DeficiencyStatusBadge';
import type { DeficiencyRecord } from '@/lib/adminDeficiencyData';
import { ExternalLink } from 'lucide-react';

type DeficiencyQueueProps = {
  records: DeficiencyRecord[];
  onReview: (record: DeficiencyRecord) => void;
};

export function DeficiencyQueue({ records, onReview }: DeficiencyQueueProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DCE3EC] bg-white py-12">
        <p className="text-sm text-[#64748B]">No deficiencies found</p>
        <p className="mt-1 text-xs text-[#94A3B8]">Try adjusting your filters or search.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F6F8FB] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            <tr>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Application ID</th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Scheme</th>
              <th className="px-4 py-3">Deficiency</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE3EC]">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-[#F8FAFC]">
                <td className="px-4 py-3">
                  <SeverityBadge severity={record.severity} />
                </td>
                <td className="px-4 py-3 font-medium text-[#173F7A]">
                  {record.applicationId}
                </td>
                <td className="px-4 py-3">
                  <div className="text-[#172033] font-medium">{record.applicantName}</div>
                  <div className="text-[11px] text-[#64748B]">{record.district}, {record.state}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="truncate block max-w-[150px] text-[12px]" title={record.scheme}>
                    {record.scheme}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#172033]">
                  <div className="font-medium text-[12px]">{record.deficiency}</div>
                  <div className="text-[11px] text-[#64748B]">{record.deficiencyType}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <DeficiencyStatusBadge status={record.status} />
                    <ResponseStatusBadge status={record.responseStatus} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onReview(record)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#173F7A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2563A8]"
                  >
                    Review
                    <ExternalLink size={12} />
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
