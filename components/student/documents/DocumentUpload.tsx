'use client';

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  FileBadge,
  FileCheck2,
  FileImage,
  FileText,
  Info,
  LockKeyhole,
  ScanText,
  ShieldCheck,
  Upload,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  demoApplicationDocuments,
  documentStatuses,
  type ApplicationDocument,
  type DocumentCheckStatus,
  type DocumentStatus,
} from '@/lib/applicationDocuments';

type DocumentUploadProps = {
  schemeId: string;
  schemeName: string;
};

type StoredDocument = Pick<ApplicationDocument, 'id' | 'status' | 'fileName' | 'fileSize' | 'sizeBytes'>;

const buttonBase = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';
const acceptedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
const acceptedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

const statusPresentation: Record<DocumentStatus, { label: string; Icon: LucideIcon; className: string }> = {
  not_uploaded: { label: 'Not uploaded', Icon: Circle, className: 'border-[#DCE3EC] bg-[#F8FAFC] text-[#475569]' },
  uploaded: { label: 'Uploaded', Icon: Upload, className: 'border-blue-200 bg-blue-50 text-[#1D5796]' },
  verifying: { label: 'Verification in progress', Icon: Clock3, className: 'border-blue-200 bg-blue-50 text-[#1D5796]' },
  verified: { label: 'Verified', Icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-[#126747]' },
  needs_attention: { label: 'Needs attention', Icon: AlertCircle, className: 'border-amber-200 bg-amber-50 text-[#80520B]' },
  rejected: { label: 'Rejected — upload again', Icon: XCircle, className: 'border-rose-200 bg-rose-50 text-[#A8323D]' },
};

const documentIcons: Record<ApplicationDocument['icon'], LucideIcon> = {
  certificate: FileBadge,
  identity: UserRound,
  academic: FileCheck2,
  bank: Banknote,
  photo: FileImage,
};

export function DocumentUpload({ schemeId, schemeName }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<ApplicationDocument[]>(demoApplicationDocuments);
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draggedDocumentId, setDraggedDocumentId] = useState<string | null>(null);
  const [uploadingDocumentId, setUploadingDocumentId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const storageKey = `student-application-documents:${schemeId}`;
  const applicationHref = `/student/schemes/${schemeId}/apply`;
  const reviewHref = `/student/schemes/${schemeId}/apply/review`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isStoredDocumentList(parsed)) {
          setDocuments((current) => current.map((document) => {
            const stored = parsed.find((item) => item.id === document.id);
            if (!stored) return document;
            return {
              ...document,
              ...stored,
              status: stored.status === 'verifying' ? 'uploaded' : stored.status,
              progress: undefined,
            };
          }));
        }
      }
    } catch {
      setErrors({ storage: 'Saved document details could not be loaded. Demo values are shown.' });
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    const saved: StoredDocument[] = documents.map(({ id, status, fileName, fileSize, sizeBytes }) => ({
      id,
      status: status === 'verifying' ? 'uploaded' : status,
      fileName,
      fileSize,
      sizeBytes,
    }));
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      setErrors((current) => ({
        ...current,
        storage: 'This browser could not save changes locally. Your current selections remain in this session.',
      }));
    }
  }, [documents, loaded, storageKey]);

  useEffect(() => {
    if (!uploadingDocumentId) return;
    let progress = 0;
    const interval = window.setInterval(() => {
      progress = Math.min(progress + 20, 100);
      setDocuments((current) => current.map((document) => (
        document.id === uploadingDocumentId ? { ...document, progress } : document
      )));
      if (progress === 100) {
        window.clearInterval(interval);
        window.setTimeout(() => {
          setDocuments((current) => current.map((document) => (
            document.id === uploadingDocumentId
              ? { ...document, status: 'uploaded', progress: undefined }
              : document
          )));
          setUploadingDocumentId(null);
        }, 180);
      }
    }, 130);
    return () => window.clearInterval(interval);
  }, [uploadingDocumentId]);

  const activeDocument = documents.find((document) => document.id === activeDocumentId) ?? null;
  const attentionDocuments = documents.filter((document) => document.status === 'needs_attention' || document.status === 'rejected');
  const uploadedCount = documents.filter((document) => ['uploaded', 'verifying', 'verified'].includes(document.status)).length;
  const remainingCount = documents.filter((document) => document.status === 'not_uploaded').length;
  const requiredCount = documents.filter((document) => document.required).length;

  function selectFile(documentId: string, file: File | undefined) {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!acceptedExtensions.includes(extension) || (file.type && !acceptedMimeTypes.includes(file.type))) {
      setErrors((current) => ({ ...current, [documentId]: 'Unsupported file type. Please upload PDF, JPG, JPEG, or PNG.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, [documentId]: 'File is larger than 5 MB.' }));
      return;
    }

    setErrors((current) => {
      const next = { ...current };
      delete next[documentId];
      return next;
    });
    setDocuments((current) => current.map((document) => document.id === documentId
      ? {
          ...document,
          status: 'verifying',
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          sizeBytes: file.size,
          progress: 0,
          issue: undefined,
          aiChecks: undefined,
          extractedFields: undefined,
        }
      : document));
    setUploadingDocumentId(documentId);
  }

  function handleInputChange(documentId: string, event: ChangeEvent<HTMLInputElement>) {
    selectFile(documentId, event.currentTarget.files?.[0]);
    event.currentTarget.value = '';
  }

  function handleDrop(documentId: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggedDocumentId(null);
    selectFile(documentId, event.dataTransfer.files[0]);
  }

  function removeFile(documentId: string) {
    setDocuments((current) => current.map((document) => document.id === documentId
      ? { ...document, status: 'not_uploaded', fileName: undefined, fileSize: undefined, sizeBytes: undefined, progress: undefined, issue: undefined }
      : document));
    setErrors((current) => {
      const next = { ...current };
      delete next[documentId];
      return next;
    });
  }

  function replaceFromModal(documentId: string) {
    setActiveDocumentId(null);
    window.setTimeout(() => fileInputs.current[documentId]?.click(), 0);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <span aria-hidden="true">/</span>
        <Link href="/student/all-schemes" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">All Schemes</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/student/schemes/${schemeId}`} className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Scheme Details</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/student/schemes/${schemeId}/eligibility`} className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Eligibility Check</Link>
        <span aria-hidden="true">/</span>
        <Link href={applicationHref} className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Application</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-[#334155]">Documents</span>
      </nav>

      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#2563A8]">Scholarship application</p>
          <h2 className="text-2xl font-bold text-[#172033]">Document Upload</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748B]">
            Upload the required documents for your scholarship application. Make sure each document is clear, valid, and matches your application information.
          </p>
        </div>
        <section aria-label="Application details" className="w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white p-3.5 sm:max-w-[350px]">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">Draft</span>
            <span className="text-[10px] font-medium text-[#64748B]">Academic Year: 2026–27</span>
          </div>
          <p className="mt-2 break-words text-xs font-semibold text-[#172033]">{schemeName}</p>
          <p className="mt-1 text-[11px] text-[#64748B]">Application ID: MOTA-2026-00124</p>
          <p className="mt-2 border-t border-[#EEF1F5] pt-2 text-[10px] text-[#64748B]">Changes are stored locally in this demo.</p>
        </section>
      </header>

      <ApplicationStepper />

      {attentionDocuments.length > 0 && (
        <section aria-labelledby="attention-heading" className="rounded-xl border border-[#E9D5A5] bg-[#FFFBEB] p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[#94600D]"><AlertCircle size={18} aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <h2 id="attention-heading" className="text-sm font-semibold text-[#573B0A]">{attentionDocuments.length} document{attentionDocuments.length === 1 ? '' : 's'} need your attention</h2>
              <p className="mt-1 text-xs leading-5 text-[#765719]">Review the flagged document before continuing.</p>
              <ul className="mt-3 space-y-2">
                {attentionDocuments.map((document) => (
                  <li key={document.id} className="flex min-w-0 flex-col gap-2 border-t border-amber-200/70 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-semibold text-[#172033]">{document.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#765719]">Issue: {document.issue ?? 'Document requires a new upload.'}</p>
                    </div>
                    <button type="button" onClick={() => setActiveDocumentId(document.id)} className={`${buttonBase} min-h-10 shrink-0 border border-[#C9A34E] bg-white px-3 text-xs text-[#684B10] hover:bg-amber-50`}>
                      Review Issue<ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <DocumentSummary required={requiredCount} uploaded={uploadedCount} attention={attentionDocuments.length} remaining={remainingCount} />

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="documents-heading" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="documents-heading" className="text-base font-semibold text-[#172033]">Required Documents</h2>
              <p className="mt-1 text-xs text-[#64748B]">{requiredCount} documents required for this application</p>
            </div>
            <span className="text-[11px] text-[#64748B]">PDF, JPG or PNG · Up to 5 MB</span>
          </div>

          {errors.storage && <p role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-[#80520B]">{errors.storage}</p>}

          <div className="space-y-3">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                error={errors[document.id]}
                dragged={draggedDocumentId === document.id}
                inputRef={(element) => { fileInputs.current[document.id] = element; }}
                onFileChange={(event) => handleInputChange(document.id, event)}
                onDragEnter={(event) => { event.preventDefault(); setDraggedDocumentId(document.id); }}
                onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDraggedDocumentId(null); }}
                onDrop={(event) => handleDrop(document.id, event)}
                onOpen={() => setActiveDocumentId(document.id)}
                onRemove={() => removeFile(document.id)}
              />
            ))}
          </div>

          <div className="mt-4 xl:hidden">
            <ApplicationChecklist />
          </div>
        </section>

        <aside className="hidden min-w-0 space-y-4 xl:block">
          <ApplicationChecklist />
          <DocumentRequirements />
          <PrivacyNote />
        </aside>
      </div>

      <div className="grid gap-4 xl:hidden sm:grid-cols-2">
        <DocumentRequirements />
        <PrivacyNote />
      </div>

      <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#C9D8E8] bg-[#F1F6FC] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold text-[#173F7A]"><ShieldCheck size={15} aria-hidden="true" />Draft application</p>
          <p className="mt-1 text-xs leading-5 text-[#475569]" role="status" aria-live="polite">
            {remainingCount > 0 ? `${remainingCount} required document${remainingCount === 1 ? '' : 's'} remaining. You can continue, but your application is incomplete.` : 'All required documents have a file selected. Review each document before continuing.'}
          </p>
        </div>
        <div className="grid gap-2 sm:flex sm:items-center">
          <Link href={applicationHref} className={`${buttonBase} w-full border border-[#B8C9DC] bg-white text-[#173F7A] hover:bg-blue-50 sm:w-auto`}>
            <ArrowLeft size={15} aria-hidden="true" />Back to Application
          </Link>
          <Link href={reviewHref} className={`${buttonBase} w-full bg-[#173F7A] text-white hover:bg-[#123365] sm:w-auto`}>
            {remainingCount > 0 ? 'Continue with missing documents' : 'Continue to Review'}<ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <p className="flex items-start gap-2 border-t border-[#DCE3EC] pt-3 text-[11px] leading-5 text-[#64748B]">
        <Info size={14} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
        AI-assisted checks can help identify document information for review. They do not constitute official verification; authorized personnel remain responsible for final review.
      </p>

      {activeDocument && (
        <DocumentReviewModal
          document={activeDocument}
          onClose={() => setActiveDocumentId(null)}
          onReplace={() => replaceFromModal(activeDocument.id)}
        />
      )}
    </div>
  );
}

function ApplicationStepper() {
  const steps = ['Personal', 'Academic', 'Family & Bank', 'Documents', 'Review & Submit'];
  return (
    <section aria-label="Application progress" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#172033]">Application progress</h2>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1D5796]">Step 4 of 5</span>
      </div>
      <ol className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-5 sm:gap-2">
        {steps.map((step, index) => {
          const complete = index < 3;
          const current = index === 3;
          return (
            <li key={step} aria-current={current ? 'step' : undefined} className="flex min-w-0 items-center gap-2.5 sm:items-start sm:flex-col sm:gap-2">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${complete ? 'border-[#16805B] bg-[#16805B] text-white' : current ? 'border-[#2563A8] bg-blue-50 text-[#173F7A] ring-2 ring-blue-100' : 'border-[#CBD5E1] bg-white text-[#64748B]'}`}>
                {complete ? <Check size={15} aria-hidden="true" /> : String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className={`block text-xs font-semibold leading-4 ${complete ? 'text-[#16805B]' : current ? 'text-[#173F7A]' : 'text-[#475569]'}`}>{step}</span>
                <span className="mt-0.5 block text-[10px] text-[#64748B]">{complete ? 'Complete' : current ? 'Current step' : 'Upcoming'}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function DocumentSummary({ required, uploaded, attention, remaining }: { required: number; uploaded: number; attention: number; remaining: number }) {
  const stats = [
    { label: 'Required Documents', value: required, Icon: FileText, tone: 'text-[#173F7A] bg-blue-50' },
    { label: 'Uploaded', value: uploaded, Icon: FileCheck2, tone: 'text-[#126747] bg-emerald-50' },
    { label: 'Needs Attention', value: attention, Icon: AlertCircle, tone: 'text-[#80520B] bg-amber-50' },
    { label: 'Remaining', value: remaining, Icon: Upload, tone: 'text-[#475569] bg-slate-100' },
  ];
  return (
    <section aria-label="Document summary" className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, Icon, tone }) => (
        <article key={label} className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-3.5 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={16} aria-hidden="true" /></span>
            <p className="min-w-0 text-[11px] font-medium leading-4 text-[#64748B]">{label}</p>
          </div>
          <p className="mt-2 text-xl font-bold text-[#172033]">{value}</p>
        </article>
      ))}
    </section>
  );
}

function DocumentCard({
  document,
  error,
  dragged,
  inputRef,
  onFileChange,
  onDragEnter,
  onDragLeave,
  onDrop,
  onOpen,
  onRemove,
}: {
  document: ApplicationDocument;
  error?: string;
  dragged: boolean;
  inputRef: (element: HTMLInputElement | null) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const DocumentIcon = documentIcons[document.icon];
  const status = statusPresentation[document.status];
  const StatusIcon = status.Icon;
  const isMissing = document.status === 'not_uploaded';

  return (
    <article id={`document-${document.id}`} className={`min-w-0 scroll-mt-24 rounded-xl border bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5 ${document.status === 'needs_attention' || document.status === 'rejected' ? 'border-[#E9D5A5]' : 'border-[#DCE3EC]'}`}>
      <input
        ref={inputRef}
        id={`document-file-${document.id}`}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        aria-label={`Choose file for ${document.name}`}
        onChange={onFileChange}
        className="sr-only"
      />
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><DocumentIcon size={19} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="break-words text-sm font-semibold text-[#172033]">{document.name}</h3>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">{document.description}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#DCE3EC] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-medium text-[#475569]">{document.required ? 'Required' : 'Optional'}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>
                <StatusIcon size={13} aria-hidden="true" />{status.label}
              </span>
            </div>
          </div>

          {isMissing ? (
            <div
              onDragEnter={onDragEnter}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`mt-4 flex min-w-0 flex-col items-start gap-3 rounded-lg border border-dashed p-3.5 transition sm:flex-row sm:items-center sm:justify-between ${dragged ? 'border-[#2563A8] bg-blue-50 ring-2 ring-blue-100' : 'border-[#B8C9DC] bg-[#F8FAFC]'}`}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <Upload size={16} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#334155]">Upload {document.name}</p>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">PDF, JPG or PNG · Maximum 5 MB</p>
                  <p className="mt-1 text-[10px] text-[#64748B]">Drag and drop a file here, or choose one.</p>
                </div>
              </div>
              <label htmlFor={`document-file-${document.id}`} className={`${buttonBase} min-h-10 w-full shrink-0 cursor-pointer border border-[#B8C9DC] bg-white px-3 text-xs text-[#173F7A] hover:bg-blue-50 sm:w-auto`}>
                Choose File
              </label>
            </div>
          ) : (
            <div className="mt-4 min-w-0 rounded-lg border border-[#EEF1F5] bg-[#FCFDFE] p-3.5">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-2.5">
                  <FileText size={16} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="break-all text-xs font-semibold text-[#172033]">{document.fileName}</p>
                    <p className="mt-0.5 text-[11px] text-[#64748B]">{document.fileSize}</p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[#126747]"><CheckCircle2 size={12} aria-hidden="true" />File selected</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <button type="button" onClick={onOpen} className={`${buttonBase} min-h-10 border border-[#DCE3EC] bg-white px-3 text-xs text-[#334155] hover:bg-[#F8FAFC]`}>
                    View
                  </button>
                  <label htmlFor={`document-file-${document.id}`} className={`${buttonBase} min-h-10 cursor-pointer border border-[#B8C9DC] bg-white px-3 text-xs text-[#173F7A] hover:bg-blue-50`}>
                    Replace
                  </label>
                  <button type="button" onClick={onRemove} aria-label={`Remove ${document.name}`} className={`${buttonBase} col-span-2 min-h-10 border border-[#DCE3EC] bg-white px-3 text-xs text-[#475569] hover:border-rose-200 hover:bg-rose-50 hover:text-[#A8323D] sm:col-span-1`}>
                    <X size={14} aria-hidden="true" />Remove
                  </button>
                </div>
              </div>
              {document.status === 'verifying' && (
                <div className="mt-3" aria-live="polite">
                  <div className="mb-1 flex justify-between gap-2 text-[10px] text-[#64748B]"><span>Preparing local preview</span><span>{document.progress ?? 0}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#E3EAF2]" role="progressbar" aria-label={`File selection progress for ${document.name}`} aria-valuenow={document.progress ?? 0} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-[#2563A8] transition-[width]" style={{ width: `${document.progress ?? 0}%` }} />
                  </div>
                </div>
              )}
              {document.status === 'verified' && <DocumentVerification document={document} />}
              {document.status === 'needs_attention' && <DocumentVerification document={document} />}
              {document.status === 'uploaded' && <DocumentVerification document={document} />}
            </div>
          )}

          {error && <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-medium leading-5 text-[#A8323D]"><AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>}
        </div>
      </div>
    </article>
  );
}

function DocumentVerification({ document }: { document: ApplicationDocument }) {
  if (document.status === 'needs_attention') {
    return (
      <div className="mt-3 border-t border-[#EEF1F5] pt-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#334155]"><ScanText size={14} className="text-[#2563A8]" aria-hidden="true" />AI-assisted document check</p>
        <p className="mt-2 text-xs font-semibold text-[#80520B]">Potential mismatch detected</p>
        <p className="mt-1 text-xs leading-5 text-[#765719]">The name extracted from the document may not exactly match the name entered in your application.</p>
        <p className="mt-1 text-[10px] font-medium text-[#64748B]">Requires authorized review</p>
      </div>
    );
  }

  if (document.status === 'verified') {
    return (
      <div className="mt-3 border-t border-[#EEF1F5] pt-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#334155]"><ScanText size={14} className="text-[#2563A8]" aria-hidden="true" />AI-assisted document check</p>
        <p className="mt-1 text-[10px] text-[#64748B]">Preliminary check complete · not official verification</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-3">
          {['Document appears readable', 'Required information detected', 'Application details matched'].map((item) => (
            <li key={item} className="flex min-w-0 items-start gap-1.5 text-[10px] leading-4 text-[#126747]"><CheckCircle2 size={13} className="mt-0.5 shrink-0" aria-hidden="true" />{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-start gap-2 border-t border-[#EEF1F5] pt-3 text-[10px] leading-4 text-[#64748B]">
      <ScanText size={14} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
      <p><span className="font-semibold text-[#334155]">AI-assisted document check</span><br />Preliminary check information is available for review; no official verification has been made.</p>
    </div>
  );
}

function ApplicationChecklist() {
  const items = [
    { label: 'Personal Information', complete: true },
    { label: 'Academic Information', complete: true },
    { label: 'Family & Bank', complete: true },
    { label: 'Documents', complete: false, current: true },
    { label: 'Review & Submit', complete: false },
  ];
  return (
    <section aria-labelledby="application-checklist-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <h2 id="application-checklist-heading" className="text-sm font-semibold text-[#172033]">Application Checklist</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label} aria-current={item.current ? 'step' : undefined} className={`flex min-w-0 items-start gap-2.5 text-xs ${item.current ? 'font-semibold text-[#173F7A]' : item.complete ? 'text-[#334155]' : 'text-[#64748B]'}`}>
            {item.complete ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#16805B]" aria-hidden="true" /> : item.current ? <Clock3 size={15} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" /> : <Circle size={15} className="mt-0.5 shrink-0 text-[#94A3B8]" aria-hidden="true" />}
            <span>{item.label}{item.current && <span className="sr-only">, current step</span>}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DocumentRequirements() {
  const requirements = [
    'Upload clear and readable documents.',
    'Make sure each document is valid and not expired.',
    'Information should match your application.',
    'Supported formats: PDF, JPG, JPEG, PNG.',
    'Maximum file size: 5 MB per document.',
    'Additional documents may be requested during verification.',
  ];
  return (
    <section aria-labelledby="requirements-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Info size={16} aria-hidden="true" /></span><h2 id="requirements-heading" className="text-sm font-semibold text-[#172033]">Document requirements</h2></div>
      <ul className="mt-3 space-y-2.5">
        {requirements.map((requirement) => <li key={requirement} className="flex items-start gap-2 text-[11px] leading-4 text-[#475569]"><Check size={13} className="mt-0.5 shrink-0 text-[#16805B]" aria-hidden="true" />{requirement}</li>)}
      </ul>
    </section>
  );
}

function PrivacyNote() {
  return (
    <section className="rounded-xl border border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2563A8]"><LockKeyhole size={16} aria-hidden="true" /></span><h2 className="text-sm font-semibold text-[#172033]">Your documents are protected</h2></div>
      <p className="mt-3 text-[11px] leading-5 text-[#475569]">Documents submitted through the official platform should only be accessible to authorized personnel involved in application processing.</p>
    </section>
  );
}

function DocumentReviewModal({ document, onClose, onReplace }: { document: ApplicationDocument; onClose: () => void; onReplace: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const statusText: Record<DocumentCheckStatus, string> = {
    passed: 'Passed',
    potential_mismatch: 'Potential mismatch',
    requires_review: 'Requires review',
  };

  useEffect(() => {
    const previousFocus = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    closeButton.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  const checks = document.aiChecks ?? { readability: 'requires_review', requiredFields: 'requires_review', applicationComparison: 'requires_review' };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="document-modal-title" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-[#DCE3EC] bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2563A8]">Document details</p>
            <h2 id="document-modal-title" className="mt-1 break-words text-lg font-bold text-[#172033]">{document.name}</h2>
          </div>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="Close document details" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-slate-100 hover:text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><X size={18} aria-hidden="true" /></button>
        </div>

        <dl className="mt-5 grid gap-3 border-y border-[#EEF1F5] py-4 sm:grid-cols-2">
          <div className="min-w-0"><dt className="text-[11px] text-[#64748B]">File</dt><dd className="mt-1 break-all text-xs font-semibold text-[#172033]">{document.fileName ?? 'No file selected'}</dd></div>
          <div><dt className="text-[11px] text-[#64748B]">Size</dt><dd className="mt-1 text-xs font-semibold text-[#172033]">{document.fileSize ?? '—'}</dd></div>
        </dl>

        <section className="mt-5" aria-labelledby="ai-checks-heading">
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><ScanText size={16} aria-hidden="true" /></span>
            <div><h3 id="ai-checks-heading" className="text-sm font-semibold text-[#172033]">AI-assisted checks</h3><p className="mt-0.5 text-[11px] text-[#64748B]">Assistive indicators only; authorized personnel make final verification decisions.</p></div>
          </div>
          <dl className="mt-3 divide-y divide-[#EEF1F5] rounded-lg border border-[#DCE3EC] px-3.5">
            <CheckRow label="Readability" value={statusText[checks.readability]} status={checks.readability} />
            <CheckRow label="Required fields detected" value={statusText[checks.requiredFields]} status={checks.requiredFields} />
            <CheckRow label="Application data comparison" value={statusText[checks.applicationComparison]} status={checks.applicationComparison} />
            <CheckRow label="Review status" value={document.status === 'verified' ? 'Preliminary checks complete' : 'Requires review'} status={document.status === 'verified' ? 'passed' : 'requires_review'} />
          </dl>
        </section>

        {document.extractedFields && (
          <section className="mt-5 rounded-lg border border-[#DCE3EC] bg-[#F8FAFC] p-4" aria-labelledby="extracted-heading">
            <h3 id="extracted-heading" className="text-xs font-semibold text-[#172033]">AI-extracted information</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              <ExtractedValue label="Name" value={document.extractedFields.name} />
              <ExtractedValue label="Certificate Number" value={document.extractedFields.certificateNumber} />
              <ExtractedValue label="Issue Date" value={document.extractedFields.issueDate} />
            </dl>
            <p className="mt-3 text-[10px] leading-4 text-[#64748B]">AI extraction may contain errors and should be reviewed.</p>
          </section>
        )}

        {document.issue && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-[#765719]">{document.issue}. The name extracted from the document may not exactly match the name entered in your application. This requires authorized review.</p>}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#EEF1F5] pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={`${buttonBase} w-full border border-[#DCE3EC] bg-white text-[#334155] hover:bg-[#F8FAFC] sm:w-auto`}>Close</button>
          <button type="button" onClick={onReplace} className={`${buttonBase} w-full bg-[#173F7A] text-white hover:bg-[#123365] sm:w-auto`}><Upload size={15} aria-hidden="true" />Replace Document</button>
        </div>
      </section>
    </div>
  );
}

function CheckRow({ label, value, status }: { label: string; value: string; status: DocumentCheckStatus }) {
  const Icon = status === 'passed' ? CheckCircle2 : status === 'potential_mismatch' ? AlertCircle : Clock3;
  const className = status === 'passed' ? 'text-[#126747]' : status === 'potential_mismatch' ? 'text-[#80520B]' : 'text-[#475569]';
  return <div className="flex min-w-0 items-center justify-between gap-3 py-3 text-xs"><dt className="min-w-0 text-[#475569]">{label}</dt><dd className={`inline-flex shrink-0 items-center gap-1.5 text-right font-semibold ${className}`}><Icon size={14} aria-hidden="true" />{value}</dd></div>;
}

function ExtractedValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-[10px] text-[#64748B]">{label}</dt><dd className="mt-1 break-words text-xs font-semibold text-[#172033]">{value}</dd></div>;
}

function isStoredDocumentList(value: unknown): value is StoredDocument[] {
  if (!Array.isArray(value)) return false;
  return value.every((item: unknown) => {
    if (typeof item !== 'object' || item === null) return false;
    const record = item as Record<string, unknown>;
    return typeof record.id === 'string'
      && typeof record.status === 'string'
      && documentStatuses.includes(record.status as DocumentStatus)
      && (record.fileName === undefined || typeof record.fileName === 'string')
      && (record.fileSize === undefined || typeof record.fileSize === 'string')
      && (record.sizeBytes === undefined || typeof record.sizeBytes === 'number');
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}