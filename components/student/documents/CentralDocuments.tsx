'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type {
  StudentDocument,
  StudentDocumentCategory,
  StudentDocumentSort,
  StudentDocumentStatusFilter,
} from '@/lib/studentDocuments';
import { demoStudentDocuments } from '@/lib/studentDocuments';
import { DocumentAttentionPanel } from '@/components/student/documents/DocumentAttentionPanel';
import { DocumentDetailsModal } from '@/components/student/documents/DocumentDetailsModal';
import { DocumentFilters } from '@/components/student/documents/DocumentFilters';
import { DocumentList } from '@/components/student/documents/DocumentList';
import { DocumentPrivacyNote, DocumentChecklist } from '@/components/student/documents/DocumentPrivacyNote';
import { DocumentSummary } from '@/components/student/documents/DocumentSummary';
import { DocumentsHeader } from '@/components/student/documents/DocumentsHeader';
import { DocumentUploadModal, type LocalDocumentUpload } from '@/components/student/documents/DocumentUploadModal';
import type { DocumentAction } from '@/components/student/documents/DocumentCard';

export function CentralDocuments() {
  const [documents, setDocuments] = useState<StudentDocument[]>(demoStudentDocuments);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StudentDocumentStatusFilter>('All');
  const [category, setCategory] = useState<StudentDocumentCategory | 'All'>('All');
  const [sort, setSort] = useState<StudentDocumentSort>('Recently Updated');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceDocumentId, setReplaceDocumentId] = useState<string | null>(null);
  const [detailsDocument, setDetailsDocument] = useState<StudentDocument | null>(null);
  const [feedback, setFeedback] = useState('');

  const attentionDocuments = documents.filter((document) => document.status === 'Needs Attention');
  const query = search.trim().toLowerCase();
  const filteredDocuments = documents.filter((document) => {
    const matchesSearch = !query || [document.name, document.category, document.fileName ?? ''].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (status === 'All' || document.status === status) && (category === 'All' || document.category === category);
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
    if (action === 'replace') {
      setReplaceDocumentId(document.id);
      setUploadOpen(true);
      return;
    }
    if (action === 'download') {
      setFeedback('Download is a demo-only control; original file contents are not stored.');
      return;
    }
    setDocuments((current) => current.filter((item) => item.id !== document.id));
    setFeedback(`${document.name} removed from this local demo list.`);
  }

  function handleUpload(upload: LocalDocumentUpload) {
    const currentDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
    if (replaceDocumentId) {
      setDocuments((current) => current.map((document) => document.id === replaceDocumentId ? {
        ...document,
        category: upload.category,
        fileName: upload.fileName,
        fileSize: upload.fileSize,
        uploadedDate: currentDate,
        lastUpdated: currentDate,
        status: 'Under Review',
      } : document));
      setFeedback('Uploaded — Awaiting review. File details are kept in this page state only.');
    } else {
      const newDocument: StudentDocument = {
        id: `central-upload-${Date.now()}`,
        name: nameFromFile(upload.fileName),
        category: upload.category,
        fileName: upload.fileName,
        fileSize: upload.fileSize,
        uploadedDate: currentDate,
        lastUpdated: currentDate,
        status: 'Under Review',
      };
      setDocuments((current) => [newDocument, ...current]);
      setFeedback('Uploaded — Awaiting review. File details are kept in this page state only.');
    }
    setReplaceDocumentId(null);
  }

  const replacementDocument = documents.find((document) => document.id === replaceDocumentId);

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <DocumentsHeader onUpload={() => { setReplaceDocumentId(null); setUploadOpen(true); }} />
      <DocumentSummary documents={documents} />

      <DocumentAttentionPanel documents={attentionDocuments} onReview={setDetailsDocument} />

      {feedback && <p role="status" aria-live="polite" className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-xs leading-5 text-[#31577F]"><AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{feedback}</p>}

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

      <p className="border-t border-[#DCE3EC] pt-3 text-[10px] leading-4 text-[#64748B]">This central library is a frontend demo. Scheme-specific application uploads remain in the relevant application flow.</p>

      <DocumentUploadModal
        key={replaceDocumentId ?? 'new-central-document'}
        open={uploadOpen}
        initialCategory={replacementDocument?.category ?? 'Other'}
        onClose={() => { setUploadOpen(false); setReplaceDocumentId(null); }}
        onUpload={handleUpload}
      />
      <DocumentDetailsModal document={detailsDocument} onClose={() => setDetailsDocument(null)} />
    </div>
  );
}

function parseDocumentDate(value: string): number {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function nameFromFile(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  return withoutExtension.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Uploaded Document';
}