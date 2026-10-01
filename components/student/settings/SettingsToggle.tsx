import { useStudentTranslation } from './StudentSettingsProvider';

export function SettingsToggle({ id, label, description, checked, showStatus = false, onChange }: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  showStatus?: boolean;
  onChange: () => void;
}) {
  const t = useStudentTranslation();
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block break-words text-xs font-medium text-[#334155]">{t(label)}</span>
        {description && <span className="mt-0.5 block text-[10px] leading-4 text-[#64748B]">{t(description)}</span>}
      </span>
      {showStatus && <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${checked ? 'border-emerald-200 bg-emerald-50 text-[#166534]' : 'border-[#DCE3EC] bg-[#F8FAFC] text-[#475569]'}`}>{checked ? t('Enabled') : t('Disabled')}</span>}
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={onChange} className="peer sr-only" />
        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-[#2563A8] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2563A8] peer-focus-visible:ring-offset-2" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}