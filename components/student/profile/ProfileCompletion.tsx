import { AlertCircle } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function ProfileCompletion() {
  const t = useStudentTranslation();
  return (
    <section aria-labelledby="profile-completion-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="profile-completion-heading" className="text-sm font-semibold text-[#172033]">{t('Profile completion')}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9D5A5] bg-[#FFFBEB] px-2.5 py-1 text-[11px] font-semibold text-[#684B10]">
          <AlertCircle size={13} aria-hidden="true" />
          {t('Profile requires attention')}
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="text-2xl font-bold text-[#173F7A]">72%</p>
        <p className="text-[11px] font-medium text-[#64748B]">{t('Profile information')}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E3EAF2]" role="progressbar" aria-label="Profile completion" aria-valuenow={72} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full w-[72%] rounded-full bg-[#2563A8]" />
      </div>
      <p className="mt-3 text-xs leading-5 text-[#64748B]">
        {t('Complete your profile to make scheme discovery and application easier.')}
      </p>
    </section>
  );
}