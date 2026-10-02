"use client";

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, CheckCircle2, AlertCircle, XCircle, Play } from 'lucide-react';
import { VerificationStatusBadge } from './VerificationStatusBadge';
import type { VerificationRecord } from '@/lib/adminVerificationData';

type VerificationInspectorProps = {
  record: VerificationRecord | null;
  onClose: () => void;
  onDecisionChange: (decision: VerificationRecord['reviewerDecision'], note?: string, reason?: string) => void;
  isOpen: boolean;
};

export function VerificationInspector({
  record,
  onClose,
  onDecisionChange,
  isOpen,
}: VerificationInspectorProps) {
  const [zoom, setZoom] = useState(100);
  const [decision, setDecision] = useState<VerificationRecord['reviewerDecision']>(record?.reviewerDecision);
  const [note, setNote] = useState(record?.reviewerNote || '');
  const [reason, setReason] = useState(record?.rejectionReason || '');
  const [sourceCheckLoading, setSourceCheckLoading] = useState(false);
  const [sourceCheckResult, setSourceCheckResult] = useState(record?.sourceCheck.status);

  if (!record) return null;

  const handleZoomIn = () => setZoom(z => Math.min(z + 10, 200));
  const handleZoomOut = () => setZoom(z => Math.max(z - 10, 50));
  const handleResetZoom = () => setZoom(100);

  const handleConfirmDecision = () => {
    if (!decision) return;
    if (decision === 'Reject Document' && !reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    onDecisionChange(decision, note || undefined, reason || undefined);
  };

  const handleRunSourceCheck = async () => {
    setSourceCheckLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const results = ['Demo Match', 'Demo Mismatch', 'Not Connected'] as const;
    const random = results[Math.floor(Math.random() * results.length)];
    setSourceCheckResult(random);
    setSourceCheckLoading(false);
  };

  const drawerClasses = isOpen
    ? 'fixed inset-0 z-50 lg:static lg:z-auto overflow-y-auto'
    : 'hidden lg:block';

  return (
    <div className={drawerClasses}>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div className="relative lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-full lg:max-w-2xl lg:border-l lg:border-[#DCE3EC] lg:bg-white bg-white">
        <div className="sticky top-0 z-40 flex items-start justify-between gap-3 border-b border-[#DCE3EC] bg-white px-4 py-4 lg:px-6 lg:py-5">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              {record.applicationId}
            </div>
            <h2 className="mt-1 text-base font-bold text-[#172033] lg:text-lg">
              {record.applicantName}
            </h2>
            <p className="mt-1 text-xs text-[#64748B] line-clamp-1">{record.documentName}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <VerificationStatusBadge status={record.verificationStatus} />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563A8] lg:hidden"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto px-4 py-6 lg:px-6 lg:max-h-[calc(100vh-120px)]">
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#475569]">
              Document Preview
            </h3>
            <div className="relative rounded-lg border border-[#DCE3EC] bg-slate-100 p-4">
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#DCE3EC] pb-3">
                <div>
                  <p className="text-xs font-semibold text-[#172033]">{record.fileName}</p>
                  <p className="text-[10px] text-[#64748B]">
                    {record.fileSize} • {record.documentType} • Uploaded {record.uploadedAt}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 hover:bg-slate-200 rounded transition text-[#475569]"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[10px] font-mono text-[#64748B] w-8 text-center">{zoom}%</span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 hover:bg-slate-200 rounded transition text-[#475569]"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1.5 hover:bg-slate-200 rounded transition text-[#475569]"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              <div
                className="mx-auto max-w-sm overflow-auto rounded border border-slate-300 bg-white p-8 text-center transition-transform"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              >
                <div className="text-[10px] font-bold tracking-widest text-red-600 mb-4 opacity-60">
                  DEMO DOCUMENT
                </div>
                <div className="text-[10px] font-bold tracking-widest text-red-600 mb-4 opacity-60">
                  NOT AN OFFICIAL GOVERNMENT DOCUMENT
                </div>
                <div className="border-b-2 border-slate-300 pb-4 mb-4">
                  <div className="text-lg font-bold text-slate-800">DEMO CERTIFICATE</div>
                </div>

                <div className="space-y-3 text-left text-xs">
                  <div>
                    <span className="font-semibold">Name:</span> {record.applicantName}
                  </div>
                  <div>
                    <span className="font-semibold">Type:</span> {record.documentType}
                  </div>
                  <div>
                    <span className="font-semibold">Issue Date:</span> 15 Aug 2026
                  </div>
                  <div>
                    <span className="font-semibold">Reference:</span> DEMO-{record.id}
                  </div>
                </div>

                <div className="mt-6 border-t-2 border-slate-300 pt-4 text-[9px] text-slate-600">
                  <p>Simulated for demonstration purposes only</p>
                  <p>Not legally valid</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-[#475569] transition hover:bg-slate-300"
                >
                  <Download size={12} />
                  Download Demo
                </button>
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#475569]">
              AI-Assisted OCR &amp; Data Extraction
            </h3>
            <div className="space-y-2">
              {record.extractedFields.map(field => (
                <div key={field.key} className="rounded-lg border border-[#DCE3EC] bg-white p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-semibold text-xs text-[#172033]">{field.label}</div>
                    <div className="text-[10px] text-[#64748B] font-mono">
                      {field.confidence}%
                    </div>
                  </div>
                  <div className="text-sm text-[#334155]">{field.value}</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${
                        field.confidence >= 95 ? 'bg-emerald-500' : field.confidence >= 90 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${field.confidence}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 p-2.5">
              <p className="text-[11px] text-[#173F7A] leading-relaxed">
                <strong>Note:</strong> AI/OCR results are assistance signals only. Final verification must be completed by an authorized official.
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#475569]">
              Application vs Document Cross-Check
            </h3>
            <div className="overflow-x-auto rounded-lg border border-[#DCE3EC]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#DCE3EC] bg-[#F8FAFC]">
                    <th className="p-2 text-left font-semibold text-[#475569]">Field</th>
                    <th className="p-2 text-left font-semibold text-[#475569]">Application</th>
                    <th className="p-2 text-left font-semibold text-[#475569]">Document</th>
                    <th className="p-2 text-center font-semibold text-[#475569]">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3EC]">
                  {record.crossCheckFields.map(field => (
                    <tr key={field.key} className="hover:bg-slate-50/50">
                      <td className="p-2 font-semibold text-[#172033]">{field.label}</td>
                      <td className="p-2 text-[#334155]">{field.applicationValue}</td>
                      <td className="p-2 text-[#334155]">{field.documentValue}</td>
                      <td className="p-2 text-center">
                        {field.status === 'Match' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#16805B]">
                            <CheckCircle2 size={10} /> Match
                          </span>
                        )}
                        {field.status === 'Mismatch' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-[#C2414B]">
                            <XCircle size={10} /> Mismatch
                          </span>
                        )}
                        {field.status === 'Unable to Compare' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-[#B7791F]">
                            <AlertCircle size={10} /> Unable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {record.flags.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#475569]">
                Verification Flags
              </h3>
              <div className="space-y-2">
                {record.flags.map(flag => (
                  <div
                    key={flag.id}
                    className={`rounded-lg border p-3 ${
                      flag.severity === 'High'
                        ? 'border-red-100 bg-red-50'
                        : flag.severity === 'Medium'
                        ? 'border-amber-100 bg-amber-50'
                        : 'border-blue-100 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={14}
                        className={`mt-0.5 shrink-0 ${
                          flag.severity === 'High'
                            ? 'text-[#C2414B]'
                            : flag.severity === 'Medium'
                            ? 'text-[#B7791F]'
                            : 'text-[#2563A8]'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-xs text-[#172033]">
                          {flag.description}
                        </div>
                        <div className="mt-1 text-[10px] text-[#475569]">
                          <strong>Field:</strong> {flag.relatedField} - <strong>Severity:</strong>{' '}
                          <span
                            className={`font-semibold ${
                              flag.severity === 'High'
                                ? 'text-[#C2414B]'
                                : flag.severity === 'Medium'
                                ? 'text-[#B7791F]'
                                : 'text-[#2563A8]'
                            }`}
                          >
                            {flag.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#475569]">
              Source Verification
            </h3>
            <div className="rounded-lg border border-[#DCE3EC] bg-white p-4">
              <div className="space-y-2 mb-3">
                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase mb-1">Source</div>
                  <div className="text-sm text-[#172033]">{record.sourceCheck.sourceName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase mb-1">Reference</div>
                  <div className="text-sm font-mono text-[#334155]">{record.sourceCheck.referenceId}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-[#64748B] uppercase mb-1">Status</div>
                  <div className="text-xs">
                    {sourceCheckResult === 'Demo Match' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-[#16805B]">
                        <CheckCircle2 size={12} />
                        Demo Match
                      </span>
                    )}
                    {sourceCheckResult === 'Demo Mismatch' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-1 font-semibold text-[#C2414B]">
                        <XCircle size={12} />
                        Demo Mismatch
                      </span>
                    )}
                    {sourceCheckResult === 'Not Connected' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 font-semibold text-[#64748B]">
                        <AlertCircle size={12} />
                        Not Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded bg-slate-50 border border-slate-200 p-2 mb-3 text-[10px] text-[#64748B]">
                <strong>Demo / Integration Placeholder</strong> — Never performs real external API verification
              </div>
              <button
                type="button"
                onClick={handleRunSourceCheck}
                disabled={sourceCheckLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#2563A8] bg-[#E0ECFF] px-3 py-2 text-xs font-semibold text-[#173F7A] transition hover:bg-blue-100 disabled:opacity-50"
              >
                <Play size={12} />
                {sourceCheckLoading ? 'Checking...' : 'Run Source Check'}
              </button>
            </div>
          </section>

          {record.aiSuggestedReview && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#475569]">
                AI Suggested Review
              </h3>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-[#173F7A] leading-relaxed">
                  <strong>AI Assistance:</strong> {record.aiSuggestedReview}
                </p>
              </div>
            </section>
          )}

          <section className="border-t border-[#DCE3EC] pt-6">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#475569]">
              Official Verification Decision
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                {(['Verify Document', 'Mark for Review', 'Reject Document'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDecision(opt)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      decision === opt
                        ? 'border-[#173F7A] bg-[#E0ECFF] text-[#173F7A]'
                        : 'border-[#DCE3EC] bg-white text-[#475569] hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {decision === 'Reject Document' && (
                <div>
                  <label htmlFor="verif-rejection-reason" className="mb-1 block text-xs font-semibold text-[#475569]">
                    Rejection Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="verif-rejection-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for document rejection..."
                    rows={3}
                    className="w-full rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-xs text-[#172033] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                </div>
              )}

              {(decision === 'Mark for Review' || decision === 'Verify Document') && (
                <div>
                  <label htmlFor="verif-reviewer-note" className="mb-1 block text-xs font-semibold text-[#475569]">
                    Reviewer Note
                  </label>
                  <textarea
                    id="verif-reviewer-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add reviewer comments or notes..."
                    rows={3}
                    className="w-full rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-xs text-[#172033] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={!decision}
                className="w-full rounded-lg bg-[#16805B] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#147049] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Decision
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}