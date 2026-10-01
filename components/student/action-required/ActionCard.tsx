import Link from 'next/link';
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Clock3, FileText, UserRoundCog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActionItem, ActionPriority } from '@/lib/actionRequired';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const priorityStyles: Record<ActionPriority, string> = {
  Required: 'border-rose-200 bg-rose-50 text-[#A8323D]',
  Important: 'border-amber-200 bg-amber-50 text-[#80520B]',
  Review: 'border-blue-200 bg-blue-50 text-[#1D5796]',
};

const typeIcons: Record<ActionItem['type'], LucideIcon> = {
  Document: FileText,
  'Application Information': UserRoundCog,
  Other: AlertCircle,
};

export function ActionCard({ action }: { action: ActionItem }) {
  const t = useStudentTranslation();
  const TypeIcon = typeIcons[action.type];
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-[#E9D5A5] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-[#94600D]"><TypeIcon size={17} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><h3 className="break-words text-sm font-semibold text-[#172033]">{t(action.title)}</h3><div className="flex flex-wrap items-center gap-1.5"><span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${priorityStyles[action.priority]}`}><AlertCircle size={12} aria-hidden="true" />{t(action.priority)}</span><span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-[#80520B]"><AlertCircle size={12} aria-hidden="true" />{t('Action Required')}</span></div></div>
          <p className="mt-1 break-words text-xs font-medium text-[#475569]">{action.schemeName}</p>
          <p className="mt-1 break-all text-[10px] text-[#64748B]">{t('Application ID')}: {action.applicationId}</p>
        </div>
      </div>

      <dl className="mt-4 grid min-w-0 grid-cols-2 gap-3 border-y border-[#EEF1F5] py-3 sm:grid-cols-3">
        <InfoField label="Type" value={action.type} />
        <InfoField label="Raised" value={action.raisedDate} Icon={CalendarDays} />
        <InfoField label={action.deadline ? 'Demo deadline' : 'Deadline'} value={action.deadline ?? 'Not specified'} Icon={Clock3} />
      </dl>
      <div className="mt-3 min-w-0 space-y-2"><div><p className="text-[10px] font-semibold uppercase text-[#64748B]">{t('Issue')}</p><p className="mt-0.5 break-words text-xs leading-5 text-[#475569]">{t(action.issue)}</p></div><div><p className="text-[10px] font-semibold uppercase text-[#64748B]">{t('Required action')}</p><p className="mt-0.5 break-words text-xs leading-5 text-[#475569]">{t(action.requiredAction)}</p></div></div>
      {action.deadline && <p className="mt-3 text-[10px] text-[#64748B]">{t('Deadline shown is illustrative demo data.')}</p>}
      <Link href={action.href} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2 sm:mt-auto sm:self-start sm:w-auto">
        {t(action.type === 'Document' ? action.title.includes('missing') ? 'Upload Document' : 'Review Document' : 'Review Application')}<ArrowRight size={15} aria-hidden="true" />
      </Link>
    </article>
  );
}

function InfoField({ label, value, Icon }: { label: string; value: string; Icon?: LucideIcon }) {
  const t = useStudentTranslation();
  return <div className="min-w-0"><dt className="text-[10px] text-[#64748B]">{t(label)}</dt><dd className="mt-1 flex min-w-0 items-center gap-1 break-words text-[11px] font-medium text-[#334155]">{Icon && <Icon size={12} className="shrink-0 text-[#64748B]" aria-hidden="true" />}{t(value)}</dd></div>;
}