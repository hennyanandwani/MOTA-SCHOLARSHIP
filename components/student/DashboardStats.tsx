'use client';

import { AlertCircle, Bell, Clock3, FileText } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

type DashboardStatsProps = {
  applications: number;
  underReview: number;
  actionRequired: number;
};

export function DashboardStats({
  applications,
  underReview,
  actionRequired,
}: DashboardStatsProps) {
  const t = useStudentTranslation();
  const stats = [
    {
      label: 'Applications',
      value: applications.toString().padStart(2, '0'),
      detail: 'Your saved and submitted applications',
      Icon: FileText,
      iconClass: 'bg-blue-50 text-[#2563A8]',
    },
    {
      label: 'Under Review',
      value: underReview.toString().padStart(2, '0'),
      detail: 'In verification or manual review',
      Icon: Clock3,
      iconClass: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Action Required',
      value: actionRequired.toString().padStart(2, '0'),
      detail: 'Applications with flagged documents',
      Icon: AlertCircle,
      iconClass: 'bg-amber-50 text-[#B7791F]',
    },
    {
      label: 'Notifications',
      value: '—',
      detail: 'No notification records are available',
      Icon: Bell,
      iconClass: 'bg-emerald-50 text-[#16805B]',
    },
  ];

  return (
    <section id="dashboard-stats" aria-label={t('Application summary')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, detail, Icon, iconClass }) => (
        <article key={label} className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#64748B]">{t(label)}</p>
              <p className="mt-3 text-2xl font-bold leading-none text-[#172033]">{value}</p>
            </div>
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
              <Icon size={19} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-xs text-[#64748B]">{t(detail)}</p>
        </article>
      ))}
    </section>
  );
}
