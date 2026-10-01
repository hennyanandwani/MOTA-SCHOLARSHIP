'use client';

import { useStudentSettings, useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const selectClassName = 'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';

export function ProfilePreferences() {
  const { currentSettings, setCurrentSettings } = useStudentSettings();
  const t = useStudentTranslation();

  function toggle(key: 'emailNotifications' | 'applicationAlerts' | 'documentVerificationUpdates') {
    setCurrentSettings((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <section aria-labelledby="profile-preferences-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <h2 id="profile-preferences-heading" className="text-sm font-semibold text-[#172033]">{t('Preferences')}</h2>
      <label htmlFor="profile-language" className="mt-4 block text-xs font-medium text-[#475569]">{t('Language Preference')}
        <select id="profile-language" value={currentSettings.language} onChange={(event) => setCurrentSettings((current) => ({ ...current, language: event.target.value as typeof current.language }))} className={selectClassName}>
          <option value="English">{t('English')}</option><option value="Hindi">{t('Hindi')}</option><option value="Marathi">{t('Marathi')}</option>
        </select>
      </label>
      <fieldset className="mt-5 border-t border-[#EEF1F5] pt-4">
        <legend className="text-xs font-semibold text-[#334155]">{t('Communication Preference')}</legend>
        <div className="mt-2 divide-y divide-[#EEF1F5]">
          <PreferenceToggle id="email-notifications" label={t('Email notifications')} checked={currentSettings.emailNotifications} onChange={() => toggle('emailNotifications')} />
          <PreferenceToggle id="application-updates" label={t('Application updates')} checked={currentSettings.applicationAlerts} onChange={() => toggle('applicationAlerts')} />
          <PreferenceToggle id="important-document-alerts" label={t('Important document alerts')} checked={currentSettings.documentVerificationUpdates} onChange={() => toggle('documentVerificationUpdates')} />
        </div>
      </fieldset>
      <p className="mt-3 text-[10px] leading-4 text-[#64748B]">{t('Preference changes are saved in this browser. No notification service is connected.')}</p>
    </section>
  );
}

function PreferenceToggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-2 text-xs font-medium text-[#475569]">
      <span className="min-w-0 break-words">{label}</span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={onChange} className="peer sr-only" />
        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-[#2563A8] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2563A8] peer-focus-visible:ring-offset-2" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}