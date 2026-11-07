'use client';

import { useState } from 'react';

type ApprovalRecord = {
  applicationNumber: string;
  applicantName: string;
  schemeName: string;
  academicYear: string;
  selectionOutcome: string;
  approvalStatus: 'PENDING_APPROVAL' | 'RETURNED_FOR_REVIEW';
};

export function ApprovalQueueClient({ applications }: { applications: ApprovalRecord[] }) {
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function update(record: ApprovalRecord, status: 'APPROVED' | 'RETURNED_FOR_REVIEW' | 'PENDING_APPROVAL') {
    const note = remarks[record.applicationNumber]?.trim() ?? '';
    if (note.length < 3) {
      setMessages((current) => ({ ...current, [record.applicationNumber]: 'Enter at least 3 characters of remarks.' }));
      return;
    }
    if (!window.confirm(`Confirm ${status.replaceAll('_', ' ').toLowerCase()} for ${record.applicationNumber}?`)) return;
    setSaving(record.applicationNumber);
    setMessages((current) => ({ ...current, [record.applicationNumber]: '' }));
    try {
      const response = await fetch(`/api/approver/applications/${encodeURIComponent(record.applicationNumber)}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, expectedStatus: record.approvalStatus, remarks: note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save approval.');
      setMessages((current) => ({ ...current, [record.applicationNumber]: `Saved: ${status}. Refresh to view the persisted decision.` }));
      setRemarks((current) => ({ ...current, [record.applicationNumber]: '' }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [record.applicationNumber]: error instanceof Error ? error.message : 'Unable to save approval.',
      }));
    } finally {
      setSaving(null);
    }
  }

  if (applications.length === 0) {
    return <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">No selected applications are awaiting separate approval.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
          <tr><th className="p-3">Application</th><th className="p-3">Selection</th><th className="p-3">Approval</th><th className="p-3">Decision</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((record) => (
            <tr key={record.applicationNumber}>
              <td className="p-3"><strong>{record.applicantName}</strong><span className="block font-mono text-xs">{record.applicationNumber}</span><span className="text-xs text-slate-500">{record.schemeName} · {record.academicYear}</span></td>
              <td className="p-3">{record.selectionOutcome}</td>
              <td className="p-3">{record.approvalStatus}</td>
              <td className="min-w-64 space-y-2 p-3">
                <textarea aria-label={`Approval remarks for ${record.applicationNumber}`} maxLength={2000} rows={2} placeholder="Required remarks" value={remarks[record.applicationNumber] ?? ''} onChange={(event) => setRemarks((current) => ({ ...current, [record.applicationNumber]: event.target.value }))} className="w-full rounded border border-slate-300 p-2" />
                <div className="flex flex-wrap gap-2">
                  {record.approvalStatus === 'PENDING_APPROVAL' ? (
                    <>
                      <button type="button" disabled={saving !== null} onClick={() => void update(record, 'APPROVED')} className="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve</button>
                      <button type="button" disabled={saving !== null} onClick={() => void update(record, 'RETURNED_FOR_REVIEW')} className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Return for review</button>
                    </>
                  ) : (
                    <button type="button" disabled={saving !== null} onClick={() => void update(record, 'PENDING_APPROVAL')} className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">Resubmit for approval</button>
                  )}
                </div>
                {messages[record.applicationNumber] && <p role="status" className="text-xs text-slate-600">{messages[record.applicationNumber]}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
