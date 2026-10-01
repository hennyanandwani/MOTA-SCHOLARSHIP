'use client';

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { FileUp, Upload, X } from 'lucide-react';
import { studentDocumentCategories, type StudentDocumentCategory } from '@/lib/studentDocuments';

export type LocalDocumentUpload = {
  fileName: string;
  fileSize: string;
  category: StudentDocumentCategory;
};

const buttonBase = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';

export function DocumentUploadModal({
  open,
  initialCategory,
  onClose,
  onUpload,
}: {
  open: boolean;
  initialCategory: StudentDocumentCategory;
  onClose: () => void;
  onUpload: (document: LocalDocumentUpload) => void;
}) {
  const [category, setCategory] = useState<StudentDocumentCategory>(initialCategory);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previousFocus = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    closeRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !uploading) onCloseRef.current();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open, uploading]);

  if (!open) return null;

  function chooseFile(nextFile: File | undefined) {
    if (!nextFile) return;
    const extension = nextFile.name.split('.').pop()?.toLowerCase() ?? '';
    const validExtension = ['pdf', 'jpg', 'jpeg', 'png'].includes(extension);
    const validMime = !nextFile.type || ['application/pdf', 'image/jpeg', 'image/png'].includes(nextFile.type);
    if (!validExtension || !validMime) {
      setError('Unsupported file type. Please choose PDF, JPG, JPEG, or PNG.');
      setFile(null);
      return;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      setError('File is larger than 5 MB.');
      setFile(null);
      return;
    }
    setError('');
    setFile(nextFile);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = '';
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setProgress(0);
    let currentProgress = 0;
    const interval = window.setInterval(() => {
      currentProgress = Math.min(currentProgress + 25, 100);
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        window.clearInterval(interval);
        onUpload({ fileName: file.name, fileSize: formatFileSize(file.size), category });
        window.setTimeout(() => onCloseRef.current(), 500);
      }
    }, 140);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploading) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="document-upload-heading" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-xl border border-[#DCE3EC] bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase text-[#2563A8]">Central document library</p><h2 id="document-upload-heading" className="mt-1 text-lg font-bold text-[#172033]">Upload Document</h2><p className="mt-1 text-xs text-[#64748B]">Select a document type and choose a file for this demo.</p></div><button ref={closeRef} type="button" disabled={uploading} onClick={onClose} aria-label="Close upload dialog" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] disabled:opacity-50"><X size={17} aria-hidden="true" /></button></div>
        <form onSubmit={submitUpload} className="mt-5 space-y-4">
          <div><label htmlFor="central-document-category" className="text-xs font-medium text-[#475569]">Document Type</label><select id="central-document-category" value={category} onChange={(event) => setCategory(event.target.value as StudentDocumentCategory)} className="mt-1.5 h-11 w-full rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#334155] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100">{studentDocumentCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-label="Choose a document file" onChange={onFileChange} className="sr-only" />
          <div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { event.preventDefault(); if (event.currentTarget === event.target) setDragging(false); }} onDrop={onDrop} className={`rounded-lg border border-dashed p-4 transition ${dragging ? 'border-[#2563A8] bg-blue-50 ring-2 ring-blue-100' : 'border-[#B8C9DC] bg-[#F8FAFC]'}`}>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-2.5"><FileUp size={18} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" /><div className="min-w-0"><p className="text-xs font-semibold text-[#334155]">File Upload</p><p className="mt-1 text-[11px] text-[#64748B]">PDF, JPG, JPEG, PNG · Maximum 5 MB</p><p className="mt-1 text-[10px] text-[#64748B]">Drop a file here, or select one from your device.</p></div></div><button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className={`${buttonBase} min-h-10 w-full shrink-0 border border-[#B8C9DC] bg-white px-3 text-xs text-[#173F7A] hover:bg-blue-50 disabled:opacity-50 sm:w-auto`}>Choose File</button></div>
          </div>
          {file && <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[#DCE3EC] bg-white p-3"><div className="min-w-0"><p className="break-all text-xs font-semibold text-[#172033]">{file.name}</p><p className="mt-1 text-[10px] text-[#64748B]">{formatFileSize(file.size)}</p></div><button type="button" disabled={uploading} onClick={() => { setFile(null); setProgress(0); }} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#475569] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Remove</button></div>}
          {error && <p role="alert" className="text-xs font-medium text-[#A8323D]">{error}</p>}
          {uploading && <div aria-live="polite"><p className="mb-1 flex justify-between text-[10px] text-[#64748B]"><span>{progress === 100 ? 'Uploaded — Awaiting review' : 'Preparing local preview'}</span><span>{progress}%</span></p><div className="h-1.5 overflow-hidden rounded-full bg-[#E3EAF2]" role="progressbar" aria-label="Local upload progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-[#2563A8]" style={{ width: `${progress}%` }} /></div></div>}
          <div className="flex flex-col-reverse gap-2 border-t border-[#EEF1F5] pt-4 sm:flex-row sm:justify-end"><button type="button" disabled={uploading} onClick={onClose} className={`${buttonBase} w-full border border-[#DCE3EC] bg-white text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-50 sm:w-auto`}>Cancel</button><button type="submit" disabled={!file || uploading} className={`${buttonBase} w-full bg-[#173F7A] text-white hover:bg-[#123365] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto`}><Upload size={15} aria-hidden="true" />Upload</button></div>
        </form>
      </section>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}