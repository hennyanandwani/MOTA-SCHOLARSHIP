import React from 'react';
import { FileSearch, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import type { VerificationRecord } from '@/lib/adminVerificationData';

type VerificationStatsProps = {
  records: VerificationRecord[];
};

export function VerificationStats({ records }: VerificationStatsProps) {
  const pending = records.filter((r) => r.verificationStatus === 'Pending').length;
  const aiMatch = records.filter((r) => r.aiMatch === 'Match').length;
  const needsReview = records.filter((r) => r.verificationStatus === 'Under Review').length;
  const verified = records.filter((r) => r.verificationStatus === 'Verified').length;
  const rejected = records.filter((r) => r.verificationStatus === 'Rejected').length;

  const stats = [
    {
      label: 'Pending Verification',
      value: pending,
      Icon: Clock,
      iconCls: 'bg-slate-100 text-slate-600',
      borderCls: 'border-slate-200',
    },
    {
      label: 'AI Match',
      value: aiMatch,
      description: 'AI-assisted match result',
      Icon: FileSearch,
      iconCls: 'bg-blue-50 text-[#2563A8]',
      borderCls: 'border-blue-100',
    },
    {
      label: 'Needs Review',
      value: needsReview,
      Icon: AlertCircle,
      iconCls: 'bg-amber-50 text-amber-700',
      borderCls: 'border-amber-100',
    },
    {
      label: 'Verified',
      value: verified,
      Icon: CheckCircle2,
      iconCls: 'bg-emerald-50 text-[#16805B]',
      borderCls: 'border-emerald-100',
    },
    {
      label: 'Rejected',
      value: rejected,
      Icon: XCircle,
      iconCls: 'bg-red-50 text-[#C2414B]',
      borderCls: 'border-red-100',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map(({ label, value, description, Icon, iconCls, borderCls }) => (
        <div
          key={label}
          className={`rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] ${borderCls}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
              {description && (
                <p className="mt-0.5 text-[10px] text-[#94A3B8]">{description}</p>
              )}
              <p className="mt-2 text-2xl font-bold text-[#172033]">{value}</p>
            </div>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconCls}`}>
              <Icon size={16} aria-hidden="true" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}