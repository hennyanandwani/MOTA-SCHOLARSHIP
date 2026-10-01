import { useEffect, useRef } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import type { SupportRequest } from '@/lib/studentSupport';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

interface SupportRequestModalProps {
  request: SupportRequest | null;
  onClose: () => void;
  onToggleStatus: (id: string, nextStatus: 'submitted' | 'resolved') => void;
  onDelete: (id: string) => void;
}

export function SupportRequestModal({
  request,
  onClose,
  onToggleStatus,
  onDelete,
}: SupportRequestModalProps) {
  const t = useStudentTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!request) return;
    const previousFocus = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [request]);

  if (!request) return null;

  const isResolved = request.status === 'resolved';
  const formattedDate = new Date(request.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/45 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-modal-heading"
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-[#DCE3EC] bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#173F7A]">
              <FileText size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#173F7A]">
                  {request.id}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isResolved
                      ? 'bg-emerald-50 text-[#138808] border border-emerald-200'
                      : 'bg-amber-50 text-[#80520B] border border-amber-200'
                  }`}
                >
                  {isResolved ? (
                    <CheckCircle2 size={11} aria-hidden="true" />
                  ) : (
                    <Clock size={11} aria-hidden="true" />
                  )}
                  {t(isResolved ? 'Resolved (Local Demo)' : 'Submitted (Local Demo)')}
                </span>
              </div>
              <h2
                id="ticket-modal-heading"
                className="mt-1 break-words text-base font-bold text-[#172033]"
              >
                {request.subject}
              </h2>
            </div>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t('Close support request details')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        {/* Meta details */}
        <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-[#EEF1F5] py-3 text-xs sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1 text-[11px] text-[#64748B]">
              <Tag size={12} aria-hidden="true" />
              {t('Category')}
            </dt>
            <dd className="mt-0.5 font-semibold text-[#172033]">{t(request.category)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-[11px] text-[#64748B]">
              <Calendar size={12} aria-hidden="true" />
              {t('Created Date')}
            </dt>
            <dd className="mt-0.5 font-semibold text-[#172033]">{formattedDate}</dd>
          </div>
          {request.applicationId && (
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-[11px] text-[#64748B]">{t('Application ID')}</dt>
              <dd className="mt-0.5 font-mono font-semibold text-[#172033]">
                {request.applicationId}
              </dd>
            </div>
          )}
        </dl>

        {/* Description body */}
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            {t('Description / Query')}
          </h3>
          <div className="mt-1.5 rounded-xl border border-[#EEF1F5] bg-[#F8FAFC] p-3.5 text-xs leading-relaxed text-[#334155] whitespace-pre-wrap">
            {request.description}
          </div>
        </div>

        {/* Local Demo Disclaimer */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-[#173F7A]">
          <Info size={16} className="shrink-0 mt-0.5 text-[#173F7A]" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t('Frontend Demonstration Request')}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[#2C5282]">
              {t(
                'This ticket is stored in your local browser storage for interface demonstration purposes. In production, requests will connect to the official MoTA centralized helpdesk.'
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1F5] pt-4">
          <button
            type="button"
            onClick={() => {
              onDelete(request.id);
              onClose();
            }}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-[#A8323D] transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Trash2 size={13} aria-hidden="true" />
            {t('Delete Request')}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onToggleStatus(request.id, isResolved ? 'submitted' : 'resolved');
              }}
              className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-3.5 text-xs font-semibold transition ${
                isResolved
                  ? 'border-[#B8C9DC] bg-white text-[#173F7A] hover:bg-blue-50'
                  : 'border-emerald-300 bg-emerald-50 text-[#0B6B05] hover:bg-emerald-100'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]`}
            >
              {t(isResolved ? 'Mark as Open' : 'Mark as Resolved')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
            >
              {t('Close')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}