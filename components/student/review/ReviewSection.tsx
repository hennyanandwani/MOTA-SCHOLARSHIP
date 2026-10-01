import { PencilLine } from 'lucide-react';

export type ReviewFieldItem = {
  label: string;
  value: string;
};

export function ReviewSection({
  number,
  title,
  onEdit,
  children,
}: {
  number: string;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`review-section-${number}`} className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#EEF1F5] pb-3">
        <h2 id={`review-section-${number}`} className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-[#172033]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[#2563A8]">{number}</span>
          <span className="break-words">{title}</span>
        </h2>
        <button type="button" onClick={onEdit} aria-label={`Edit ${title}`} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#2563A8] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">
          <PencilLine size={14} aria-hidden="true" />Edit
        </button>
      </div>
      {children}
    </section>
  );
}

export function ReviewFieldGrid({ fields }: { fields: ReviewFieldItem[] }) {
  return (
    <dl className="mt-1 grid min-w-0 grid-cols-1 gap-x-5 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="min-w-0 border-b border-[#EEF1F5] py-3 last:border-b-0">
          <dt className="text-[11px] text-[#64748B]">{field.label}</dt>
          <dd className="mt-1 break-words text-xs font-semibold leading-5 text-[#172033]">{field.value || 'Not provided'}</dd>
        </div>
      ))}
    </dl>
  );
}