import Link from 'next/link';
import { ChevronRight, Upload } from 'lucide-react';

export function DocumentsHeader({ onUpload }: { onUpload: () => void }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page" className="font-medium text-[#334155]">Documents</span>
      </nav>

      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#172033]">Documents</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">Manage your uploaded documents and review their verification status.</p>
        </div>
        <button type="button" onClick={onUpload} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2 sm:w-auto">
          <Upload size={16} aria-hidden="true" />Upload Document
        </button>
      </header>
    </>
  );
}