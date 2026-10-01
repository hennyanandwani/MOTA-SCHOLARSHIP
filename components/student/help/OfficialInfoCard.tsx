import { ShieldCheck, Sparkles, Bell } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function OfficialInfoCard() {
  const t = useStudentTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Official Communication Info */}
      <section
        aria-labelledby="official-comm-heading"
        className="flex min-w-0 items-start gap-3.5 rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-2xs"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#173F7A]">
          <Bell size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="official-comm-heading" className="text-sm font-bold text-[#172033]">
            {t('Official Communication')}
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-[#475569]">
            {t(
              'Important updates related to your application may be communicated through the official channels associated with your account. Always verify information through the scholarship portal before taking action.'
            )}
          </p>
        </div>
      </section>

      {/* AI & Governance Disclaimer */}
      <section
        aria-labelledby="governance-heading"
        className="flex min-w-0 items-start gap-3.5 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 shadow-2xs"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#475569]">
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 id="governance-heading" className="text-sm font-bold text-[#172033]">
              {t('AI-Assisted Guidance & Statutory Governance')}
            </h2>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
              <ShieldCheck size={11} aria-hidden="true" />
              {t('Assistive Only')}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-[#475569]">
            {t(
              'AI-assisted guidance is provided to help identify possible matches, missing information and review areas. Final eligibility, verification, screening and selection decisions remain subject to the applicable scheme rules and authorized official review.'
            )}
          </p>
        </div>
      </section>
    </div>
  );
}