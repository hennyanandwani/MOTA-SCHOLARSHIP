import { ClipboardList, GitCompareArrows, SearchCheck } from 'lucide-react';

const steps = [
  { text: 'Your profile information is reviewed.', Icon: ClipboardList },
  { text: 'Scheme rules and criteria are compared with your profile.', Icon: GitCompareArrows },
  { text: 'Relevant schemes are shown for your review.', Icon: SearchCheck },
];

export function RecommendationInfo() {
  return (
    <section id="eligibility-guidance" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6">
      <h2 className="text-base font-semibold text-[#172033]">How recommendations work</h2>
      <ol className="mt-4 grid gap-4 md:grid-cols-3">
        {steps.map(({ text, Icon }, index) => (
          <li key={text} className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]">
              <Icon size={16} aria-hidden="true" />
            </span>
            <p className="pt-1 text-xs leading-5 text-[#475569]">
              <span className="mr-1 font-semibold text-[#173F7A]">{index + 1}.</span>{text}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-5 border-t border-[#EEF1F5] pt-4 text-xs leading-5 text-[#64748B]">
        AI recommendations are advisory only. Final eligibility and selection are determined using configured scheme rules and authorized human review.
      </p>
    </section>
  );
}