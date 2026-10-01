'use client';

import { useState } from 'react';
import {
  Banknote,
  BookOpen,
  ChevronDown,
  Download,
  Eye,
  FileBadge,
  FileImage,
  FileText,
  Landmark,
  MoreHorizontal,
  PencilLine,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StudentDocument, StudentDocumentCategory } from '@/lib/studentDocuments';
import { DocumentStatusBadge } from '@/components/student/documents/DocumentStatusBadge';

const categoryIcons: Record<StudentDocumentCategory, LucideIcon> = {
  Identity: UserRound,
  'Caste / ST Certificate': FileBadge,
  Income: Banknote,
  Academic: BookOpen,
  Bank: Landmark,
  Admission: FileText,
  Other: FileImage,
};

export type DocumentAction = 'view' | 'replace' | 'download' | 'remove';

export function DocumentCard({ document, onAction }: { document: StudentDocument; onAction: (action: DocumentAction, document: StudentDocument) => void }) {
  const Icon = categoryIcons[document.category];
  return (
    <article className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><Icon size={18} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><h3 className="break-words text-sm font-semibold text-[#172033]">{document.name}</h3><p className="mt-1 text-[11px] text-[#64748B]">{document.category}</p></div>
            <DocumentStatusBadge status={document.status} />
          </div>
          <p className="mt-3 break-all text-xs font-medium text-[#334155]">{document.fileName ?? 'No file uploaded'}</p>
          <dl className="mt-2 grid grid-cols-2 gap-3 border-t border-[#EEF1F5] pt-3">
            <div><dt className="text-[10px] text-[#64748B]">Uploaded</dt><dd className="mt-0.5 text-[11px] font-medium text-[#334155]">{document.uploadedDate ?? 'Not uploaded'}</dd></div>
            <div><dt className="text-[10px] text-[#64748B]">Last updated</dt><dd className="mt-0.5 text-[11px] font-medium text-[#334155]">{document.lastUpdated}</dd></div>
          </dl>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#EEF1F5] pt-3">
            <button type="button" onClick={() => onAction('view', document)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#DCE3EC] bg-white px-2.5 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><Eye size={14} aria-hidden="true" />View</button>
            <button type="button" onClick={() => onAction('replace', document)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#B8C9DC] bg-white px-2.5 text-xs font-semibold text-[#173F7A] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><PencilLine size={14} aria-hidden="true" />Replace</button>
            <button type="button" onClick={() => onAction('download', document)} disabled={!document.fileName} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#DCE3EC] bg-white px-2.5 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] disabled:cursor-not-allowed disabled:text-[#94A3B8]"><Download size={14} aria-hidden="true" />Download</button>
            <DocumentMoreMenu document={document} onAction={onAction} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function DocumentActions({ document, onAction }: { document: StudentDocument; onAction: (action: DocumentAction, document: StudentDocument) => void }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <IconAction label={`View ${document.name}`} Icon={Eye} onClick={() => onAction('view', document)} />
      <IconAction label={`Replace ${document.name}`} Icon={PencilLine} onClick={() => onAction('replace', document)} />
      <IconAction label={`Download ${document.name}`} Icon={Download} disabled={!document.fileName} onClick={() => onAction('download', document)} />
      <DocumentMoreMenu document={document} onAction={onAction} />
    </div>
  );
}

function IconAction({ label, Icon, onClick, disabled = false }: { label: string; Icon: LucideIcon; onClick: () => void; disabled?: boolean }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE3EC] bg-white text-[#475569] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] disabled:cursor-not-allowed disabled:text-[#94A3B8]"><Icon size={15} aria-hidden="true" /></button>;
}

function DocumentMoreMenu({ document, onAction }: { document: StudentDocument; onAction: (action: DocumentAction, document: StudentDocument) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-w-0">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={`More actions for ${document.name}`} onClick={() => setOpen((value) => !value)} className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border border-[#DCE3EC] bg-white px-2.5 text-xs font-semibold text-[#475569] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><MoreHorizontal size={15} aria-hidden="true" /><span className="sm:hidden">More</span><ChevronDown size={12} aria-hidden="true" /></button>
      {open && <div role="menu" className="absolute right-0 top-full z-20 mt-1 min-w-44 rounded-lg border border-[#DCE3EC] bg-white p-1 shadow-lg">
        <button type="button" role="menuitem" onClick={() => { setOpen(false); onAction('view', document); }} className="flex min-h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-medium text-[#334155] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><Eye size={14} aria-hidden="true" />View details</button>
        <button type="button" role="menuitem" onClick={() => { setOpen(false); onAction('remove', document); }} className="flex min-h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-medium text-[#A8323D] hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><Trash2 size={14} aria-hidden="true" />Remove from list</button>
      </div>}
    </div>
  );
}