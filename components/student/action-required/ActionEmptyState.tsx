import { CheckCircle2 } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function ActionEmptyState({ allCaughtUp = true }: { allCaughtUp?: boolean }) {
  const t = useStudentTranslation();
  return (
    <section className="flex min-w-0 flex-col items-center rounded-xl border border-emerald-200 bg-white px-5 py-10 text-center shadow-[0_1px_3px_rgba(23,32,51,0.04)]" aria-labelledby="actions-empty-heading">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#16805B]"><CheckCircle2 size={22} aria-hidden="true" /></span>
      <h3 id="actions-empty-heading" className="mt-3 text-sm font-semibold text-[#172033]">{t(allCaughtUp ? 'You’re all caught up' : 'No actions match these filters')}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#64748B]">{t(allCaughtUp ? 'There’s nothing that currently requires your attention.' : 'Try changing your search or filters.')}</p>
    </section>
  );
}