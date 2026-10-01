import { ChartNoAxesColumnIncreasing } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const categories = [
  { label: 'Personal Information', value: 100 },
  { label: 'Contact Information', value: 100 },
  { label: 'Academic Information', value: 100 },
  { label: 'ST Information', value: 100 },
  { label: 'FPO Information', value: 0 },
  { label: 'Profile Photo', value: 0 },
];

export function ProfileCompletionBreakdown() {
  const t = useStudentTranslation();
  return (
    <section aria-labelledby="complete-profile-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><ChartNoAxesColumnIncreasing size={16} aria-hidden="true" /></span><h2 id="complete-profile-heading" className="text-sm font-semibold text-[#172033]">{t('Complete your profile')}</h2></div>
      <ul className="mt-4 space-y-3">
        {categories.map((category) => (
          <li key={category.label} className="min-w-0">
            <div className="flex min-w-0 items-center justify-between gap-3 text-xs"><span className="min-w-0 break-words font-medium text-[#475569]">{t(category.label)}</span><span className="shrink-0 font-semibold text-[#334155]">{category.value}%</span></div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E3EAF2]" role="progressbar" aria-label={`${category.label} completion`} aria-valuenow={category.value} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[#2563A8]" style={{ width: `${category.value}%` }} /></div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EEF1F5] pt-3"><span className="text-xs font-semibold text-[#334155]">{t('Overall')}</span><span className="text-sm font-bold text-[#173F7A]">72%</span></div>
      <p className="mt-3 text-[11px] leading-5 text-[#64748B]">{t('Completing optional profile information may help you provide information more easily during applications.')}</p>
    </section>
  );
}