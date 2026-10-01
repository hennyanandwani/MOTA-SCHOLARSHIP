import Link from 'next/link';
import { AlertCircle, ArrowRight, CircleHelp, ClipboardCheck, Headset, Info } from 'lucide-react';
import type { DocumentStatus } from '@/lib/applicationTracking';

export function ActionRequired({
  document,
  documentsHref,
}: {
  document: DocumentStatus;
  documentsHref: string;
}) {
  return (
    <section aria-labelledby="action-required-heading" className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#E9D5A5] bg-[#FFFBEB] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[#94600D]"><AlertCircle size={18} aria-hidden="true" /></span>
        <div className="min-w-0"><h2 id="action-required-heading" className="text-sm font-semibold text-[#573B0A]">Action Required</h2><p className="mt-1 break-words text-sm font-semibold text-[#172033]">{document.name} needs attention</p><p className="mt-1 text-xs leading-5 text-[#765719]">Please review the document status and provide the required correction or replacement if requested.</p></div>
      </div>
      <Link href={documentsHref} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-[#C9A34E] bg-white px-4 text-sm font-semibold text-[#684B10] transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94600D] focus-visible:ring-offset-2 sm:w-auto">Review Document<ArrowRight size={15} aria-hidden="true" /></Link>
    </section>
  );
}

export function NextSteps() {
  const steps = [
    'Document verification',
    'Eligibility verification',
    'Official scrutiny',
    'Screening / selection',
    'Outcome communication',
  ];
  return (
    <section aria-labelledby="next-steps-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><ClipboardCheck size={16} aria-hidden="true" /></span><h2 id="next-steps-heading" className="text-sm font-semibold text-[#172033]">What happens next?</h2></div>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => <li key={step} className="flex min-w-0 items-start gap-2.5 text-xs text-[#475569]"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${index === 0 ? 'border-[#2563A8] bg-blue-50 text-[#173F7A]' : 'border-[#DCE3EC] bg-[#F8FAFC] text-[#64748B]'}`}>{index + 1}</span><span className="pt-1">{step}</span></li>)}
      </ol>
      <p className="mt-4 border-t border-[#EEF1F5] pt-3 text-[10px] leading-4 text-[#64748B]">Timelines may vary depending on the applicable scheme and official processing workflow.</p>
    </section>
  );
}

export function SupportCard() {
  return (
    <section aria-labelledby="support-heading" className="rounded-xl border border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2563A8]"><Headset size={16} aria-hidden="true" /></span><h2 id="support-heading" className="text-sm font-semibold text-[#172033]">Need help?</h2></div>
      <p className="mt-3 text-xs leading-5 text-[#475569]">If you have questions about your application, use the available support channels or contact the designated scholarship support team.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><Headset size={14} aria-hidden="true" />Help &amp; Support</button>
        <button type="button" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#DCE3EC] bg-white px-3 text-xs font-semibold text-[#334155] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><CircleHelp size={14} aria-hidden="true" />View FAQs</button>
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-[#64748B]"><Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />Support actions are informational demo controls.</p>
    </section>
  );
}