import React from 'react';
import type { VerificationStatus, OCRStatus, AIMatchStatus, VerificationPriority } from '@/lib/adminVerificationData';

type VerificationStatusBadgeProps = { status: VerificationStatus };
export function VerificationStatusBadge({ status }: VerificationStatusBadgeProps) {
  const map: Record<VerificationStatus, { cls: string; label: string }> = {
    Pending: { cls: 'bg-slate-100 text-slate-700 ring-slate-200', label: 'Pending' },
    'Under Review': { cls: 'bg-amber-50 text-amber-700 ring-amber-200', label: 'Under Review' },
    Verified: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'Verified' },
    Rejected: { cls: 'bg-red-50 text-red-700 ring-red-200', label: 'Rejected' },
  };
  const { cls, label } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

type OCRStatusBadgeProps = { status: OCRStatus };
export function OCRStatusBadge({ status }: OCRStatusBadgeProps) {
  const map: Record<OCRStatus, { cls: string }> = {
    Extracted: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    Processing: { cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    'Extraction Failed': { cls: 'bg-red-50 text-red-700 ring-red-200' },
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${map[status].cls}`}>
      {status}
    </span>
  );
}

type AIMatchBadgeProps = { status: AIMatchStatus };
export function AIMatchBadge({ status }: AIMatchBadgeProps) {
  const map: Record<AIMatchStatus, { cls: string }> = {
    Match: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    'Partial Match': { cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    Mismatch: { cls: 'bg-red-50 text-red-700 ring-red-200' },
    'Unable to Compare': { cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${map[status].cls}`}>
      {status}
    </span>
  );
}

type PriorityBadgeProps = { priority: VerificationPriority };
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const map: Record<VerificationPriority, { cls: string }> = {
    High: { cls: 'bg-red-50 text-red-700 ring-red-200' },
    Medium: { cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    Low: { cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${map[priority].cls}`}>
      {priority}
    </span>
  );
}