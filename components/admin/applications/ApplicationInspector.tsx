'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationStatus } from '@/lib/generated/prisma/client';
import type { AdminApplicationRecord } from '@/lib/adminData';
import type { AdminApplicationDetail } from '@/lib/adminApplicationData';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { X, FileText, User, Clock, Download, LoaderCircle } from 'lucide-react';

type ApplicationInspectorProps = {
  application: AdminApplicationRecord | null;
  onClose: () => void;
};

const transitions: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  SUBMITTED: [
    'PENDING_VERIFICATION',
    'FLAGGED_FOR_MANUAL_REVIEW',
    'RECOMMENDED_FOR_APPROVAL',
    'REJECTED_BY_OFFICER',
  ],
  PENDING_VERIFICATION: [
    'FLAGGED_FOR_MANUAL_REVIEW',
    'RECOMMENDED_FOR_APPROVAL',
    'REJECTED_BY_OFFICER',
  ],
  FLAGGED_FOR_MANUAL_REVIEW: [
    'PENDING_VERIFICATION',
    'RECOMMENDED_FOR_APPROVAL',
    'REJECTED_BY_OFFICER',
  ],
  RECOMMENDED_FOR_APPROVAL: [
    'APPROVED_BY_OFFICER',
    'REJECTED_BY_OFFICER',
  ],
};

