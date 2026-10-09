'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { DeficiencyStats } from '@/components/admin/deficiencies/DeficiencyStats';
import { DeficiencyFilters, type DeficiencyFiltersState } from '@/components/admin/deficiencies/DeficiencyFilters';
import { DeficiencyQueue } from '@/components/admin/deficiencies/DeficiencyQueue';
import { DeficiencyCard } from '@/components/admin/deficiencies/DeficiencyCard';
import type { DeficiencyRecord } from '@/lib/adminDeficiencyData';
import { getInitialDeficiencyRecords, reloadDeficiencyRecords, saveDeficiencyRecordsToLocalStorage } from '@/lib/adminDeficiencyData';
import { adminNavigation } from '@/lib/navigation';

export default function DeficienciesPage() {
  const [records, setRecords] = useState<DeficiencyRecord[]>(() => getInitialDeficiencyRecords());
  const [selectedRecord, setSelectedRecord] = useState<DeficiencyRecord | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [refreshError, setRefreshError] = useState(false);
  const [filters, setFilters] = useState<DeficiencyFiltersState>({
    search: '',
    status: 'all',
    severity: 'all',
    type: 'all',
    scheme: '',
    state: '',
    sortBy: 'newest',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const searchValue = new URLSearchParams(window.location.search).get('search');
    if (searchValue) setFilters((current) => ({ ...current, search: searchValue }));
  }, []);

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.applicationId.toLowerCase().includes(q) ||
          r.applicantName.toLowerCase().includes(q) ||
          r.deficiency.toLowerCase().includes(q)
      );
    }
    if (filters.status !== 'all') result = result.filter((r) => r.status === filters.status);
    if (filters.severity !== 'all') result = result.filter((r) => r.severity === filters.severity);
    if (filters.sortBy === 'newest') {
      result.sort((a, b) => new Date(b.raisedDate).getTime() - new Date(a.raisedDate).getTime());
    } else if (filters.sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.raisedDate).getTime() - new Date(b.raisedDate).getTime());
    } else if (filters.sortBy === 'severity-high') {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      result.sort((a, b) => order[a.severity] - order[b.severity]);
    }
    return result;
  }, [records, filters]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(start, start + recordsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshMessage('');
    window.setTimeout(() => {
      try {
        const result = reloadDeficiencyRecords();
        setRecords(result.records);
        setCurrentPage(1);
        setRefreshMessage(result.error ?? 'Deficiency registry refreshed.');
        setRefreshError(Boolean(result.error));
      } catch {
        setRefreshMessage('Unable to refresh the deficiency registry.');
        setRefreshError(true);
      } finally {
        setRefreshing(false);
      }
    }, 350);
  };

  const handleUpdate = (id: string, updates: Partial<DeficiencyRecord>) => {
    const updated = records.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setRecords(updated);
    saveDeficiencyRecordsToLocalStorage(updated);
    if (selectedRecord?.id === id) setSelectedRecord({ ...selectedRecord, ...updates });
  };

  const handleExport = () => {
    const csv = [
      ['Deficiency ID', 'Application ID', 'Applicant', 'Scheme', 'State', 'Deficiency', 'Type', 'Severity', 'Status'].join(','),
      ...filteredRecords.map((r) =>
        [r.id, r.applicationId, r.applicantName, r.scheme, r.state, r.deficiency, r.deficiencyType, r.severity, r.status]
          .map((v) => `"${v}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deficiencies-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        title="Deficiency Management"
        subtitle="Identify application deficiencies, issue notices, and track correction and resubmission"
        role="MoTA Administration"
        context="admin"
      />
      <Sidebar items={adminNavigation} title="Administration" context="admin" />
      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div>
          <div className="mb-2 text-xs font-medium text-[#64748B]">Administration / Deficiencies</div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#172033]">Deficiency Management</h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Identify application deficiencies, issue notices, track student responses, and manage the correction and resubmission process.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-4 py-2 text-sm font-semibold text-[#172033] transition-colors hover:bg-[#F6F8FB]"
              >
                <Download size={16} />
                Export
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-4 py-2 text-sm font-semibold text-[#172033] transition-colors hover:bg-[#F6F8FB] disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
          {refreshMessage && (
            <p role={refreshError ? 'alert' : 'status'} className={`mt-2 text-xs ${refreshError ? 'text-[#A8323D]' : 'text-[#64748B]'}`}>{refreshMessage}</p>
          )}
        </div>

        <DeficiencyStats records={records} />
        <DeficiencyFilters filters={filters} setFilters={setFilters} totalCount={records.length} filteredCount={filteredRecords.length} />

        <div className="hidden lg:block">
          <DeficiencyQueue records={paginatedRecords} onReview={setSelectedRecord} />
        </div>

        <div className="space-y-3 lg:hidden">
          {paginatedRecords.map((record) => (
            <DeficiencyCard key={record.id} record={record} onReview={setSelectedRecord} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-[#DCE3EC] bg-white px-4 py-2 text-sm font-semibold text-[#172033] transition-colors hover:bg-[#F6F8FB] disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-[#64748B]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-[#DCE3EC] bg-white px-4 py-2 text-sm font-semibold text-[#172033] transition-colors hover:bg-[#F6F8FB] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#172033]">Deficiency Review</h2>
              <button onClick={() => setSelectedRecord(null)} className="text-[#64748B] hover:text-[#172033]">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#64748B]">Application ID</div>
                <div className="text-sm font-semibold text-[#172033]">{selectedRecord.applicationId}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Applicant</div>
                <div className="text-sm font-semibold text-[#172033]">{selectedRecord.applicantName}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Deficiency</div>
                <div className="text-sm text-[#172033]">{selectedRecord.deficiency}</div>
              </div>
              <div>
                <div className="text-xs text-[#64748B]">Description</div>
                <div className="text-sm text-[#172033]">{selectedRecord.description}</div>
              </div>
              <button
                onClick={() => {
                  handleUpdate(selectedRecord.id, {
                    status: 'Resolved',
                    activities: [
                      ...selectedRecord.activities,
                      {
                        id: `A${selectedRecord.activities.length + 1}`,
                        timestamp: new Date().toLocaleString(),
                        action: 'Deficiency resolved',
                        actor: 'MoTA Administrator',
                        type: 'reviewer',
                      },
                    ],
                  });
                  setSelectedRecord(null);
                }}
                className="w-full rounded-lg bg-[#173F7A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2563A8]"
              >
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
