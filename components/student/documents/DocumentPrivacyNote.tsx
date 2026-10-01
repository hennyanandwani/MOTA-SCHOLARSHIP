import { BookOpenCheck, Info } from 'lucide-react';

const checklist = [
  'ST Certificate',
  'Income Certificate',
  'Identity Proof',
  'Academic Marksheet',
  'Admission / Bonafide Certificate',
  'Bank Account Proof',
  'Photograph',
];

export function DocumentChecklist() {
  return (
    <section aria-labelledby="document-checklist-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><BookOpenCheck size={16} aria-hidden="true" /></span><h2 id="document-checklist-heading" className="text-sm font-semibold text-[#172033]">Document checklist</h2></div>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {checklist.map((item) => <li key={item} className="flex min-w-0 items-start gap-2 text-[11px] leading-4 text-[#475569]"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563A8]" aria-hidden="true" />{item}</li>)}
      </ul>
      <p className="mt-3 border-t border-[#EEF1F5] pt-3 text-[10px] text-[#64748B]">Required documents may vary by scheme.</p>
    </section>
  );
}

export function DocumentPrivacyNote() {
  return (
    <section className="rounded-xl border border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2563A8]"><Info size={16} aria-hidden="true" /></span><h2 className="text-sm font-semibold text-[#172033]">Document privacy</h2></div>
      <p className="mt-3 text-[11px] leading-5 text-[#475569]">Your documents are intended for scholarship and fellowship application processing. Upload only documents required for the applicable scheme.</p>
    </section>
  );
}