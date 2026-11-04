import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function DocumentsHeader() {
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <ChevronRight size={13} aria-hidden="true" />
        <span aria-current="page" className="font-medium text-[#334155]">Documents</span>
      </nav>

      <header className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#172033]">Documents</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">Review saved document metadata and verification status across your applications.</p>
        </div>
      </header>
    </>
  );
}