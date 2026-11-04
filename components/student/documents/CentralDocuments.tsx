'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import type {
  StudentDocument,
  StudentDocumentCategory,
  StudentDocumentSort,
  StudentDocumentStatusFilter,
} from '@/lib/studentDocuments';
import {
  fetchStudentApplications,
  type StudentApplicationRecord,
} from '@/lib/studentApplicationsApi';
import { DocumentAttentionPanel } from '@/components/student/documents/DocumentAttentionPanel';
import { DocumentDetailsModal } from '@/components/student/documents/DocumentDetailsModal';
import { DocumentFilters } from '@/components/student/documents/DocumentFilters';
import { DocumentList } from '@/components/student/documents/DocumentList';
import { DocumentPrivacyNote, DocumentChecklist } from '@/components/student/documents/DocumentPrivacyNote';
import { DocumentSummary } from '@/components/student/documents/DocumentSummary';
import { DocumentsHeader } from '@/components/student/documents/DocumentsHeader';
import type { DocumentAction } from '@/components/student/documents/DocumentCard';

const documentInfo: Record<string, { name: string; category: StudentDocumentCategory }> = {
  CASTE_CERTIFICATE: { name: 'ST Certificate', category: 'Caste / ST Certificate' },
  INCOME_CERTIFICATE: { name: 'Income Certificate', category: 'Income' },
  IDENTITY_PROOF: { name: 'Identity Proof', category: 'Identity' },
  MARKSHEET: { name: 'Academic Marksheet', category: 'Academic' },
  ADMISSION_PROOF: { name: 'Admission / Bonafide Certificate', category: 'Admission' },
  BANK_PROOF: { name: 'Bank Account Proof', category: 'Bank' },
  PHOTOGRAPH: { name: 'Photograph', category: 'Identity' },
  OTHER: { name: 'Other document', category: 'Other' },
};

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toStudentDocuments(applications: StudentApplicationRecord[]): StudentDocument[] {
  return applications.flatMap((application) =>
    application.documents.map((document) => {
      const info = documentInfo[document.type] ?? {
        name: document.type.replaceAll('_', ' '),
        category: 'Other' as const,
      };
      const status = document.verificationStatus === 'VERIFIED'
        ? 'Verified'
        : document.verificationStatus === 'FLAGGED' || document.verificationStatus === 'REJECTED'
          ? 'Needs Attention'
          : 'Under Review';
      const uploadedDate = formatDate(document.createdAt);

      return {
        id: document.id,
        name: info.name,
        category: info.category,
        schemeName: application.schemeName,
        schemeId: application.schemeId,
        editable: application.status === 'DRAFT',
        fileName: document.originalName,
        fileSize: formatFileSize(document.sizeBytes),
        uploadedDate,
        lastUpdated: uploadedDate,
        status,
        issue: document.verificationRemarks ?? undefined,
      };
    }),
  );
}

function parseDocumentDate(value: string): number {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function CentralDocuments() {
  const router = useRouter();
  const [applications, setApplications] = useState<StudentApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StudentDocumentStatusFilter>('All');
  const [category, setCategory] = useState<StudentDocumentCategory | 'All'>('All');
  const [sort, setSort] = useState<StudentDocumentSort>('Recently Updated');
  const [detailsDocument, setDetailsDocument] = useState<StudentDocument | null>(null);

  useEffect(() => {
    let active = true;
    fetchStudentApplications()
      .then((result) => {
        if (active) setApplications(result);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error
            ? error.message
            : 'Could not load your documents. Please try again.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const documents = useMemo(() => toStudentDocuments(applications), [applications]);
  const attentionDocuments = documents.filter((document) => document.status === 'Needs Attention');
  const query = search.trim().toLowerCase();
  const filteredDocuments = documents.filter((document) => {
    const matchesSearch = !query || [
      document.name,
      document.category,
      document.fileName ?? '',
      document.schemeName ?? '',
    ].some((value) => value.toLowerCase().includes(query));
    return matchesSearch &&
      (status === 'All' || document.status === status) &&
      (category === 'All' || document.category === category);
  }).sort((first, second) => {
    if (sort === 'Name') return first.name.localeCompare(second.name);
    if (sort === 'Status') return first.status.localeCompare(second.status) || first.name.localeCompare(second.name);
    return parseDocumentDate(second.lastUpdated) - parseDocumentDate(first.lastUpdated);
  });

  function clearFilters() {
    setSearch('');
    setStatus('All');
    setCategory('All');
    setSort('Recently Updated');
  }

  function handleDocumentAction(action: DocumentAction, document: StudentDocument) {
    if (action === 'view') {
      setDetailsDocument(document);
      return;
    }
    if (document.editable && document.schemeId) {
      router.push(`/student/schemes/${encodeURIComponent(document.schemeId)}/apply/documents`);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <DocumentsHeader />
      {loadError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-[#A8323D]">{loadError}</p>}
      {loading ? (
        <p role="status" className="rounded-lg border border-[#DCE3EC] bg-white px-4 py-6 text-center text-sm text-[#64748B]">Loading your saved documents…</p>
      ) : (
        <>
          <DocumentSummary documents={documents} />
          <DocumentAttentionPanel documents={attentionDocuments} onReview={setDetailsDocument} />
          <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
            <div className="min-w-0 space-y-4">
              <DocumentFilters search={search} status={status} category={category} sort={sort} onSearch={setSearch} onStatus={setStatus} onCategory={setCategory} onSort={setSort} onClear={clearFilters} />
              <DocumentList documents={filteredDocuments} totalDocuments={documents.length} onAction={handleDocumentAction} onClear={clearFilters} />
            </div>
            <aside className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <DocumentChecklist />
              <DocumentPrivacyNote />
            </aside>
          </div>
        </>
      )}
      {!loading && (
        <p className="border-t border-[#DCE3EC] pt-3 text-[10px] leading-4 text-[#64748B]">
          Files can be uploaded or replaced only from an owned draft application. Submitted application documents are read-only.
        </p>
      )}
      <DocumentDetailsModal document={detailsDocument} onClose={() => setDetailsDocument(null)} />
    </div>
  );
}
