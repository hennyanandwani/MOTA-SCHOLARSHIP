"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { adminNavigation } from "@/lib/navigation";

import {
  getInitialVerificationRecords,
  LOCALSTORAGE_VERIFICATION_KEY,
  saveVerificationRecordsToLocalStorage,
} from "@/lib/adminVerificationData";

import { VerificationStats } from "@/components/admin/verification/VerificationStats";
import {
  VerificationFilters,
  type VerificationFilterState,
} from "@/components/admin/verification/VerificationFilters";
import { VerificationQueue } from "@/components/admin/verification/VerificationQueue";
import { VerificationCard } from "@/components/admin/verification/VerificationCard";
import { VerificationInspector } from "@/components/admin/verification/VerificationInspector";

import type { VerificationRecord } from "@/lib/adminVerificationData";

export default function VerificationPage() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] =
    useState<VerificationRecord | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState<VerificationFilterState>({
    searchQuery: "",
    verificationStatus: "all",
    aiMatch: "all",
    documentType: "",
    schemeId: "",
    state: "",
    priority: "all",
    sortBy: "newest",
  });

  // Load records from localStorage
  useEffect(() => {
    const searchValue = new URLSearchParams(window.location.search).get("searchQuery");
    if (searchValue) setFilters((current) => ({ ...current, searchQuery: searchValue }));

    const stored = localStorage.getItem(
      LOCALSTORAGE_VERIFICATION_KEY
    );

    if (stored) {
      try {
        setRecords(JSON.parse(stored));
      } catch {
        setRecords(getInitialVerificationRecords());
      }
    } else {
      setRecords(getInitialVerificationRecords());
    }
  }, []);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Search
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();

      result = result.filter(
        (r) =>
          r.applicationId.toLowerCase().includes(q) ||
          r.applicantName.toLowerCase().includes(q) ||
          r.documentName.toLowerCase().includes(q) ||
          r.schemeName.toLowerCase().includes(q)
      );
    }

    // Verification status
    if (filters.verificationStatus !== "all") {
      result = result.filter(
        (r) =>
          r.verificationStatus ===
          filters.verificationStatus
      );
    }

    // AI match
    if (filters.aiMatch !== "all") {
      result = result.filter(
        (r) => r.aiMatch === filters.aiMatch
      );
    }

    // Document type
    if (filters.documentType) {
      result = result.filter(
        (r) => r.documentType === filters.documentType
      );
    }

    // Scheme
    if (filters.schemeId) {
      result = result.filter(
        (r) => r.schemeId === filters.schemeId
      );
    }

    // State
    if (filters.state) {
      result = result.filter(
        (r) => r.state === filters.state
      );
    }

    // Priority
    if (filters.priority !== "all") {
      result = result.filter(
        (r) => r.priority === filters.priority
      );
    }

    // Sorting
    if (filters.sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() -
          new Date(a.uploadedAt).getTime()
      );
    } else if (filters.sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.uploadedAt).getTime() -
          new Date(b.uploadedAt).getTime()
      );
    } else if (filters.sortBy === "priority-high") {
      const priorityOrder = {
        High: 0,
        Medium: 1,
        Low: 2,
      };

      result.sort(
        (a, b) =>
          priorityOrder[a.priority] -
          priorityOrder[b.priority]
      );
    } else if (filters.sortBy === "priority-low") {
      const priorityOrder = {
        High: 2,
        Medium: 1,
        Low: 0,
      };

      result.sort(
        (a, b) =>
          priorityOrder[a.priority] -
          priorityOrder[b.priority]
      );
    }

    return result;
  }, [records, filters]);

  const handleFilterChange = <
    K extends keyof VerificationFilterState
  >(
    key: K,
    value: VerificationFilterState[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: "",
      verificationStatus: "all",
      aiMatch: "all",
      documentType: "",
      schemeId: "",
      state: "",
      priority: "all",
      sortBy: "newest",
    });
  };

  const handleSelectRecord = (
    record: VerificationRecord
  ) => {
    setSelectedRecord(record);
    setInspectorOpen(true);
  };

  const handleCloseInspector = useCallback(() => {
    setInspectorOpen(false);
    setSelectedRecord(null);
  }, []);

  const handleDecisionChange = (
    decision: VerificationRecord["reviewerDecision"],
    note?: string,
    reason?: string
  ) => {
    if (!selectedRecord) return;

    const updatedRecord: VerificationRecord = {
      ...selectedRecord,

      verificationStatus:
        decision === "Verify Document"
          ? "Verified"
          : decision === "Reject Document"
            ? "Rejected"
            : "Under Review",

      reviewerDecision: decision,
      reviewerNote: note,
      rejectionReason: reason,
      decisionDate: new Date().toLocaleString(),
      reviewer: "MoTA Administrator",

      activities: [
        ...selectedRecord.activities,
        {
          id: `A${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: `Official decision recorded: ${decision}`,
          actor: "MoTA Administrator",
          type: "reviewer",
        },
      ],
    };

    const updatedRecords = records.map((record) =>
      record.id === selectedRecord.id
        ? updatedRecord
        : record
    );

    setRecords(updatedRecords);

    saveVerificationRecordsToLocalStorage(
      updatedRecords
    );

    setSelectedRecord(updatedRecord);

    alert(
      "Demo verification decision recorded locally."
    );

    handleCloseInspector();
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

    setRefreshing(false);
  };

  const handleExportCSV = () => {
    const headers = [
      "Application ID",
      "Applicant Name",
      "Scheme",
      "Document",
      "Priority",
      "OCR Status",
      "AI Match",
      "Verification Status",
      "Reviewer",
      "Uploaded Date",
    ];

    const rows = filteredRecords.map((r) => [
      r.applicationId,
      r.applicantName,
      r.schemeName,
      r.documentName,
      r.priority,
      r.ocrStatus,
      r.aiMatch,
      r.verificationStatus,
      r.reviewer === "Unassigned"
        ? "—"
        : r.reviewer,
      r.uploadedAt,
    ]);

    const escapeCSV = (value: unknown) => {
      const text = String(value ?? "");

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text;
    };

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `verification-queue-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <Topbar
        role="MoTA Administration"
        context="admin"
      />

      <Sidebar
        items={adminNavigation}
        title="Administration"
        context="admin"
      />

      <main className="min-w-0 p-4 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <nav
                className="flex items-center gap-2 text-xs text-[#64748B]"
                aria-label="Breadcrumb"
              >
                <span>Administration</span>
                <span>/</span>
                <span className="font-medium text-[#172033]">
                  Verification Queue
                </span>
              </nav>

              <div>
                <h1 className="text-2xl font-bold text-[#172033]">
                  Document Verification &amp; Evidence Desk
                </h1>

                <p className="mt-1 text-sm text-[#64748B]">
                  Review uploaded documents, inspect AI-assisted
                  extraction results, identify discrepancies, and
                  record official verification decisions.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-4 py-2 text-sm font-semibold text-[#475569] shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                <span>Refresh Queue</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-lg bg-[#173F7A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123362]"
              >
                <Download size={16} />
                <span>Export Queue</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <VerificationStats records={records} />

          {/* Filters */}
          <VerificationFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
            filteredCount={filteredRecords.length}
            totalCount={records.length}
            records={records}
          />

          {/* Desktop Queue */}
          <VerificationQueue
            records={filteredRecords}
            onSelect={handleSelectRecord}
            onClearFilters={handleClearFilters}
          />

          {/* Mobile Cards */}
          <div className="grid gap-3 sm:gap-4 lg:hidden">
            {filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#DCE3EC] bg-white p-12 text-center">
                <p className="text-base font-semibold text-[#172033]">
                  No documents found
                </p>

                <p className="mt-1 text-sm text-[#64748B]">
                  Try adjusting your search or verification
                  filters.
                </p>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 rounded-lg bg-[#173F7A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#123362]"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <VerificationCard
                  key={record.id}
                  record={record}
                  onSelect={handleSelectRecord}
                />
              ))
            )}
          </div>

          {/* Demo Notice */}
          <footer className="mt-8 border-t border-[#DCE3EC] pt-4">
            <div className="flex flex-col gap-2 rounded-lg border border-[#DCE3EC] bg-white p-3.5 text-[11px] text-[#64748B]">
              <span>
                <strong className="font-semibold text-[#172033]">
                  Demo Simulation Notice:
                </strong>{" "}
                This is a prototype implementation for SIH
                2026 evaluation. All verification data, OCR
                results, and DigiLocker integration are simulated
                for demonstration purposes.
              </span>
            </div>
          </footer>
        </div>
      </main>

      {/* Inspector */}
      <VerificationInspector
        record={selectedRecord}
        onClose={handleCloseInspector}
        onDecisionChange={handleDecisionChange}
        isOpen={inspectorOpen}
      />
    </div>
  );
}