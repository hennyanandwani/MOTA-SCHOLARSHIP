'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, FileCheck2, X } from 'lucide-react';
import { AiVerificationProgress } from '@/components/student/applications/AiVerificationProgress';

const buttonBase = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';

export function SubmitConfirmationModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef(onCancel);

  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const previousFocus = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    closeButton.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') cancelRef.current();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="submit-confirmation-title" className="w-full max-w-lg rounded-t-xl border border-[#DCE3EC] bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><FileCheck2 size={19} aria-hidden="true" /></span>
            <div><h2 id="submit-confirmation-title" className="text-base font-bold text-[#172033]">Submit application?</h2><p className="mt-1 text-xs leading-5 text-[#64748B]">Please confirm that you have reviewed your information and supporting documents. After submission, the application will proceed to the official verification workflow.</p></div>
          </div>
          <button ref={closeButton} type="button" aria-label="Close confirmation" onClick={onCancel} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><X size={17} aria-hidden="true" /></button>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#EEF1F5] pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className={`${buttonBase} w-full border border-[#DCE3EC] bg-white text-[#334155] hover:bg-[#F8FAFC] sm:w-auto`}>Cancel</button>
          <button type="button" onClick={onConfirm} className={`${buttonBase} w-full bg-[#173F7A] text-white hover:bg-[#123365] sm:w-auto`}>Confirm &amp; Submit<ArrowRight size={15} aria-hidden="true" /></button>
        </div>
      </section>
    </div>
  );
}

export function SubmissionSuccess({
  applicationId,
  submittedOn,
  schemeName,
}: {
  applicationId: string;
  submittedOn: string;
  schemeName: string;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-xl border border-emerald-200 bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#16805B]"><CheckCircle2 size={30} aria-hidden="true" /></span>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#16805B]">Submission recorded</p>
          <h1 className="mt-1 text-2xl font-bold text-[#172033]">Application Submitted Successfully</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">Your application has been submitted. Follow its AI verification status below; official review and decisions still follow.</p>
        </div>

        <dl className="mx-auto mt-6 grid max-w-2xl gap-4 border-y border-[#EEF1F5] py-4 sm:grid-cols-2">
          <div className="min-w-0"><dt className="text-[11px] text-[#64748B]">Application ID</dt><dd className="mt-1 break-all text-sm font-semibold text-[#172033]">{applicationId}</dd></div>
          <div className="min-w-0"><dt className="text-[11px] text-[#64748B]">Scheme</dt><dd className="mt-1 break-words text-sm font-semibold text-[#172033]">{schemeName}</dd></div>
          <div><dt className="text-[11px] text-[#64748B]">Submitted on</dt><dd className="mt-1 text-sm font-semibold text-[#172033]">{submittedOn}</dd></div>
          <div><dt className="text-[11px] text-[#64748B]">Status</dt><dd className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1D5796]"><Clock3 size={13} aria-hidden="true" />Submitted</dd></div>
        </dl>

        <div className="mx-auto mt-5 max-w-2xl">
          <AiVerificationProgress
            applicationId={applicationId}
            initialStatus="WAITING_FOR_CONFIGURATION"
          />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/student/applications" className={`${buttonBase} w-full bg-[#173F7A] text-white hover:bg-[#123365] sm:w-auto`}>Track Application<ArrowRight size={15} aria-hidden="true" /></Link>
          <Link href="/student" className={`${buttonBase} w-full border border-[#B8C9DC] bg-white text-[#173F7A] hover:bg-blue-50 sm:w-auto`}>Back to Dashboard</Link>
        </div>
      </section>

      <section aria-labelledby="status-note-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
        <h2 id="status-note-heading" className="text-sm font-semibold text-[#172033]">About this status</h2>
        <p className="mt-2 text-xs leading-5 text-[#64748B]">
          AI verification is informational and does not award a scholarship. Eligibility and any final decision are determined through the official review process.
        </p>
      </section>
    </div>
  );
}