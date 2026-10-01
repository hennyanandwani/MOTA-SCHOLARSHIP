'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, FileWarning } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const items = [
  {
    title: 'Income Certificate',
    status: 'Correction required',
    description: 'Please upload a clearer document. The submitted file could not be fully verified.',
    action: 'Fix now',
    Icon: FileWarning,
  },
  {
    title: 'Application information',
    status: 'Additional information required',
    description: 'Some information needs to be reviewed before your application can proceed.',
    action: 'Review',
    Icon: AlertTriangle,
  },
];

export function ActionRequired() {
  const t = useStudentTranslation();
  return (
    <section id="action-required" className="rounded-xl border border-amber-200 bg-[#FFFCF5] p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-[#9A6414]">
          <AlertTriangle size={17} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#172033]">{t('Action Required')}</h2>
          <p className="text-xs text-[#64748B]">{t('Two items need your attention')}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {items.map(({ title, status, description, action, Icon }) => (
          <article key={title} className="flex flex-col justify-between gap-4 rounded-lg border border-amber-200/80 bg-white p-4 sm:flex-row sm:items-center">
            <div className="flex gap-3">
              <Icon className="mt-0.5 shrink-0 text-[#B7791F]" size={18} aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-[#172033]">{t(title)}</h3>
                <p className="mt-1 text-xs font-semibold text-[#9A6414]">{t(status)}</p>
                <p className="mt-2 max-w-xl text-xs leading-5 text-[#64748B]">{t(description)}</p>
              </div>
            </div>
            <Link href="#applications" className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-[#DCE3EC] px-3 py-2 text-xs font-semibold text-[#173F7A] transition hover:border-[#2563A8] hover:bg-blue-50 sm:self-center">
              {t(action)}<ArrowRight size={14} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}