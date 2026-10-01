'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useStudentTranslation } from './StudentSettingsProvider';

export function SettingsDialog({ title, description, children, confirmLabel, onClose, onConfirm }: {
  title: string;
  description: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  const t = useStudentTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
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
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172033]/45 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="settings-dialog-heading" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-[#DCE3EC] bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h2 id="settings-dialog-heading" className="text-base font-bold text-[#172033]">{t(title)}</h2><p className="mt-2 text-xs leading-5 text-[#64748B]">{t(description)}</p></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={`${t('Close')} ${t(title)}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"><X size={17} aria-hidden="true" /></button>
        </div>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#EEF1F5] pt-3">
          <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#B8C9DC] bg-white px-4 text-xs font-semibold text-[#334155] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">{t('Close')}</button>
          {confirmLabel && onConfirm && <button type="button" onClick={onConfirm} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">{t(confirmLabel)}</button>}
        </div>
      </section>
    </div>
  );
}