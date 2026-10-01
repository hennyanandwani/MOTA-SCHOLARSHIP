'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, FileText, X } from 'lucide-react';
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
  const hasAttentionDetails = document.id === 'central-income-certificate';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="document-details-heading" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-xl border border-[#DCE3EC] bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><FileText size={17} aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase text-[#2563A8]">Document details</p><h2 id="document-details-heading" className="mt-0.5 break-words text-base font-bold text-[#172033]">{document.name}</h2></div></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close document details" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><X size={17} aria-hidden="true" /></button></div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-[#EEF1F5] py-4"><div className="min-w-0"><dt className="text-[10px] text-[#64748B]">File</dt><dd className="mt-1 break-all text-xs font-semibold text-[#172033]">{document.fileName ?? 'No file uploaded'}</dd></div><div><dt className="text-[10px] text-[#64748B]">Category</dt><dd className="mt-1 break-words text-xs font-semibold text-[#172033]">{document.category}</dd></div><div><dt className="text-[10px] text-[#64748B]">Uploaded</dt><dd className="mt-1 text-xs font-semibold text-[#172033]">{document.uploadedDate ?? 'Not uploaded'}</dd></div><div><dt className="text-[10px] text-[#64748B]">Status</dt><dd className="mt-1"><DocumentStatusBadge status={document.status} /></dd></div></dl>
        {hasAttentionDetails ? <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"><h3 className="flex items-center gap-1.5 text-xs font-semibold text-[#80520B]"><AlertCircle size={14} aria-hidden="true" />AI-assisted document intelligence</h3><p className="mt-2 text-xs font-medium text-[#172033]">Issue: Information requires additional review.</p><p className="mt-1 text-xs leading-5 text-[#765719]">Some extracted information may not match the information provided in the application.</p><dl className="mt-3 grid gap-3 border-t border-amber-200 pt-3 sm:grid-cols-3"><DetailValue label="Document field" value="Applicant name" /><DetailValue label="Application value" value={document.applicationValue ?? 'Rahul Kumar'} /><DetailValue label="Extracted value" value={document.extractedValue ?? 'Rahul K. Kumar'} /></dl><p className="mt-3 text-[10px] font-semibold text-[#80520B]">Status: Review required</p><p className="mt-2 text-[10px] leading-4 text-[#64748B]">Automated document analysis is provided as assistance. Final verification is performed through the official review process.</p></section> : <p className="mt-4 text-xs leading-5 text-[#64748B]">{document.status === 'Verified' ? 'Document has completed the current verification step.' : document.status === 'Under Review' ? 'Document is currently under official review.' : document.status === 'Needs Attention' ? 'Additional action may be required. Review the instructions before replacing the document.' : 'No file has been added to this document record.'}</p>}
        <div className="mt-4 flex justify-end border-t border-[#EEF1F5] pt-3"><button type="button" onClick={onClose} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] bg-white px-4 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Close</button></div>
      </section>
    </div>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-[10px] text-[#765719]">{label}</dt><dd className="mt-1 break-words text-xs font-semibold text-[#172033]">{value}</dd></div>;
}