export function ApplicationInspector({ application, onClose }: ApplicationInspectorProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<ApplicationStatus | ''>('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionNotice, setDecisionNotice] = useState<string | null>(null);

  const loadDetail = useCallback(async (signal?: AbortSignal) => {
    if (!application) return;
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(
        `/api/admin/applications/${encodeURIComponent(application.applicationId)}`,
        { signal, cache: 'no-store' },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to load application.');
      setDetail(payload.application as AdminApplicationDetail);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setLoadError(error instanceof Error ? error.message : 'Unable to load application.');
      setDetail(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [application]);

  useEffect(() => {
    if (!application) return;
    document.body.style.overflow = 'hidden';
    const controller = new AbortController();
    void loadDetail(controller.signal);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKeyDown);
      controller.abort();
    };
  }, [application, loadDetail, onClose]);

  if (!application) return null;
  const availableTransitions = detail ? (transitions[detail.status] ?? []) : [];

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || !decisionStatus || saving) return;
    setSaving(true);
    setDecisionError(null);
    setDecisionNotice(null);
    try {
      const response = await fetch(
        `/api/admin/applications/${encodeURIComponent(detail.applicationNumber)}/decision`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: decisionStatus, officer_remarks: remarks }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save decision.');
      setDecisionStatus('');
      setRemarks('');
      setDecisionNotice('Decision saved to the application record.');
      await loadDetail();
      router.refresh();
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : 'Unable to save decision.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="inspector-title">
      <button className="fixed inset-0 cursor-default bg-slate-900/40 backdrop-blur-xs" onClick={onClose} aria-label="Close application inspector" />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-[#DCE3EC] bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5">
          <div className="min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#173F7A]">{application.applicationId}</span>
              <ApplicationStatusBadge value={detail?.status ?? application.status} size="sm" />
            </div>
            <h2 id="inspector-title" className="mt-1 truncate text-base font-bold text-[#172033]">
              {detail?.applicant.name ?? application.applicantName}
            </h2>
            <p className="mt-0.5 truncate text-xs text-[#64748B]">{application.schemeName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close application inspector" className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-200/70">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 text-xs text-[#172033] sm:p-6">
          {loading && (
            <div className="flex items-center gap-2 rounded-lg border border-[#DCE3EC] p-4 text-[#64748B]">
              <LoaderCircle size={15} className="animate-spin" /> Loading persisted application details…
            </div>
          )}
          {loadError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">{loadError}</p>}

          {detail && (
            <>
              <section className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 border-b border-[#EEF1F5] pb-2.5 font-semibold">
                  <User size={15} className="text-[#173F7A]" /> Applicant and application
                </h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div><dt className="text-[#64748B]">Applicant</dt><dd className="font-semibold">{detail.applicant.name}</dd></div>
                  <div><dt className="text-[#64748B]">Email</dt><dd className="font-semibold break-all">{detail.applicant.email}</dd></div>
                  <div><dt className="text-[#64748B]">Roll number</dt><dd className="font-semibold">{detail.applicant.rollNumber}</dd></div>
                  <div><dt className="text-[#64748B]">Scheme</dt><dd className="font-semibold">{detail.scheme.name}</dd></div>
                  <div><dt className="text-[#64748B]">Academic year</dt><dd className="font-semibold">{detail.academicYear}</dd></div>
                  <div><dt className="text-[#64748B]">Submitted</dt><dd className="font-semibold">{detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : 'Not submitted'}</dd></div>
                </dl>
              </section>

              <section className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 border-b border-[#EEF1F5] pb-2.5 font-semibold">
                  <FileText size={15} className="text-[#173F7A]" /> Submitted form information
                </h3>
                {detail.formData
                  ? <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#F8FAFC] p-3 text-[11px]">{JSON.stringify(detail.formData, null, 2)}</pre>
                  : <p className="text-[#64748B]">No saved form data is available.</p>}
              </section>

              <section className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 border-b border-[#EEF1F5] pb-2.5 font-semibold">
                  <FileText size={15} className="text-[#173F7A]" /> Uploaded documents
                </h3>
                {detail.documents.length === 0
                  ? <p className="text-[#64748B]">No documents are attached to this application.</p>
                  : <ul className="space-y-2">
                    {detail.documents.map((file) => (
                      <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F8FAFC] p-3">
                        <div className="min-w-0">
                          <p className="break-all font-semibold">{file.originalName}</p>
                          <p className="mt-1 text-[11px] text-[#64748B]">
                            {file.type} · {file.mimeType} · {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB · {file.verificationStatus}
                          </p>
                          {file.verificationRemarks && <p className="mt-1 text-[11px]">{file.verificationRemarks}</p>}
                        </div>
                        <a
                          href={`/api/admin/applications/${encodeURIComponent(detail.applicationNumber)}/documents/${encodeURIComponent(file.id)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-[#DCE3EC] bg-white px-2.5 py-1.5 font-semibold text-[#173F7A]"
                        >
                          <Download size={13} /> Secure download
                        </a>
                      </li>
                    ))}
                  </ul>}
              </section>

              <section className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 border-b border-[#EEF1F5] pb-2.5 font-semibold">
                  <Clock size={15} className="text-[#173F7A]" /> AI verification
                </h3>
                {detail.aiConfidence === null && detail.aiRemarks === null
                  ? <p className="text-[#64748B]">Pending / Not run. No AI verification result is stored for this application.</p>
                  : <dl className="grid grid-cols-2 gap-3">
                    <div><dt className="text-[#64748B]">Persisted confidence</dt><dd className="font-semibold">{detail.aiConfidence ?? 'Not provided'}</dd></div>
                    <div><dt className="text-[#64748B]">Persisted remarks</dt><dd className="font-semibold">{detail.aiRemarks ?? 'Not provided'}</dd></div>
                  </dl>}
              </section>

              <section className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 border-b border-[#EEF1F5] pb-2.5 font-semibold">
                  <Clock size={15} className="text-[#173F7A]" /> Decision history
                </h3>
                {detail.decisions.length === 0
                  ? <p className="text-[#64748B]">No officer decisions have been recorded.</p>
                  : <ol className="space-y-3">
                    {detail.decisions.map((decision) => (
                      <li key={decision.id} className="border-l-2 border-[#DCE3EC] pl-3">
                        <p className="font-semibold">{decision.status} · {decision.officerName}</p>
                        <p className="text-[11px] text-[#64748B]">{new Date(decision.createdAt).toLocaleString()}</p>
                        {decision.officerRemarks && <p className="mt-1 whitespace-pre-wrap">{decision.officerRemarks}</p>}
                      </li>
                    ))}
                  </ol>}
              </section>

              {availableTransitions.length > 0 && (
                <form onSubmit={submitDecision} className="space-y-3 rounded-xl border border-[#DCE3EC] bg-white p-4">
                  <h3 className="font-semibold">Record review decision</h3>
                  <label className="block">
                    <span className="mb-1 block text-[#64748B]">Next status</span>
                    <select required value={decisionStatus} onChange={(event) => setDecisionStatus(event.target.value as ApplicationStatus)} className="w-full rounded-md border border-[#DCE3EC] bg-white px-3 py-2">
                      <option value="">Select a valid transition</option>
                      {availableTransitions.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[#64748B]">Officer remarks (required)</span>
                    <textarea required minLength={3} maxLength={2000} value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} className="w-full rounded-md border border-[#DCE3EC] px-3 py-2" />
                  </label>
                  {decisionError && <p role="alert" className="text-rose-700">{decisionError}</p>}
                  {decisionNotice && <p role="status" className="text-emerald-700">{decisionNotice}</p>}
                  <button disabled={saving || !decisionStatus} className="inline-flex items-center gap-2 rounded-lg bg-[#173F7A] px-4 py-2 font-semibold text-white disabled:opacity-50">
                    {saving && <LoaderCircle size={14} className="animate-spin" />}
                    Save decision
                  </button>
                </form>
              )}
            </>
          )}
          {!loading && !loadError && !detail && <p className="text-[#64748B]">Application details are unavailable.</p>}
        </div>
      </div>
    </div>
  );
}
