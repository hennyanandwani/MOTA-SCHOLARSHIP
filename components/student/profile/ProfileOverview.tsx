import { ArrowRight, UserRound } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

type ProfileOverviewProps = {
  fullName: string;
  studentId: string;
  state: string;
  district: string;
  fpoName: string;
  maskSensitiveInformation: boolean;
  onEditProfile: () => void;
};

export function ProfileOverview({ fullName, studentId, state, district, fpoName, maskSensitiveInformation, onEditProfile }: ProfileOverviewProps) {
  const t = useStudentTranslation();
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

  return (
    <section aria-labelledby="profile-overview-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#173F7A] text-sm font-bold text-white" aria-label={`${fullName} initials`}>
          {initials || <UserRound size={22} aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="profile-overview-heading" className="break-words text-lg font-bold text-[#172033]">{fullName}</h2>
              <p className="mt-1 break-all text-xs text-[#64748B]">{t('Student ID')}: {maskSensitiveInformation ? `XXXX XXXX ${studentId.slice(-4)}` : studentId}</p>
            </div>
            <button type="button" onClick={onEditProfile} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2">
              {t('Edit Profile')} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          <dl className="mt-4 grid min-w-0 grid-cols-1 gap-x-5 gap-y-3 border-t border-[#EEF1F5] pt-4 sm:grid-cols-2">
            <div className="min-w-0"><dt className="text-[11px] font-medium text-[#64748B]">{t('State')}</dt><dd className="mt-1 break-words text-xs font-semibold text-[#334155]">{state}</dd></div>
            <div className="min-w-0"><dt className="text-[11px] font-medium text-[#64748B]">{t('District')}</dt><dd className="mt-1 break-words text-xs font-semibold text-[#334155]">{district}</dd></div>
            <div className="min-w-0 sm:col-span-2"><dt className="text-[11px] font-medium text-[#64748B]">{t('FPO / Community Organization')}</dt><dd className="mt-1 break-words text-xs font-semibold text-[#334155]">{fpoName}</dd></div>
          </dl>
          <div className="mt-4 border-t border-[#EEF1F5] pt-3">
            <div className="flex items-center justify-between gap-3 text-xs"><span className="font-medium text-[#64748B]">{t('Profile completion')}</span><span className="font-bold text-[#173F7A]">72%</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E3EAF2]" role="progressbar" aria-label="Profile completion in overview" aria-valuenow={72} aria-valuemin={0} aria-valuemax={100}><div className="h-full w-[72%] rounded-full bg-[#2563A8]" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}