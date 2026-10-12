'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, FileWarning } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';
import type { DashboardAction } from '@/components/student/dashboardTypes';

export function ActionRequired({ actions }: { actions: DashboardAction[] }) {
  const t = useStudentTranslation();

  return (
    <section id="action-required" className={`rounded-xl border ${actions.length > 0 ? 'border-amber-200 bg-[#FFFCF5]' : 'border-[#DCE3EC] bg-white'} p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${actions.length > 0 ? 'bg-amber-100 text-[#9A6414]' : 'bg-emerald-50 text-[#16805B]'}`}>
          {actions.length > 0 ? <AlertTriangle size={17} aria-hidden="true" /> : <FileWarning size={17} aria-hidden="true" />}
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#172033]">{t('Action Required')}</h2>
          <p className="text-xs text-[#64748B]">
            {actions.length > 0
              ? t('Persisted document verification results need your attention')
              : t('No documents are currently marked for action')}
          </p>
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {actions.map((action) => (
            <article key={action.id} className="flex flex-col justify-between gap-4 rounded-lg border border-amber-200/80 bg-white p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 gap-3">
                <FileWarning className="mt-0.5 shrink-0 text-[#B7791F]" size={18} aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#172033]">{action.documentName}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#9A6414]">{action.status}</p>
                  <p className="mt-2 text-xs leading-5 text-[#64748B]">
                    {action.remarks || `${action.schemeName} · ${action.applicationNumber}`}
                  </p>
                </div>
              </div>
              <Link href={action.href} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-[#DCE3EC] px-3 py-2 text-xs font-semibold text-[#173F7A] transition hover:border-[#2563A8] hover:bg-blue-50 sm:self-center">
                {t('Review')}<ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-[#F8FAFC] px-4 py-5 text-center text-sm text-[#64748B]">
          {t('There are no persisted verification results requiring action.')}
        </p>
      )}
    </section>
  );
}
