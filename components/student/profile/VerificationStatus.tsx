import { CheckCircle2, CircleHelp } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

const verificationItems = [
  { label: 'Identity Information', status: 'Provided' },
  { label: 'ST Certificate', status: 'Verified' },
  { label: 'Contact Information', status: 'Provided' },
  { label: 'Academic Information', status: 'Complete' },
  { label: 'Bank Information', status: 'Provided' },
];

export function VerificationStatus() {
  const t = useStudentTranslation();
  return (
    <section aria-labelledby="profile-verification-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><CheckCircle2 size={16} aria-hidden="true" /></span>
        <h2 id="profile-verification-heading" className="text-sm font-semibold text-[#172033]">{t('Profile Verification')}</h2>
      </div>
      <ul className="mt-3 divide-y divide-[#EEF1F5]">
        {verificationItems.map((item) => (
          <li key={item.label} className="flex min-w-0 items-center justify-between gap-3 py-2.5">
            <span className="min-w-0 break-words text-xs font-medium text-[#475569]">{t(item.label)}</span>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${item.status === 'Verified' || item.status === 'Complete' ? 'border-emerald-200 bg-emerald-50 text-[#166534]' : 'border-[#DCE3EC] bg-[#F8FAFC] text-[#475569]'}`}>
              {item.status === 'Verified' || item.status === 'Complete' ? <CheckCircle2 size={12} aria-hidden="true" /> : <CircleHelp size={12} aria-hidden="true" />}
              {t(item.status)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-[#EEF1F5] pt-3 text-[10px] leading-4 text-[#64748B]">
        {t('Statuses are illustrative demo indicators; they do not mean the entire profile is officially verified.')}
      </p>
    </section>
  );
}