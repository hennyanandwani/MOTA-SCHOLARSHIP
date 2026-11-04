"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, SearchX } from "lucide-react";
import { isSchemeRecord, type SchemeRecord } from "@/lib/scholarshipSchemeValidation";

type SchemePayload = {
  error?: string;
  schemes?: SchemeRecord[];
};

function isSchemePayload(value: unknown): value is SchemePayload {
  if (typeof value !== "object" || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    (payload.error === undefined || typeof payload.error === "string") &&
    (payload.schemes === undefined ||
      (Array.isArray(payload.schemes) && payload.schemes.every(isSchemeRecord)))
  );
}

export function DatabaseSchemeBrowser({ mode }: { mode: "all" | "recommended" }) {
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/student/schemes", { cache: "no-store" });
        const payload: unknown = await response.json();
        if (!isSchemePayload(payload) || !response.ok || !payload.schemes) {
          throw new Error(isSchemePayload(payload) ? payload.error ?? "Unable to load schemes." : "Invalid response from the server.");
        }
        if (active) setSchemes(payload.schemes);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load schemes.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [reloadKey]);

  const filteredSchemes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return schemes.filter((scheme) => (
      (typeFilter === "ALL" || scheme.type === typeFilter) &&
      (!normalizedQuery || `${scheme.name} ${scheme.description ?? ""} ${scheme.type}`.toLowerCase().includes(normalizedQuery))
    ));
  }, [query, schemes, typeFilter]);

  return (
    <section aria-label="Available scholarship schemes">
      <div className="mb-4 grid gap-3 rounded-xl border border-[#DCE3EC] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="text-xs font-semibold text-[#334155]">
          Search schemes
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search by name or description" className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE3EC] px-3 text-sm font-normal outline-none focus:border-[#2563A8]" />
        </label>
        <label className="text-xs font-semibold text-[#334155]">
          Scheme type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm font-normal">
            <option value="ALL">All types</option>
            <option value="SCHOLARSHIP">Scholarships</option>
            <option value="FELLOWSHIP">Fellowships</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p role="status" className="rounded-xl border border-[#DCE3EC] bg-white px-5 py-10 text-center text-sm text-[#64748B]">Loading available schemes...</p>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-white px-5 py-8 text-center">
          <p className="text-sm text-rose-800">{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 rounded-lg bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white">Try again</button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-[#64748B]" aria-live="polite">
            Showing {filteredSchemes.length} of {schemes.length} available schemes
          </p>
          {filteredSchemes.length ? (
            <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSchemes.map((scheme) => {
                const Icon = scheme.type === "FELLOWSHIP" ? GraduationCap : BookOpen;
                return (
                  <article key={scheme.id} className="flex min-w-0 flex-col rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                      {scheme.type === "SCHOLARSHIP" ? "Scholarship" : "Fellowship"}
                    </p>
                    <h2 className="mt-1 break-words text-base font-semibold leading-6 text-[#172033]">{scheme.name}</h2>
                    <p className="mt-2 flex-1 whitespace-pre-wrap text-xs leading-5 text-[#64748B]">
                      {scheme.description || "No description has been provided for this scheme."}
                    </p>
                    <Link href={`/student/schemes/${encodeURIComponent(scheme.id)}`} className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] px-3 py-2 text-xs font-semibold text-[#173F7A] hover:bg-[#F8FAFC]">
                      View details
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-[#DCE3EC] bg-white px-5 py-10 text-center">
              <SearchX size={20} className="mx-auto text-[#64748B]" aria-hidden="true" />
              <h2 className="mt-3 text-base font-semibold text-[#172033]">
                {schemes.length ? "No schemes match your filters" : "No active schemes are available"}
              </h2>
              <p className="mt-1 text-xs text-[#64748B]">
                {schemes.length ? "Try changing the search or scheme type." : "Please check again later."}
              </p>
              {mode === "recommended" && !schemes.length && (
                <p className="mt-3 text-xs text-[#64748B]">Recommendations require eligibility data that is not currently stored for schemes.</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
