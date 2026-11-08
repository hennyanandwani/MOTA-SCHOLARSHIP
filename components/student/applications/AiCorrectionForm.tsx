'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApplicationDocumentLabel } from '@/lib/applicationRequirements';

type AiCorrectionFormProps = {
  applicationId: string;
  hasCorrection: boolean;
  requiredDocumentTypes: readonly string[];
};

export function AiCorrectionForm({
  applicationId,
  hasCorrection: initialHasCorrection,
  requiredDocumentTypes,
}: AiCorrectionFormProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(requiredDocumentTypes[0] ?? 'CASTE_CERTIFICATE');
  const [file, setFile] = useState<File | null>(null);
  const [hasCorrection, setHasCorrection] = useState(initialHasCorrection);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadCorrection() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('type', selectedType);
      const response = await fetch(
        `/api/student/applications/${encodeURIComponent(applicationId)}/documents`,
        { method: 'POST', body },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to upload the corrected document.');
      setFile(null);
      setHasCorrection(true);
      setMessage('Corrected document uploaded. Resubmit when your corrections are complete.');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to upload the corrected document.');
    } finally {
      setBusy(false);
    }
  }

  async function resubmit() {
    if (!hasCorrection || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/student/applications/${encodeURIComponent(applicationId)}/submit`,
        { method: 'POST' },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Unable to resubmit the application.');
      setMessage('Corrected application resubmitted for verification.');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to resubmit the application.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div>
        <h2 className="font-semibold text-amber-950">Correct documents and resubmit</h2>
        <p className="mt-1 text-sm text-amber-900">
          Upload a corrected document before requesting the next verification. You may correct documents after each of the first three AI ineligibility results.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
        <label className="text-sm font-medium text-slate-700">
          Document type
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as typeof selectedType)}
            className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-2"
          >
            {requiredDocumentTypes.map((type) => (
              <option key={type} value={type}>{getApplicationDocumentLabel(type)}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Corrected file
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white text-sm"
          />
        </label>
        <button
          type="button"
          disabled={!file || busy}
          onClick={() => void uploadCorrection()}
          className="min-h-10 rounded-md border border-amber-400 bg-white px-3 text-sm font-semibold text-amber-950 disabled:opacity-50"
        >
          Upload correction
        </button>
      </div>
      <button
        type="button"
        disabled={!hasCorrection || busy}
        onClick={() => void resubmit()}
        className="min-h-10 rounded-md bg-[#173F7A] px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? 'Processing…' : 'Resubmit corrected application'}
      </button>
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-800">{message}</p>}
    </section>
  );
}
