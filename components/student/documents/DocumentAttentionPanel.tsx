import { AlertCircle, ArrowRight } from 'lucide-react';
import type { StudentDocument } from '@/lib/studentDocuments';

export function DocumentAttentionPanel({ documents, onReview }: { documents: StudentDocument[]; onReview: (document: StudentDocument) => void }) {
  if (documents.length === 0) return null;
  return (
    <section aria-labelledby="attention-documents-heading" className="rounded-xl border border-[#E9D5A5] bg-[#FFFBEB] p-4 sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[#94600D]"><AlertCircle size={18} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 id="attention-documents-heading" className="text-sm font-semibold text-[#573B0A]">Documents that need your attention</h2>
          <p className="mt-1 text-xs leading-5 text-[#765719]">Please review the status of these documents and provide a corrected or replacement document if requested.</p>
          <ul className="mt-3 divide-y divide-amber-200/70">
            {documents.map((document) => <li key={document.id} className="flex min-w-0 flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words text-xs font-semibold text-[#172033]">{document.name}</p><p className="mt-0.5 text-[11px] text-[#765719]">{document.issue ?? 'Review the latest document instructions.'}</p></div><button type="button" onClick={() => onReview(document)} className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#C9A34E] bg-white px-3 text-xs font-semibold text-[#684B10] hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94600D] sm:w-auto">Review<ArrowRight size={13} aria-hidden="true" /></button></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}