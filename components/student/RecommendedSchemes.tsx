import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Landmark } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const schemes = [
  {
    title: 'National Fellowship for ST Students',
    description: 'Higher education / fellowship',
    match: 'High',
    Icon: GraduationCap,
    tone: 'text-[#2563A8] bg-blue-50',
    cta: 'View details',
  },
  {
    title: 'Post Matric Scholarship',
    description: 'Undergraduate / postgraduate support',
    match: 'Medium',
    Icon: BookOpen,
    tone: 'text-[#16805B] bg-emerald-50',
    cta: 'View details',
  },
  {
    title: 'Higher Education Support',
    description: 'Higher education assistance',
    match: 'Review criteria',
    Icon: Landmark,
    tone: 'text-[#B7791F] bg-amber-50',
    cta: 'Check eligibility',
  },
];

export function RecommendedSchemes() {
  const t = useStudentTranslation();
  return (
    <section id="recommended-schemes">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#172033]">{t('Schemes that may fit your profile')}</h2>
          <p className="mt-1 text-xs text-[#64748B]">{t('Suggestions based on the sample profile')}</p>
        </div>
        <Link href="#recommended-schemes" className="text-xs font-semibold text-[#2563A8] hover:underline">{t('Explore schemes')}</Link>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {schemes.map(({ title, description, match, Icon, tone, cta }) => (
          <article key={title} className="flex min-w-0 flex-col rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon size={18} aria-hidden="true" /></span>
            <h3 className="mt-3 text-sm font-semibold leading-5 text-[#172033]">{title}</h3>
            <p className="mt-1 min-h-8 text-xs leading-4 text-[#64748B]">{t(description)}</p>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EEF1F5] pt-3">
              <div>
                <p className="text-[10px] text-[#64748B]">{t('Profile match')}</p>
                <p className="mt-0.5 text-xs font-semibold text-[#172033]">{t(match)}</p>
              </div>
              <Link href="#recommended-schemes" className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563A8] hover:underline">
                {t(cta)}<ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#64748B]">
        {t('Recommendations are guidance only. Final eligibility is determined through the official scheme rules and review process.')}
      </p>
    </section>
  );
}