import type { ReactNode } from 'react';
import { useStudentTranslation } from './StudentSettingsProvider';

export function SettingsSection({ id, title, description, icon, children }: {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const t = useStudentTranslation();
  return (
    <section aria-labelledby={`${id}-heading`} className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-start gap-2.5">
        {icon && <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]">{icon}</span>}
        <div className="min-w-0">
          <h2 id={`${id}-heading`} className="text-sm font-semibold text-[#172033]">{t(title)}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-[#64748B]">{t(description)}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}