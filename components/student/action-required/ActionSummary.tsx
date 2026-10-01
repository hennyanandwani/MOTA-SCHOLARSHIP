import { AlertCircle, CheckCircle2, FileText, UserRoundCog } from 'lucide-react';
import type { ActionItem } from '@/lib/actionRequired';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function ActionSummary({ openActions, resolvedCount }: { openActions: ActionItem[]; resolvedCount: number }) {
  const t = useStudentTranslation();
  const summary = [
    { label: 'Open Actions', value: openActions.length, Icon: AlertCircle, tone: 'bg-amber-50 text-[#80520B]' },
    { label: 'Documents', value: openActions.filter((item) => item.type === 'Document').length, Icon: FileText, tone: 'bg-blue-50 text-[#2563A8]' },
    { label: 'Application Information', value: openActions.filter((item) => item.type === 'Application Information').length, Icon: UserRoundCog, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Resolved', value: resolvedCount, Icon: CheckCircle2, tone: 'bg-emerald-50 text-[#126747]' },
  ];
  return (
    <section aria-label="Action summary" className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
      {summary.map(({ label, value, Icon, tone }) => <article key={label} className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-3.5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-4"><div className="flex min-w-0 items-center gap-2"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={16} aria-hidden="true" /></span><p className="min-w-0 text-[11px] font-medium leading-4 text-[#64748B]">{t(label)}</p></div><p className="mt-2 text-xl font-bold text-[#172033]">{value}</p></article>)}
    </section>
  );
}