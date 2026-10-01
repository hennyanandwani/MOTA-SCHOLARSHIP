'use client';

import { useState, type FormEvent } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export type ProfileField<T extends Record<string, string>> = {
  key: keyof T;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'password' | 'select';
  options?: readonly string[];
  displayValue?: (value: string) => string;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
};

type EditableProfileSectionProps<T extends Record<string, string>> = {
  id: string;
  title: string;
  description?: string;
  values: T;
  fields: readonly ProfileField<T>[];
  editing: boolean;
  onBeginEdit: () => void;
  onCancel: () => void;
  onSave: (values: T) => void;
  successText?: string;
  statusLabel?: string;
};

const inputClassName = 'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';

export function EditableProfileSection<T extends Record<string, string>>({
  id,
  title,
  description,
  values,
  fields,
  editing,
  onBeginEdit,
  onCancel,
  onSave,
  successText = 'Changes saved.',
  statusLabel,
}: EditableProfileSectionProps<T>) {
  const t = useStudentTranslation();
  const [draft, setDraft] = useState<T>(values);
  const [saved, setSaved] = useState(false);

  function beginEdit() {
    setDraft(values);
    setSaved(false);
    onBeginEdit();
  }

  function cancelEdit() {
    setDraft(values);
    onCancel();
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
    setSaved(true);
  }

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${id}-heading`} className="text-sm font-semibold text-[#172033]">{t(title)}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-[#64748B]">{t(description)}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {statusLabel && <span className="rounded-full border border-[#DCE3EC] bg-[#F8FAFC] px-2 py-1 text-[10px] font-semibold text-[#475569]">{t(statusLabel)}</span>}
          {!editing && <button type="button" onClick={beginEdit} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#2563A8] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2"><Pencil size={13} aria-hidden="true" />{t('Edit')}</button>}
        </div>
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-4">
          <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={String(field.key)} className="block min-w-0 text-xs font-medium text-[#475569]">
                {t(field.label)}
                {field.type === 'select' ? (
                  <select value={draft[field.key]} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} className={inputClassName}>
                    {(field.options ?? []).map((option) => <option key={option} value={option}>{t(option)}</option>)}
                  </select>
                ) : (
                  <input type={field.type ?? 'text'} value={draft[field.key]} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} autoComplete={field.autoComplete} inputMode={field.inputMode} className={inputClassName} />
                )}
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#EEF1F5] pt-3">
            <button type="button" onClick={cancelEdit} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#334155] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2"><X size={14} aria-hidden="true" />{t('Cancel')}</button>
            <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2"><Check size={14} aria-hidden="true" />{t('Save Changes')}</button>
          </div>
        </form>
      ) : (
        <dl className="mt-4 grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 border-t border-[#EEF1F5] pt-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={String(field.key)} className="min-w-0">
              <dt className="text-[11px] font-medium text-[#64748B]">{t(field.label)}</dt>
              <dd className="mt-1 break-words text-xs font-semibold leading-5 text-[#334155]">{t(field.displayValue ? field.displayValue(values[field.key]) : values[field.key])}</dd>
            </div>
          ))}
        </dl>
      )}

      {saved && <p role="status" aria-live="polite" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-[#166534]">{t(successText)}</p>}
    </section>
  );
}