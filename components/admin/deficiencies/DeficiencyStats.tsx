import React from 'react';
import { AlertCircle, Clock, CheckCircle2, Send, RefreshCw } from 'lucide-react';
import type { DeficiencyRecord } from '@/lib/adminDeficiencyData';

type DeficiencyStatsProps = {
  records: DeficiencyRecord[];
};

export function DeficiencyStats({ records }: DeficiencyStatsProps) {
  const open = records.filter((r) => r.status === 'Open').length;
  const awaiting = records.filter((r) => r.status === 'Awaiting Response').length;
  const resubmitted = records.filter((r) => r.status === 'Resubmitted').length;
  const underReview = records.filter((r) => r.status === 'Under Review').length;
  const resolved = records.filter((r) => r.status === 'Resolved').length;

  const stats = [
    {
      label: 'Open Deficiencies',
      value: open,
      Icon: AlertCircle,
      iconCls: 'bg-red-50 text-[#C2414B]',
      borderCls: 'border-red-100',
    },
    {
      label: 'Awaiting Response',
      value: awaiting,
      Icon: Clock,
      iconCls: 'bg-amber-50 text-amber-700',
      borderCls: 'border-amber-100',
    },
    {
      label: 'Resubmitted',
      value: resubmitted,
      Icon: RefreshCw,
      iconCls: 'bg-purple-50 text-purple-700',
      borderCls: 'border-purple-100',
    },
    {
      label: 'Under Review',
      value: underReview,
      Icon: Send,
      iconCls: 'bg-indigo-50 text-indigo-700',
      borderCls: 'border-indigo-100',
    },
    {
      label: 'Resolved',
      value: resolved,
      Icon: CheckCircle2,
      iconCls: 'bg-emerald-50 text-[#16805B]',
      borderCls: 'border-emerald-100',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map(({ label, value, Icon, iconCls, borderCls }) => (
        <div
          key={label}
          className={`rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] ${borderCls}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
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
