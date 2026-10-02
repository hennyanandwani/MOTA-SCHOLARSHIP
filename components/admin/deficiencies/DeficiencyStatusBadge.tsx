import React from 'react';
import type { DeficiencyStatus, DeficiencySeverity, NoticeStatus, ResponseStatus } from '@/lib/adminDeficiencyData';

type StatusBadgeProps = { status: DeficiencyStatus };
export function DeficiencyStatusBadge({ status }: StatusBadgeProps) {
  const map: Record<DeficiencyStatus, { cls: string; label: string }> = {
    Open: { cls: 'bg-slate-100 text-slate-700 ring-slate-200', label: 'Open' },
    'Notice Sent': { cls: 'bg-blue-50 text-blue-700 ring-blue-200', label: 'Notice Sent' },
    'Awaiting Response': { cls: 'bg-amber-50 text-amber-700 ring-amber-200', label: 'Awaiting Response' },
    Resubmitted: { cls: 'bg-purple-50 text-purple-700 ring-purple-200', label: 'Resubmitted' },
    'Under Review': { cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200', label: 'Under Review' },
    Resolved: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'Resolved' },
    Escalated: { cls: 'bg-orange-50 text-orange-700 ring-orange-200', label: 'Escalated' },
    Rejected: { cls: 'bg-red-50 text-red-700 ring-red-200', label: 'Rejected' },
  };
  const { cls, label } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

type SeverityBadgeProps = { severity: DeficiencySeverity };
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const map: Record<DeficiencySeverity, { cls: string }> = {
    Critical: { cls: 'bg-red-50 text-red-700 ring-red-200' },
    High: { cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
    Medium: { cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    Low: { cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${map[severity].cls}`}>
      {severity}
    </span>
  );
}

type NoticeStatusBadgeProps = { status: NoticeStatus };
export function NoticeStatusBadge({ status }: NoticeStatusBadgeProps) {
  const map: Record<NoticeStatus, { cls: string }> = {
    Draft: { cls: 'bg-slate-50 text-slate-600 ring-slate-200' },
    Sent: { cls: 'bg-blue-50 text-blue-600 ring-blue-200' },
    Delivered: { cls: 'bg-indigo-50 text-indigo-600 ring-indigo-200' },
    Acknowledged: { cls: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${map[status].cls}`}>
      {status}
    </span>
  );
}

type ResponseStatusBadgeProps = { status: ResponseStatus };
export function ResponseStatusBadge({ status }: ResponseStatusBadgeProps) {
  const map: Record<ResponseStatus, { cls: string }> = {
    'No Response': { cls: 'bg-slate-50 text-slate-500 ring-slate-200' },
    'Response Submitted': { cls: 'bg-blue-50 text-blue-600 ring-blue-200' },
    'Documents Resubmitted': { cls: 'bg-purple-50 text-purple-600 ring-purple-200' },
    'Information Updated': { cls: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${map[status].cls}`}>
      {status}
    </span>
  );
}
