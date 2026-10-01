import Link from 'next/link';
import { Check, Circle, FileText } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const requirements = [
  { label: 'Basic personal information', complete: true },
  { label: 'Contact information', complete: true },
  { label: 'Academic information', complete: true },
  { label: 'ST Certificate', complete: true },
  { label: 'FPO information', complete: false },
  { label: 'Profile photograph', complete: false },
];

export function ProfileRequirements() {
  const t = useStudentTranslation();
  return (
    <section aria-labelledby="profile-requirements-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><FileText size={16} aria-hidden="true" /></span><h2 id="profile-requirements-heading" className="text-sm font-semibold text-[#172033]">{t('Profile Requirements')}</h2></div>
      <ul className="mt-3 divide-y divide-[#EEF1F5]">
        {requirements.map((item) => (
          <li key={item.label} className="flex min-w-0 items-center justify-between gap-3 py-2">
            <span className="flex min-w-0 items-center gap-2 text-xs text-[#475569]">
              {item.complete ? <Check size={15} className="shrink-0 text-[#16805B]" aria-hidden="true" /> : <Circle size={14} className="shrink-0 text-[#64748B]" aria-hidden="true" />}
              <span className="break-words">{t(item.label)}</span>
            </span>
            <span className={`shrink-0 text-[10px] font-semibold ${item.complete ? 'text-[#166534]' : 'text-[#64748B]'}`}>{item.complete ? t('Complete') : t('Remaining')}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1F5] pt-3">
        <p className="text-xs font-semibold text-[#334155]">{t('2 items remaining')}</p>
        <Link href="/student/documents" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#173F7A] px-3 text-xs font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2">{t('View Documents')} <FileText size={14} aria-hidden="true" /></Link>
      </div>
    </section>
  );
}