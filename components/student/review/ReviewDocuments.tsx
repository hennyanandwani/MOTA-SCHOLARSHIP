import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Upload,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ApplicationDocument, DocumentStatus } from '@/lib/applicationDocuments';

const buttonBase = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#B8C9DC] bg-white px-3 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';

const statusPresentation: Record<DocumentStatus, { label: string; Icon: LucideIcon; className: string }> = {
  not_uploaded: { label: 'Not Uploaded', Icon: Upload, className: 'border-[#DCE3EC] bg-[#F8FAFC] text-[#475569]' },
  uploaded: { label: 'Uploaded', Icon: FileText, className: 'border-blue-200 bg-blue-50 text-[#1D5796]' },
  verifying: { label: 'Verification in progress', Icon: Clock3, className: 'border-blue-200 bg-blue-50 text-[#1D5796]' },
  verified: { label: 'Verified', Icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-[#126747]' },
  needs_attention: { label: 'Needs Attention', Icon: AlertCircle, className: 'border-amber-200 bg-amber-50 text-[#80520B]' },
  rejected: { label: 'Rejected — upload again', Icon: XCircle, className: 'border-rose-200 bg-rose-50 text-[#A8323D]' },
};

function getAction(status: DocumentStatus) {
  if (status === 'not_uploaded') return 'Upload';
  if (status === 'needs_attention' || status === 'rejected') return 'Fix';
  if (status === 'verified') return 'View';
  return 'Replace';
}

export function ReviewDocuments({
  documents,
  documentsHref,
}: {
  documents: ApplicationDocument[];
  documentsHref: string;
}) {
  return (
    <section aria-labelledby="review-documents-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#EEF1F5] pb-3">
        <div>
          <h2 id="review-documents-heading" className="text-sm font-semibold text-[#172033]">04 · Documents</h2>
          <p className="mt-1 text-[11px] text-[#64748B]">Review the current file and document status.</p>
        </div>
        <Link href={documentsHref} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Manage documents<Upload size={13} aria-hidden="true" /></Link>
      </div>

      <ul className="divide-y divide-[#EEF1F5]">
        {documents.map((document) => {
          const status = statusPresentation[document.status];
          const StatusIcon = status.Icon;
          const action = getAction(document.status);
          return (
            <li key={document.id} id={`review-document-${document.id}`} className="flex min-w-0 flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1F6FC] text-[#2563A8]"><FileCheck2 size={16} aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="break-words text-xs font-semibold text-[#172033]">{document.name}</p>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${status.className}`}><StatusIcon size={12} aria-hidden="true" />{status.label}</span>
                    {document.fileName && <span className="max-w-full break-all text-[10px] text-[#64748B]">{document.fileName}</span>}
                  </div>
                </div>
              </div>
              <Link href={`${documentsHref}#document-${document.id}`} aria-label={`${action} ${document.name}`} className={`${buttonBase} w-full shrink-0 sm:w-auto`}>{action}</Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 flex items-start gap-2 border-t border-[#EEF1F5] pt-3 text-[10px] leading-4 text-[#64748B]"><AlertCircle size={13} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />Document indicators are preliminary. Final verification is completed through the official review process.</p>
    </section>
  );
}