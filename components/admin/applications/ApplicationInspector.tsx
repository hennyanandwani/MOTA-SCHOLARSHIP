'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ApplicationStatus } from '@/lib/generated/prisma/client';
import type { AdminApplicationRecord } from '@/lib/adminData';
import type { AdminApplicationDetail } from '@/lib/adminApplicationData';
import {
  getAllowedApplicationDecisionTransitions,
  getAllowedDocumentVerificationTransitions,
  isAiOutcomeAvailableForManualReview,
  isApplicationDocumentReviewable,
  isApplicationSubmitted,
} from '@/lib/adminWorkflow';
import { getStudentAiStatusLabel } from '@/lib/phase6Workflow';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { X, FileText, User, Clock, Download, LoaderCircle } from 'lucide-react';

type ApplicationInspectorProps = {
  application: AdminApplicationRecord | null;
  onClose: () => void;
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
  const [documentRemarks, setDocumentRemarks] = useState<Record<string, string>>({});
  const [savingDocumentId, setSavingDocumentId] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentNotice, setDocumentNotice] = useState<string | null>(null);
  const [aiActionReason, setAiActionReason] = useState('');
  const [aiAction, setAiAction] = useState<'retry' | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

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
  const canReview = detail
    ? isApplicationSubmitted(detail.status, detail.submittedAt)
    : false;
  const manualActionsEnabled = Boolean(
    detail &&
    canReview &&
    isAiOutcomeAvailableForManualReview(
      detail.aiVerificationStatus,
      detail.aiAttemptCount,
    ) &&
    ['PENDING', 'IN_PROGRESS', 'NEEDS_ATTENTION'].includes(detail.manualReviewStatus),
  );
  const availableTransitions = detail && manualActionsEnabled
    ? getAllowedApplicationDecisionTransitions(detail.status, detail.documents)
    : [];

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || !decisionStatus || saving) return;
    if (
      !window.confirm(
        `Confirm the ${decisionStatus.replaceAll('_', ' ').toLowerCase()} decision for ${detail.applicationNumber}?`,
      )
    ) return;
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

  async function updateDocumentVerification(
    file: AdminApplicationDetail['documents'][number],
    nextStatus: string,
  ) {
    if (!detail || savingDocumentId) return;
    if (
      !window.confirm(`Confirm marking ${file.originalName} as ${nextStatus.toLowerCase()}?`)
    ) return;

    setSavingDocumentId(file.id);
    setDocumentError(null);
    setDocumentNotice(null);
    try {
      const response = await fetch(
        `/api/admin/applications/${encodeURIComponent(detail.applicationNumber)}/documents/${encodeURIComponent(file.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: nextStatus,
            expectedStatus: file.verificationStatus,
            remarks: documentRemarks[file.id] ?? '',
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save document verification.');
      setDocumentRemarks((current) => ({ ...current, [file.id]: '' }));
      setDocumentNotice('Document verification saved.');
      await loadDetail();
      router.refresh();
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'Unable to save document verification.');
    } finally {
      setSavingDocumentId(null);
    }

  }

  async function requestAiReview() {
    if (!detail || aiAction || aiActionReason.trim().length < 3) return;
    if (!window.confirm(`Confirm technical AI retry request for ${detail.applicationNumber}?`)) return;
    setAiAction('retry');
    setAiError(null);
    setAiNotice(null);
    try {
      const response = await fetch(
        `/api/admin/applications/${encodeURIComponent(detail.applicationNumber)}/ai-review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'retry', reason: aiActionReason }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to record AI review request.');
      setAiActionReason('');
      setAiNotice(payload.message ?? 'AI review request recorded.');
      await loadDetail();
      router.refresh();
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unable to record AI review request.');
    } finally {
      setAiAction(null);
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
                <h4 className="mb-2 mt-4 border-t border-[#EEF1F5] pt-3 font-semibold">Persisted student profile</h4>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div><dt className="text-[#64748B]">Sub-caste</dt><dd className="font-semibold">{detail.applicant.profile.subCaste ?? 'Not provided'}</dd></div>
                  <div><dt className="text-[#64748B]">Annual income</dt><dd className="font-semibold">{detail.applicant.profile.annualIncome ?? 'Not provided'}</dd></div>
                  <div><dt className="text-[#64748B]">Academic percentage</dt><dd className="font-semibold">{detail.applicant.profile.academicPercentage ?? 'Not provided'}</dd></div>
                  <div><dt className="text-[#64748B]">Course</dt><dd className="font-semibold">{detail.applicant.profile.courseName ?? 'Not provided'}</dd></div>
                  <div><dt className="text-[#64748B]">Institution</dt><dd className="font-semibold">{detail.applicant.profile.instituteName ?? 'Not provided'}</dd></div>
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
                      <li key={file.id} className="space-y-3 rounded-lg bg-[#F8FAFC] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
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
                        </div>
                        {manualActionsEnabled && isApplicationDocumentReviewable(detail.status) && (
                          <div className="space-y-2 border-t border-[#DCE3EC] pt-3">
                            <label className="block">
                              <span className="mb-1 block text-[11px] text-[#64748B]">Verification remarks</span>
                              <textarea
                                aria-label={`Verification remarks for ${file.originalName}`}
                                value={documentRemarks[file.id] ?? ''}
                                onChange={(event) => setDocumentRemarks((current) => ({
                                  ...current,
                                  [file.id]: event.target.value,
                                }))}
                                maxLength={2000}
                                rows={2}
                                className="w-full rounded-md border border-[#DCE3EC] bg-white px-3 py-2"
                              />
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {getAllowedDocumentVerificationTransitions(file.verificationStatus).map((nextStatus) => (
                                <button
                                  key={nextStatus}
                                  type="button"
                                  disabled={savingDocumentId !== null}
                                  onClick={() => void updateDocumentVerification(file, nextStatus)}
                                  className="min-h-9 rounded-md border border-[#DCE3EC] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#173F7A] hover:bg-blue-50 disabled:opacity-50"
                                >
                                  {savingDocumentId === file.id ? 'Saving…' : `Mark ${nextStatus.toLowerCase()}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {file.verificationEvents.length > 0 && (
                          <ol className="space-y-1 border-t border-[#DCE3EC] pt-2 text-[11px] text-[#64748B]">
                            {file.verificationEvents.slice(0, 5).map((event) => (
                              <li key={event.id}>
                                {event.previousStatus} → {event.newStatus}
                                {event.reviewerName ? ` · ${event.reviewerName}` : ''}
                                {' · '}{new Date(event.createdAt).toLocaleString()}
                                {event.remarks ? ` · ${event.remarks}` : ''}
                              </li>
                            ))}
                          </ol>
                        )}
                      </li>
                    ))}
                  </ul>}
                {documentError && <p role="alert" className="mt-3 text-rose-700">{documentError}</p>}
                {documentNotice && <p role="status" className="mt-3 text-emerald-700">{documentNotice}</p>}
                {!canReview && (
                  <p className="mt-3 text-[11px] text-[#64748B]">Applications without a persisted submission timestamp are not eligible for verification or decisions.</p>
                )}
                {detail.submittedAt && !isApplicationDocumentReviewable(detail.status) && detail.status !== 'DRAFT' && (
                  <p className="mt-3 text-[11px] text-[#64748B]">Document review is locked for this application status.</p>
                )}
              </section>

              <section className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 border-b border-[#EEF1F5] pb-2.5 font-semibold">
                  <Clock size={15} className="text-[#173F7A]" /> AI verification
                </h3>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div><dt className="text-[#64748B]">Persisted result</dt><dd className="font-semibold">{getStudentAiStatusLabel(detail.aiVerificationStatus)}</dd></div>
                  <div><dt className="text-[#64748B]">Model / version</dt><dd className="font-semibold">{detail.aiModelVersion ?? 'Not provided'}</dd></div>
                  <div><dt className="text-[#64748B]">Confidence</dt><dd className="font-semibold">{detail.aiConfidence ?? 'Not provided'}</dd></div>
                  <div><dt className="text-[#64748B]">Completed</dt><dd className="font-semibold">{detail.aiCompletedAt ? new Date(detail.aiCompletedAt).toLocaleString() : 'Not completed'}</dd></div>
                </dl>
                {(detail.aiExplanation || detail.aiRemarks) && <p className="mt-3 whitespace-pre-wrap text-[#475569]">{detail.aiExplanation ?? detail.aiRemarks}</p>}
                {detail.studentAiReason && <p className="mt-2 text-[#64748B]">Student-facing reason: {detail.studentAiReason}</p>}
                {detail.aiVerificationStatus === 'FAILED' && (
                  <div className="mt-4 space-y-2 border-t border-[#EEF1F5] pt-3">
                    <label className="block">
                      <span className="mb-1 block text-[#64748B]">Reason for technical retry</span>
                      <textarea value={aiActionReason} onChange={(event) => setAiActionReason(event.target.value)} maxLength={2000} rows={2} className="w-full rounded-md border border-[#DCE3EC] px-3 py-2" />
                    </label>
                    <button type="button" disabled={aiAction !== null || aiActionReason.trim().length < 3} onClick={() => void requestAiReview()} className="rounded-md border border-[#DCE3EC] px-3 py-2 font-semibold text-[#173F7A] disabled:opacity-50">
                      {aiAction ? 'Recording…' : 'Request retry'}
                    </button>
                    {aiError && <p role="alert" className="text-rose-700">{aiError}</p>}
                    {aiNotice && <p role="status" className="text-emerald-700">{aiNotice}</p>}
                    <p className="text-[11px] text-[#64748B]">This records an auditable request; no external AI call is sent until the service adapter is configured.</p>
                  </div>
                )}
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

              {(detail.selectionDecisions.length > 0 || detail.approvalDecisions.length > 0) && (
                <section className="rounded-xl border border-[#DCE3EC] bg-white p-4">
                  <h3 className="mb-3 border-b border-[#EEF1F5] pb-2.5 font-semibold">Selection and approval history</h3>
                  <ol className="space-y-3">
                    {detail.selectionDecisions.map((decision) => (
                      <li key={decision.id} className="border-l-2 border-[#DCE3EC] pl-3">
                        <p className="font-semibold">{decision.outcome.replaceAll('_', ' ')} · {decision.reviewerName}</p>
                        <p className="text-[11px] text-[#64748B]">{new Date(decision.createdAt).toLocaleString()}</p>
                        <p>{decision.remarks}</p>
                      </li>
                    ))}
                    {detail.approvalDecisions.map((decision) => (
                      <li key={decision.id} className="border-l-2 border-[#DCE3EC] pl-3">
                        <p className="font-semibold">{decision.status.replaceAll('_', ' ')} · {decision.actorName ?? decision.actorType}</p>
                        <p className="text-[11px] text-[#64748B]">{new Date(decision.createdAt).toLocaleString()}</p>
                        <p>{decision.remarks}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

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
