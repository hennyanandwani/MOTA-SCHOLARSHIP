import Link from 'next/link';
import { ArrowRight, Info, ShieldCheck } from 'lucide-react';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

export function ActionInfoNote() {
  const t = useStudentTranslation();
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <section className="flex min-w-0 items-start gap-2.5 rounded-xl border border-[#DCE3EC] bg-white p-4 sm:p-5"><Info size={16} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" /><div className="min-w-0"><h2 className="text-sm font-semibold text-[#172033]">{t('Action items are linked to your applications')}</h2><p className="mt-1 text-xs leading-5 text-[#64748B]">{t('When an application requires additional information or document correction, the requested action will appear here. Completing an action does not by itself determine eligibility or selection.')}</p><Link href="/student/applications" className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">{t('View My Applications')}<ArrowRight size={13} aria-hidden="true" /></Link></div></section>
      <p className="flex min-w-0 items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-[11px] leading-5 text-[#31577F]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />{t('Automated checks may assist in identifying missing or inconsistent information. Final verification and decisions are performed through the applicable official review process.')}</p>
    </div>
  );
}