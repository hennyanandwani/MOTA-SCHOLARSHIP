'use client';

import { useEffect, useRef } from 'react';
import { FileText, X } from 'lucide-react';
import type { StudentDocument } from '@/lib/studentDocuments';
import { DocumentStatusBadge } from '@/components/student/documents/DocumentStatusBadge';

export function DocumentDetailsModal({ document, onClose }: { document: StudentDocument | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!document) return;
    const previousFocus = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    closeRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [document]);

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="document-details-heading" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-xl border border-[#DCE3EC] bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><FileText size={17} aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase text-[#2563A8]">Document details</p><h2 id="document-details-heading" className="mt-0.5 break-words text-base font-bold text-[#172033]">{document.name}</h2></div></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close document details" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><X size={17} aria-hidden="true" /></button></div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-[#EEF1F5] py-4"><div className="min-w-0"><dt className="text-[10px] text-[#64748B]">File</dt><dd className="mt-1 break-all text-xs font-semibold text-[#172033]">{document.fileName ?? 'No file uploaded'}</dd></div><div><dt className="text-[10px] text-[#64748B]">Category</dt><dd className="mt-1 break-words text-xs font-semibold text-[#172033]">{document.category}</dd></div><div><dt className="text-[10px] text-[#64748B]">Application scheme</dt><dd className="mt-1 break-words text-xs font-semibold text-[#172033]">{document.schemeName ?? '—'}</dd></div><div><dt className="text-[10px] text-[#64748B]">Uploaded</dt><dd className="mt-1 text-xs font-semibold text-[#172033]">{document.uploadedDate ?? 'Not uploaded'}</dd></div><div><dt className="text-[10px] text-[#64748B]">Status</dt><dd className="mt-1"><DocumentStatusBadge status={document.status} /></dd></div></dl>
        <p className="mt-4 text-xs leading-5 text-[#64748B]">
          {document.issue
            ? `Saved verification note: ${document.issue}`
            : document.status === 'Verified'
              ? 'The saved record indicates this document is verified.'
              : document.status === 'Under Review'
                ? 'The saved record indicates this document is awaiting verification.'
                : 'The saved record indicates this document needs attention.'}
        </p>
        <div className="mt-4 flex justify-end border-t border-[#EEF1F5] pt-3"><button type="button" onClick={onClose} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] bg-white px-4 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Close</button></div>
      </section>
    </div>
  );
}