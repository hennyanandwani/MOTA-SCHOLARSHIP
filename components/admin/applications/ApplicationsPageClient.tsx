'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Download, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ApplicationStats } from './ApplicationStats';
import { ApplicationFilters, type FilterState } from './ApplicationFilters';
import { ApplicationsTable } from './ApplicationsTable';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationPagination } from './ApplicationPagination';
import { ApplicationInspector } from './ApplicationInspector';
import type {
  AdminApplicationRecord,
  AdminDashboardMetrics,
} from '@/lib/adminData';

type ApplicationsPageClientProps = {
  initialApplications: AdminApplicationRecord[];
  metrics: AdminDashboardMetrics;
};

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  status: 'all',
  currentStage: 'all',
  verificationStatus: 'all',
  deficiencyStatus: 'all',
  scheme: 'all',
  state: 'all',
};

const PAGE_SIZE = 10;

export function ApplicationsPageClient({
  initialApplications,
  metrics,
}: ApplicationsPageClientProps) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedApp, setSelectedApp] = useState<AdminApplicationRecord | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Extract unique schemes & states for filter options
  const schemeOptions = useMemo(() => {
    const map = new Map<string, string>();
    initialApplications.forEach((app) => {
      if (!map.has(app.schemeId)) {
        map.set(app.schemeId, app.schemeName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [initialApplications]);

  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    initialApplications.forEach((app) => set.add(app.state));
    return Array.from(set).sort();
  }, [initialApplications]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return initialApplications.filter((app) => {
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase().trim();
        const match =
          app.applicationId.toLowerCase().includes(q) ||
          app.applicantName.toLowerCase().includes(q) ||
          app.schemeName.toLowerCase().includes(q) ||
          app.state.toLowerCase().includes(q) ||
          app.district.toLowerCase().includes(q) ||
          app.institutionName.toLowerCase().includes(q) ||
          app.course.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.status !== 'all' && app.status !== filters.status) return false;
      if (filters.currentStage !== 'all' && app.currentStage !== filters.currentStage) return false;
      if (filters.verificationStatus !== 'all' && app.verificationStatus !== filters.verificationStatus) return false;
      if (filters.deficiencyStatus !== 'all' && app.deficiencyStatus !== filters.deficiencyStatus) return false;
      if (filters.scheme !== 'all' && app.schemeId !== filters.scheme) return false;
      if (filters.state !== 'all' && app.state !== filters.state) return false;
      return true;
    });
  }, [initialApplications, filters]);

  const handleFilterChange = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredApplications.slice(start, start + PAGE_SIZE);
  }, [filteredApplications, currentPage]);

  const handleExportCSV = () => {
    if (filteredApplications.length === 0) return;

    const headers = [
      'Application ID',
      'Applicant Name',
      'Scheme',
      'State',
      'District',
      'Submitted Date',
      'Current Stage',
      'Status',
      'Verification Status',
      'Deficiency Status',
    ];

    const escapeCSV = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const rows = filteredApplications.map((app) => [
      escapeCSV(app.applicationId),
      escapeCSV(app.applicantName),
      escapeCSV(app.schemeName),
      escapeCSV(app.state),
      escapeCSV(app.district),
      escapeCSV(app.submittedDate),
      escapeCSV(app.currentStage),
      escapeCSV(app.status),
      escapeCSV(app.verificationStatus),
      escapeCSV(app.deficiencyStatus),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `mota-applications-registry-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${filteredApplications.length} application records to CSV.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <Link
              href="/admin"
              className="hover:text-[#2563A8] hover:underline focus:outline-none focus:ring-1 focus:ring-[#2563A8] rounded-sm"
            >
              Administration
            </Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="font-medium text-[#172033]" aria-current="page">
              Applications
            </span>
          </nav>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[#172033]">
            Application Registry
          </h1>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Search, review, and manage scholarship and fellowship applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredApplications.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3.5 py-2 text-xs font-semibold text-[#173F7A] shadow-xs hover:bg-[#F8FAFC] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#2563A8] transition-colors"
          >
            <Download size={14} aria-hidden="true" />
            <span>Export Applications</span>
          </button>
        </div>
      </div>

      {/* Export confirmation toast */}
      {exportNotice && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <ApplicationStats
        metrics={metrics}
        currentFilteredCount={filteredApplications.length}
        totalRegistryCount={initialApplications.length}
      />

      {/* Search & Filters */}
      <ApplicationFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        schemeOptions={schemeOptions}
        stateOptions={stateOptions}
        filteredCount={filteredApplications.length}
        totalCount={initialApplications.length}
      />

      {/* Desktop Table */}
      <section aria-label="Applications List">
        <div className="hidden lg:block">
          <ApplicationsTable
            applications={paginatedApplications}
            onSelect={(app) => setSelectedApp(app)}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Mobile / Tablet Cards */}
        <div className="block lg:hidden">
          {filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#DCE3EC] bg-white p-8 text-center shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
              <p className="text-sm font-semibold text-[#172033]">No applications found</p>
              <p className="mt-1 text-xs text-[#64748B]">
                Try adjusting your search or filters.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-4 rounded-lg bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173F7A]/90 focus:outline-none focus:ring-2 focus:ring-[#2563A8]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {paginatedApplications.map((app) => (
                <ApplicationCard
                  key={app.applicationId}
                  application={app}
                  onSelect={(selected) => setSelectedApp(selected)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pagination */}
      <ApplicationPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredApplications.length}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Application Inspector Drawer */}
      <ApplicationInspector
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
      />
    </div>
  );
}