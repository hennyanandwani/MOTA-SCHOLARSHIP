'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AdminApplicationRecord } from '@/lib/adminData';

type Props = { applications: AdminApplicationRecord[] };
type Outcome = 'SELECTED' | 'WAITLISTED' | 'NOT_RECOMMENDED';

export function SelectionWorkflowClient({ applications }: Props) {
  const [values, setValues] = useState<Record<string, Outcome | ''>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const filteredApplications = applications.filter((application) => {
    const text = `${application.applicationId} ${application.applicantName} ${application.schemeName}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) &&
      (!outcomeFilter || application.selectionOutcome === outcomeFilter);
  });

  async function save(application: AdminApplicationRecord, nextOutcome: Outcome) {
    const applicationId = application.applicationId;
    const note = remarks[applicationId]?.trim() ?? '';
    if (note.length < 3) {
      setMessages((current) => ({ ...current, [applicationId]: 'Enter at least 3 characters of remarks.' }));
      return;
    }
    if (!window.confirm(`Confirm ${nextOutcome.replaceAll('_', ' ').toLowerCase()} for ${applicationId}?`)) return;

    setSaving(applicationId);
    setMessages((current) => ({ ...current, [applicationId]: '' }));
    try {
      const response = await fetch(`/api/admin/applications/${encodeURIComponent(applicationId)}/selection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: nextOutcome,
          expectedOutcome: application.selectionOutcome ?? null,
          remarks: note,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save selection outcome.');
      setMessages((current) => ({ ...current, [applicationId]: `Saved: ${nextOutcome}. Refresh to view the persisted decision.` }));
      setValues((current) => ({ ...current, [applicationId]: '' }));
      setRemarks((current) => ({ ...current, [applicationId]: '' }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [applicationId]: error instanceof Error ? error.message : 'Unable to save selection outcome.',
      }));
    } finally {
      setSaving(null);
    }
  }

  if (applications.length === 0) {
    return (
      <section className="rounded-xl border border-[#DCE3EC] bg-white p-8 text-center">
        <p className="font-semibold text-[#172033]">No verified recommendations are ready for selection</p>
        <p className="mt-1 text-sm text-[#64748B]">An application appears here only after AI eligibility and complete manual verification.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#DCE3EC] p-4 sm:flex-row">
        <label className="flex-1 text-xs font-medium text-[#475569]">
          Search recommendations
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-1 w-full rounded-md border border-[#DCE3EC] px-3 py-2 text-sm" placeholder="Application, student, or scheme" />
        </label>
        <label className="text-xs font-medium text-[#475569]">
          Current outcome
          <select value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value)} className="mt-1 block w-full rounded-md border border-[#DCE3EC] bg-white px-3 py-2 text-sm">
            <option value="">All outcomes</option>
            <option value="SELECTED">Selected</option>
            <option value="WAITLISTED">Waitlisted</option>
            <option value="NOT_RECOMMENDED">Not Recommended</option>
          </select>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
            <tr>
              <th className="px-4 py-3">Application / applicant</th>
              <th className="px-4 py-3">Current outcome</th>
              <th className="px-4 py-3">Approval</th>
              <th className="px-4 py-3">Record outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF1F5]">
            {filteredApplications.map((application) => {
              const applicationId = application.applicationId;
              return (
                <tr key={applicationId}>
                  <td className="min-w-52 px-4 py-4">
                    <Link className="font-mono text-xs font-semibold text-[#173F7A] hover:underline" href={`/admin/applications?searchQuery=${encodeURIComponent(applicationId)}`}>{applicationId}</Link>
                    <span className="mt-1 block">{application.applicantName}</span>
                    <span className="block text-xs text-[#64748B]">{application.schemeName} · {application.academicYear}</span>
                  </td>
                  <td className="px-4 py-4">{application.selectionOutcome ?? 'Not decided'}</td>
                  <td className="px-4 py-4">{application.approvalStatus ?? 'Not pending'}</td>
                  <td className="min-w-64 px-4 py-4">
                    <div className="space-y-2">
                      <select
                        aria-label={`Selection outcome for ${applicationId}`}
                        value={values[applicationId] ?? ''}
                        onChange={(event) => setValues((current) => ({
                          ...current,
                          [applicationId]: event.target.value as Outcome | '',
                        }))}
                        className="w-full rounded-md border border-[#DCE3EC] bg-white px-2 py-2"
                      >
                        <option value="">Choose an outcome</option>
                        <option value="SELECTED">Selected</option>
                        <option value="WAITLISTED">Waitlisted</option>
                        <option value="NOT_RECOMMENDED">Not Recommended</option>
                      </select>
                      <textarea
                        aria-label={`Selection remarks for ${applicationId}`}
                        value={remarks[applicationId] ?? ''}
                        onChange={(event) => setRemarks((current) => ({ ...current, [applicationId]: event.target.value }))}
                        placeholder="Required remarks"
                        maxLength={2000}
                        rows={2}
                        className="w-full rounded-md border border-[#DCE3EC] px-2 py-2"
                      />
                      <button
                        type="button"
                        disabled={!values[applicationId] || saving !== null}
                        onClick={() => {
                          const outcome = values[applicationId];
                          if (outcome) void save(application, outcome);
                        }}
                        className="rounded-md bg-[#173F7A] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {saving === applicationId ? 'Saving…' : 'Save outcome'}
                      </button>
                      {messages[applicationId] && <p role="status" className="text-xs text-[#475569]">{messages[applicationId]}</p>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredApplications.length === 0 && <p className="p-6 text-center text-sm text-[#64748B]">No selection records match these filters.</p>}
    </section>
  );
}
