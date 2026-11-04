'use client';

import {
  Banknote,
  BookOpen,
  Eye,
  FileBadge,
  FileImage,
  FileText,
  Landmark,
  PencilLine,
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

export type DocumentAction = 'view' | 'replace';

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
            {document.editable && <button type="button" onClick={() => onAction('replace', document)} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#B8C9DC] bg-white px-2.5 text-xs font-semibold text-[#173F7A] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><PencilLine size={14} aria-hidden="true" />Replace</button>}
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
      {document.editable && <IconAction label={`Replace ${document.name}`} Icon={PencilLine} onClick={() => onAction('replace', document)} />}
    </div>
  );
}

function IconAction({ label, Icon, onClick }: { label: string; Icon: LucideIcon; onClick: () => void }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE3EC] bg-white text-[#475569] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><Icon size={15} aria-hidden="true" /></button>;
}