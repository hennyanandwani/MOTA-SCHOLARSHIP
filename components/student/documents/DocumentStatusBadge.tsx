import { AlertCircle, CheckCircle2, Clock3, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StudentDocumentStatus } from '@/lib/studentDocuments';

const presentation: Record<StudentDocumentStatus, { Icon: LucideIcon; className: string }> = {
  Verified: { Icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-[#126747]' },
  'Under Review': { Icon: Clock3, className: 'border-blue-200 bg-blue-50 text-[#1D5796]' },
  'Needs Attention': { Icon: AlertCircle, className: 'border-amber-200 bg-amber-50 text-[#80520B]' },
  'Not Uploaded': { Icon: Upload, className: 'border-[#DCE3EC] bg-[#F8FAFC] text-[#475569]' },
};

export function DocumentStatusBadge({ status }: { status: StudentDocumentStatus }) {
  const { Icon, className } = presentation[status];
  return <span className={`inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${className}`}><Icon size={13} aria-hidden="true" />{status}</span>;
}