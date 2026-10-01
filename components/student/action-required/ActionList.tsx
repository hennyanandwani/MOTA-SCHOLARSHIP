import type { ActionItem } from '@/lib/actionRequired';
import { ActionCard } from '@/components/student/action-required/ActionCard';
import { ActionEmptyState } from '@/components/student/action-required/ActionEmptyState';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function ActionList({ actions, title = 'Open Actions', showEmpty = true, allCaughtUp = false }: { actions: ActionItem[]; title?: string; showEmpty?: boolean; allCaughtUp?: boolean }) {
  const t = useStudentTranslation();
  return (
    <section aria-labelledby="open-actions-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 id="open-actions-heading" className="text-base font-semibold text-[#172033]">{t(title)}</h2><p className="mt-1 text-xs text-[#64748B]">{t('Complete these actions to keep your application moving through the official workflow.')}</p></div><span className="text-[11px] text-[#64748B]">{actions.length} {t(actions.length === 1 ? 'item' : 'items')}</span></div>
      {actions.length > 0 ? <div className="grid min-w-0 gap-3 xl:grid-cols-2">{actions.map((action) => <ActionCard key={action.id} action={action} />)}</div> : showEmpty ? <ActionEmptyState allCaughtUp={allCaughtUp} /> : <p className="rounded-lg border border-dashed border-[#DCE3EC] bg-white px-4 py-6 text-center text-xs text-[#64748B]">{t('No resolved items match these filters.')}</p>}
    </section>
  );
}