import { FileSearch } from 'lucide-react';
import type { StudentDocument } from '@/lib/studentDocuments';
import type { DocumentAction } from '@/components/student/documents/DocumentCard';
import { DocumentActions, DocumentCard } from '@/components/student/documents/DocumentCard';
import { DocumentStatusBadge } from '@/components/student/documents/DocumentStatusBadge';

export function DocumentList({ documents, totalDocuments, onAction, onClear }: { documents: StudentDocument[]; totalDocuments: number; onAction: (action: DocumentAction, document: StudentDocument) => void; onClear: () => void }) {
  return (
    <section aria-label="Document results" className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-[#172033]">Your Documents</h2><p className="text-[11px] text-[#64748B]">Showing {documents.length} of {totalDocuments} documents</p></div>
      {documents.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-[0_1px_3px_rgba(23,32,51,0.04)] xl:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] table-fixed text-left">
                <colgroup><col className="w-[21%]" /><col className="w-[13%]" /><col className="w-[18%]" /><col className="w-[13%]" /><col className="w-[14%]" /><col className="w-[11%]" /><col className="w-[10%]" /></colgroup>
                <thead className="bg-[#F8FAFC] text-[10px] font-semibold uppercase text-[#64748B]"><tr><th scope="col" className="px-3 py-3">Document</th><th scope="col" className="px-3 py-3">Category</th><th scope="col" className="px-3 py-3">File</th><th scope="col" className="px-3 py-3">Uploaded</th><th scope="col" className="px-3 py-3">Status</th><th scope="col" className="px-3 py-3">Updated</th><th scope="col" className="px-2 py-3">Actions</th></tr></thead>
                <tbody className="divide-y divide-[#EEF1F5]">
                  {documents.map((document) => <tr key={document.id} className="text-xs text-[#334155]"><td className="break-words px-3 py-3.5 font-semibold text-[#172033]">{document.name}</td><td className="break-words px-3 py-3.5 text-[11px]">{document.category}</td><td className="break-all px-3 py-3.5 text-[11px]">{document.fileName ?? '—'}</td><td className="px-3 py-3.5 text-[11px]">{document.uploadedDate ?? '—'}</td><td className="px-3 py-3.5"><DocumentStatusBadge status={document.status} /></td><td className="px-3 py-3.5 text-[11px]">{document.lastUpdated}</td><td className="px-2 py-3.5"><DocumentActions document={document} onAction={onAction} /></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 xl:hidden">{documents.map((document) => <DocumentCard key={document.id} document={document} onAction={onAction} />)}</div>
        </>
      ) : (
        <div className="flex min-w-0 flex-col items-center rounded-xl border border-dashed border-[#B8C9DC] bg-white px-5 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563A8]"><FileSearch size={20} aria-hidden="true" /></span>
          <h3 className="mt-3 text-sm font-semibold text-[#172033]">No documents found</h3>
          <p className="mt-1 text-xs text-[#64748B]">Try changing your search or filters.</p>
          <button type="button" onClick={onClear} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Clear Filters</button>
        </div>
      )}
    </section>
  );
}