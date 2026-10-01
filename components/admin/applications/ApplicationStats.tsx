import React from 'react';
import { FileText, Clock, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { AdminDashboardMetrics } from '@/lib/adminData';

type ApplicationStatsProps = {
  metrics: AdminDashboardMetrics;
  currentFilteredCount: number;
  totalRegistryCount: number;
};

export function ApplicationStats({
  metrics,
  currentFilteredCount,
  totalRegistryCount,
}: ApplicationStatsProps) {
  const cards = [
    {
      id: 'total',
      label: 'Total Applications',
      value: metrics.totalApplications.toLocaleString('en-IN'),
      subtext: `Registry sample: ${totalRegistryCount} loaded`,
      icon: FileText,
      iconColor: 'text-[#173F7A]',
      iconBg: 'bg-blue-50',
    },
    {
      id: 'under-review',
      label: 'Under Review',
      value: metrics.underReview.toLocaleString('en-IN'),
      subtext: 'Across scrutiny & screening',
      icon: Clock,
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-50',
    },
    {
      id: 'verification-pending',
      label: 'Verification Pending',
      value: metrics.verificationPending.toLocaleString('en-IN'),
      subtext: 'Awaiting OCR / DigiLocker match',
      icon: ShieldAlert,
      iconColor: 'text-[#2563A8]',
      iconBg: 'bg-indigo-50',
    },
    {
      id: 'action-required',
      label: 'Action Required',
      value: metrics.deficiencies.toLocaleString('en-IN'),
      subtext: 'Notices issued & discrepancies',
      icon: AlertTriangle,
      iconColor: 'text-rose-700',
      iconBg: 'bg-rose-50',
    },
  ];

  return (
    <section aria-label="Application Registry Summary Metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="flex items-start justify-between rounded-xl border border-[#DCE3EC] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#64748B]">{card.label}</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-[#172033]">
                {card.value}
              </p>
              <p className="mt-1 truncate text-[11px] text-[#64748B]">
                {card.subtext}
              </p>
            </div>
            <div
              className={`ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#DCE3EC]/60 ${card.iconBg}`}
            >
              <Icon size={20} className={card.iconColor} aria-hidden="true" />
            </div>
          </div>
        );
      })}
    </section>
  );
}