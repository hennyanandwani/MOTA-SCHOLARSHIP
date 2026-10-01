import { ShieldCheck } from 'lucide-react';

export type ReviewDeclaration = 'informationAccurate' | 'verificationAcknowledged' | 'eligibilityNotGuaranteed' | 'termsAccepted';
export type ReviewDeclarations = Record<ReviewDeclaration, boolean>;

export const initialReviewDeclarations: ReviewDeclarations = {
  informationAccurate: false,
  verificationAcknowledged: false,
  eligibilityNotGuaranteed: false,
  termsAccepted: false,
};

const declarationItems: { id: ReviewDeclaration; text: string }[] = [
  { id: 'informationAccurate', text: 'I confirm that the information provided in this application is true and accurate to the best of my knowledge.' },
  { id: 'verificationAcknowledged', text: 'I understand that supporting documents may be verified during the official scrutiny process.' },
  { id: 'eligibilityNotGuaranteed', text: 'I understand that submission of this application does not by itself confirm eligibility or selection.' },
  { id: 'termsAccepted', text: 'I agree to the applicable scheme terms and conditions.' },
];

export function DeclarationChecklist({
  values,
  onChange,
}: {
  values: ReviewDeclarations;
  onChange: (id: ReviewDeclaration, checked: boolean) => void;
}) {
  return (
    <fieldset className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <legend className="sr-only">Application declarations</legend>
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><ShieldCheck size={16} aria-hidden="true" /></span>
        <div>
          <h2 className="text-sm font-semibold text-[#172033]">Declarations</h2>
          <p className="mt-1 text-[11px] leading-4 text-[#64748B]">Select each declaration to enable submission.</p>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {declarationItems.map((item) => (
          <label key={item.id} className="flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border border-[#DCE3EC] bg-[#FCFDFE] p-3.5 text-xs leading-5 text-[#334155] transition hover:border-[#B8C9DC] focus-within:ring-2 focus-within:ring-[#2563A8]">
            <input type="checkbox" checked={values[item.id]} onChange={(event) => onChange(item.id, event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#173F7A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2" />
            <span>{item.text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}