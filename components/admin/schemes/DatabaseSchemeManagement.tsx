"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Edit3, Plus, RefreshCw, X } from "lucide-react";
import {
  isSchemeRecord,
  type PersistedSchemeType,
  type SchemeRecord,
} from "@/lib/scholarshipSchemeValidation";

type SchemePayload = {
  error?: string;
  schemes?: SchemeRecord[];
  scheme?: SchemeRecord;
};

function isSchemePayload(value: unknown): value is SchemePayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    (payload.schemes === undefined ||
      (Array.isArray(payload.schemes) && payload.schemes.every(isSchemeRecord))) &&
    (payload.scheme === undefined || isSchemeRecord(payload.scheme)) &&
    (payload.error === undefined || typeof payload.error === "string")
  );
}

const fieldClass =
  "mt-1.5 min-h-10 w-full rounded-lg border border-[#DCE3EC] bg-white px-3 py-2 text-sm text-[#172033] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100";

export function DatabaseSchemeManagement() {
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PersistedSchemeType>("SCHOLARSHIP");
  const [isActive, setIsActive] = useState(true);

  async function loadSchemes() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/schemes", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!isSchemePayload(payload) || !response.ok || !payload.schemes) {
        throw new Error(isSchemePayload(payload) ? payload.error ?? "Unable to load schemes." : "Invalid response from the server.");
      }
      setSchemes(payload.schemes);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load schemes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchemes();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setType("SCHOLARSHIP");
    setIsActive(true);
    setError("");
  }

  function beginEdit(scheme: SchemeRecord) {
    setEditingId(scheme.id);
    setName(scheme.name);
    setDescription(scheme.description ?? "");
    setType(scheme.type);
    setIsActive(scheme.isActive);
    setError("");
    setNotice("");
  }

  async function saveScheme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const schemeId = editingId && editingId !== "__new__" ? editingId : null;
    try {
      const response = await fetch(
        schemeId ? `/api/admin/schemes/${encodeURIComponent(schemeId)}` : "/api/admin/schemes",
        {
          method: schemeId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, type, isActive }),
        },
      );
      const payload: unknown = await response.json();
      if (!isSchemePayload(payload) || !response.ok || !payload.scheme) {
        throw new Error(isSchemePayload(payload) ? payload.error ?? "Unable to save the scheme." : "Invalid response from the server.");
      }
      setNotice(schemeId ? "Scheme updated." : "Scheme created.");
      resetForm();
      await loadSchemes();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the scheme.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(scheme: SchemeRecord) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/schemes/${encodeURIComponent(scheme.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !scheme.isActive }),
      });
      const payload: unknown = await response.json();
      if (!isSchemePayload(payload) || !response.ok || !payload.scheme) {
        throw new Error(isSchemePayload(payload) ? payload.error ?? "Unable to update scheme status." : "Invalid response from the server.");
      }
      setSchemes((current) => current.map((item) => item.id === scheme.id ? payload.scheme! : item));
      setNotice(`${scheme.name} is now ${payload.scheme.isActive ? "active" : "inactive"}.`);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update scheme status.");
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 text-xs text-[#64748B]">
            <span>Administration</span><span className="px-2">/</span>
            <span aria-current="page" className="font-medium text-[#172033]">Scheme Administration</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Scheme Administration</h1>
          <p className="mt-1 text-sm leading-5 text-[#64748B]">
            Manage scheme name, description, type, and availability.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setEditingId("__new__"); setNotice(""); }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white hover:bg-[#123362]"
        >
          <Plus size={16} aria-hidden="true" /> Add scheme
        </button>
      </header>

      <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-[#334155]">
        The current database schema does not store application dates, benefit amounts, or eligibility criteria. Those details are not editable here.
      </p>

      {notice && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

      {editingId && (
        <form onSubmit={saveScheme} className="grid gap-4 rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm md:grid-cols-2">
          <h2 className="text-base font-semibold text-[#172033] md:col-span-2">
            {editingId === "__new__" ? "Create scheme" : "Edit scheme"}
          </h2>
          <label className="text-xs font-semibold text-[#334155]">
            Scheme name
            <input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
          </label>
          <label className="text-xs font-semibold text-[#334155]">
            Scheme type
            <select value={type} onChange={(event) => setType(event.target.value as PersistedSchemeType)} className={fieldClass}>
              <option value="SCHOLARSHIP">Scholarship</option>
              <option value="FELLOWSHIP">Fellowship</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-[#334155] md:col-span-2">
            Description
            <textarea maxLength={4000} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className={`${fieldClass} resize-y`} />
          </label>
          <label className="inline-flex min-h-10 items-center gap-2 text-sm text-[#334155]">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Available to students
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white disabled:opacity-60">
              <Check size={16} aria-hidden="true" />{saving ? "Saving..." : "Save scheme"}
            </button>
            <button type="button" onClick={resetForm} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DCE3EC] px-4 text-sm font-semibold text-[#334155]">
              <X size={16} aria-hidden="true" /> Cancel
            </button>
          </div>
        </form>
      )}

      <section aria-label="Scholarship schemes" className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EEF1F5] px-5 py-4">
          <h2 className="font-semibold text-[#172033]">Schemes ({schemes.length})</h2>
          <button type="button" onClick={() => void loadSchemes()} className="inline-flex items-center gap-2 text-xs font-semibold text-[#2563A8]">
            <RefreshCw size={14} aria-hidden="true" /> Refresh
          </button>
        </div>
        {loading ? (
          <p role="status" className="px-5 py-10 text-center text-sm text-[#64748B]">Loading schemes...</p>
        ) : schemes.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#64748B]">No schemes have been created yet.</p>
        ) : (
          <ul className="divide-y divide-[#EEF1F5]">
            {schemes.map((scheme) => (
              <li key={scheme.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold text-[#172033]">{scheme.name}</h3>
                  <p className="mt-1 text-xs text-[#64748B]">
                    {scheme.type === "SCHOLARSHIP" ? "Scholarship" : "Fellowship"}
                    {" · "}{scheme.isActive ? "Active" : "Inactive"}
                  </p>
                  {scheme.description && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#475569]">{scheme.description}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => beginEdit(scheme)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#DCE3EC] px-3 text-xs font-semibold text-[#334155]">
                    <Edit3 size={14} aria-hidden="true" /> Edit
                  </button>
                  <button type="button" onClick={() => void toggleActive(scheme)} className="min-h-9 rounded-lg border border-[#DCE3EC] px-3 text-xs font-semibold text-[#334155]">
                    {scheme.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
