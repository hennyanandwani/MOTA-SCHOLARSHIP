import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Application, DocumentReviewStatus, DocumentStatus } from '@/lib/applicationTracking';

const statusPresentation: Record<DocumentReviewStatus, { Icon: LucideIcon; className: string }> = {
  Verified: { Icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-[#126747]' },
  'Needs Attention': { Icon: AlertCircle, className: 'border-amber-200 bg-amber-50 text-[#80520B]' },
  'Under Review': { Icon: Clock3, className: 'border-blue-200 bg-blue-50 text-[#1D5796]' },
  'Not Uploaded': { Icon: Upload, className: 'border-[#DCE3EC] bg-[#F8FAFC] text-[#475569]' },
};

export function DocumentStatusSummary({
  application,
  documentsHref,
}: {
  application: Application;
  documentsHref: string;
}) {
  const requiredDocuments = application.documents.filter((document) => document.required);
  const counts = {
    total: requiredDocuments.length,
    verified: requiredDocuments.filter((document) => document.status === 'Verified').length,
    awaiting: requiredDocuments.filter((document) => document.status === 'Under Review').length,
    attention: requiredDocuments.filter((document) => document.status === 'Needs Attention').length,
    missing: requiredDocuments.filter((document) => document.status === 'Not Uploaded').length,
  };

  return (
    <section aria-labelledby="document-verification-heading" className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="flex items-start gap-2.5 border-b border-[#EEF1F5] pb-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><FileCheck2 size={16} aria-hidden="true" /></span>
        <div><h2 id="document-verification-heading" className="text-sm font-semibold text-[#172033]">Document Verification</h2><p className="mt-1 text-[11px] text-[#64748B]">Required document status summary</p></div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
        <CountItem label="Total required" value={counts.total} />
        <CountItem label="Verified" value={counts.verified} tone="success" />
        <CountItem label="Uploaded / Awaiting review" value={counts.awaiting} tone="primary" />
        <CountItem label="Needs attention" value={counts.attention} tone="warning" />
        <CountItem label="Not uploaded" value={counts.missing} tone="muted" />
      </dl>

      <ul className="mt-4 divide-y divide-[#EEF1F5] border-y border-[#EEF1F5]">
        {requiredDocuments.map((document) => <DocumentRow key={document.id} document={document} />)}
      </ul>

      {counts.attention > 0 && (
        <div className="mt-4 flex min-w-0 items-start gap-2.5 rounded-lg border border-[#E9D5A5] bg-[#FFFBEB] p-3.5">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#94600D]" aria-hidden="true" />
          <div className="min-w-0"><h3 className="text-xs font-semibold text-[#573B0A]">Action may be required</h3><p className="mt-1 text-[11px] leading-5 text-[#765719]">One document has been flagged for additional attention. Please review the document status and follow the instructions provided.</p></div>
        </div>
      )}

      <Link href={documentsHref} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2 sm:w-auto">
        View Documents<Upload size={15} aria-hidden="true" />
      </Link>
      <p className="mt-3 text-[10px] leading-4 text-[#64748B]">Document indicators are informational and do not represent a final verification decision.</p>
    </section>
  );
}

function CountItem({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' | 'primary' | 'warning' | 'muted' }) {
  const valueClass = {
    default: 'text-[#172033]',
    success: 'text-[#126747]',
    primary: 'text-[#1D5796]',
    warning: 'text-[#80520B]',
    muted: 'text-[#475569]',
  }[tone];
  return <div className="min-w-0"><dt className="text-[10px] leading-4 text-[#64748B]">{label}</dt><dd className={`mt-0.5 text-base font-bold ${valueClass}`}>{value}</dd></div>;
}

function DocumentRow({ document }: { document: DocumentStatus }) {
  const presentation = statusPresentation[document.status];
  const Icon = presentation.Icon;
  return (
    <li className="flex min-w-0 flex-col gap-1.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="break-words text-xs font-medium text-[#334155]">{document.name}</span>
      <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${presentation.className}`}><Icon size={12} aria-hidden="true" />{document.status}</span>
    </li>
  );
}