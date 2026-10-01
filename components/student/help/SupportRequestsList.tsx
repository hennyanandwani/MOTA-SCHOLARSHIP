import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  FolderOpen,
  Tag,
  Trash2,
} from 'lucide-react';
import type { SupportRequest } from '@/lib/studentSupport';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

interface SupportRequestsListProps {
  requests: SupportRequest[];
  onSelectRequest: (request: SupportRequest) => void;
  onToggleStatus: (id: string, nextStatus: 'submitted' | 'resolved') => void;
  onDeleteRequest: (id: string) => void;
}

export function SupportRequestsList({
  requests,
  onSelectRequest,
  onToggleStatus,
  onDeleteRequest,
}: SupportRequestsListProps) {
  const t = useStudentTranslation();

  return (
    <section aria-labelledby="my-support-requests-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#173F7A]">
            <FileText size={16} aria-hidden="true" />
          </span>
          <div>
            <h2
              id="my-support-requests-heading"
              className="text-base font-bold text-[#172033]"
            >
              {t('My Support Requests')}
            </h2>
            <p className="text-xs text-[#64748B]">
              {t('Locally stored support tickets and verification inquiries.')}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
          {requests.length} {t(requests.length === 1 ? 'ticket' : 'tickets')}
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCE3EC] bg-white p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FolderOpen size={24} aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-semibold text-[#172033]">
            {t('No support requests yet.')}
          </p>
          <p className="mt-1 max-w-sm text-xs text-[#64748B]">
            {t('When you submit a support query, it will appear here for local tracking and review.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isResolved = req.status === 'resolved';
            const formattedDate = new Date(req.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <article
                key={req.id}
                className="flex flex-col rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-xs transition hover:border-[#B8C9DC] sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#173F7A]">
                        {req.id}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
                        <Tag size={10} aria-hidden="true" />
                        {t(req.category)}
                      </span>
                      {req.applicationId && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#173F7A]">
                          {req.applicationId}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1.5 break-words text-sm font-bold text-[#172033]">
                      {req.subject}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isResolved
                          ? 'bg-emerald-50 text-[#138808] border border-emerald-200'
                          : 'bg-amber-50 text-[#80520B] border border-amber-200'
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 size={12} aria-hidden="true" />
                      ) : (
                        <Clock size={12} aria-hidden="true" />
                      )}
                      {t(isResolved ? 'Resolved' : 'Submitted')}
                    </span>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#475569]">
                  {req.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1F5] pt-3 text-xs">
                  <span className="flex items-center gap-1 text-[11px] text-[#64748B]">
                    <Calendar size={12} aria-hidden="true" />
                    {t('Created')}: {formattedDate}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectRequest(req)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#B8C9DC] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#173F7A] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
                    >
                      <Eye size={13} aria-hidden="true" />
                      {t('View Details')}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onToggleStatus(req.id, isResolved ? 'submitted' : 'resolved')
                      }
                      className="inline-flex items-center rounded-lg border border-[#DCE3EC] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
                    >
                      {t(isResolved ? 'Reopen' : 'Mark as Resolved')}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteRequest(req.id)}
                      aria-label={`${t('Delete request')} ${req.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}