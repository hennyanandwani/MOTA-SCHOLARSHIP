import { useState, useEffect, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  LifeBuoy,
  RotateCcw,
  Save,
  Send,
} from 'lucide-react';
import {
  SUPPORT_CATEGORIES,
  type SupportCategory,
  type SupportDraft,
  getSupportDraft,
  saveSupportDraft,
  clearSupportDraft,
} from '@/lib/studentSupport';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

interface SupportFormProps {
  onSubmitSuccess: (data: {
    category: string;
    subject: string;
    description: string;
    applicationId?: string;
  }) => void;
  createdTicketId: string | null;
}

export function SupportForm({ onSubmitSuccess, createdTicketId }: SupportFormProps) {
  const t = useStudentTranslation();

  const [category, setCategory] = useState<string>('Application');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [applicationId, setApplicationId] = useState('');

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    category?: string;
    subject?: string;
    description?: string;
  }>({});

  // Load draft on mount
  useEffect(() => {
    const draft = getSupportDraft();
    if (draft) {
      if (draft.category) setCategory(draft.category);
      if (draft.subject) setSubject(draft.subject);
      if (draft.description) setDescription(draft.description);
      if (draft.applicationId) setApplicationId(draft.applicationId);
      setHasDraft(Boolean(draft.subject || draft.description || draft.applicationId));
    }
    setIsDraftLoaded(true);
  }, []);

  // Auto-save draft when fields change
  useEffect(() => {
    if (!isDraftLoaded) return;

    const hasContent = Boolean(subject.trim() || description.trim() || applicationId.trim());
    setHasDraft(hasContent);

    if (hasContent) {
      const draftPayload: SupportDraft = {
        category,
        subject,
        description,
        applicationId,
      };
      saveSupportDraft(draftPayload);
    }
  }, [category, subject, description, applicationId, isDraftLoaded]);

  function handleClearDraft() {
    clearSupportDraft();
    setCategory('Application');
    setSubject('');
    setDescription('');
    setApplicationId('');
    setHasDraft(false);
    setShowClearConfirm(false);
    setValidationErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: {
      category?: string;
      subject?: string;
      description?: string;
    } = {};

    if (!category) {
      errors.category = t('Please select a support category.');
    }
    if (!subject.trim()) {
      errors.subject = t('Subject is required.');
    } else if (subject.trim().length < 3) {
      errors.subject = t('Subject must be at least 3 characters.');
    }
    if (!description.trim()) {
      errors.description = t('Description is required.');
    } else if (description.trim().length < 10) {
      errors.description = t('Please provide at least 10 characters describing your issue.');
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    onSubmitSuccess({
      category,
      subject,
      description,
      applicationId: applicationId.trim() || undefined,
    });

    // Clear form after successful submit
    clearSupportDraft();
    setSubject('');
    setDescription('');
    setApplicationId('');
    setHasDraft(false);
  }

  return (
    <section
      aria-labelledby="contact-support-heading"
      className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#173F7A]">
            <LifeBuoy size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id="contact-support-heading" className="text-base font-bold text-[#172033]">
              {t('Contact Support')}
            </h2>
            <p className="text-xs text-[#64748B]">
              {t('Submit a question or report an issue regarding your scholarship application.')}
            </p>
          </div>
        </div>

        {hasDraft && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-[#138808] border border-emerald-200">
              <Save size={11} aria-hidden="true" />
              {t('Draft saved locally')}
            </span>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <RotateCcw size={12} aria-hidden="true" />
              {t('Clear draft')}
            </button>
          </div>
        )}
      </div>

      {/* Demo notice banner */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
        <Info size={16} className="shrink-0 mt-0.5 text-amber-800" aria-hidden="true" />
        <div>
          <p className="font-semibold text-amber-900">
            {t('Demo support request — server-side support processing will be connected later.')}
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-amber-800">
            {t(
              'All requests submitted here are saved locally in your browser storage for demonstration. No active request will be dispatched to the Ministry helpdesk at this stage.'
            )}
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {createdTicketId && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-[#0B6B05]"
        >
          <CheckCircle2 size={18} className="shrink-0 text-[#138808] mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold text-sm text-[#0B6B05]">
              {t('Support request saved')}
            </p>
            <p className="mt-1 text-xs text-[#138808]">
              {t('Your support reference is')}{' '}
              <span className="font-mono font-bold underline">{createdTicketId}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-[#2F6F27]">
              {t('You can view and manage this ticket below under "My Support Requests".')}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Category */}
          <div className="space-y-1.5">
            <label
              htmlFor="support-category"
              className="block text-xs font-bold text-[#172033]"
            >
              {t('Support Category')} <span className="text-rose-500">*</span>
            </label>
            <select
              id="support-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`min-h-11 w-full rounded-xl border bg-white px-3 text-xs text-[#172033] shadow-xs focus:outline-none focus:ring-2 ${
                validationErrors.category
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-[#DCE3EC] focus:border-[#2563A8] focus:ring-[#2563A8]/20'
              }`}
            >
              {SUPPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(cat)}
                </option>
              ))}
            </select>
            {validationErrors.category && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle size={11} aria-hidden="true" />
                {validationErrors.category}
              </p>
            )}
          </div>

          {/* Application ID (Optional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="support-app-id"
              className="block text-xs font-bold text-[#172033]"
            >
              {t('Application ID (Optional)')}
            </label>
            <input
              id="support-app-id"
              type="text"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder={t('e.g. NFST-2026-90412')}
              className="min-h-11 w-full rounded-xl border border-[#DCE3EC] bg-white px-3 text-xs text-[#172033] placeholder-[#94A3B8] shadow-xs focus:border-[#2563A8] focus:outline-none focus:ring-2 focus:ring-[#2563A8]/20"
            />
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label
            htmlFor="support-subject"
            className="block text-xs font-bold text-[#172033]"
          >
            {t('Subject')} <span className="text-rose-500">*</span>
          </label>
          <input
            id="support-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('Brief summary of your query...')}
            className={`min-h-11 w-full rounded-xl border bg-white px-3 text-xs text-[#172033] placeholder-[#94A3B8] shadow-xs focus:outline-none focus:ring-2 ${
              validationErrors.subject
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-[#DCE3EC] focus:border-[#2563A8] focus:ring-[#2563A8]/20'
            }`}
          />
          {validationErrors.subject && (
            <p className="text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle size={11} aria-hidden="true" />
              {validationErrors.subject}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label
            htmlFor="support-description"
            className="block text-xs font-bold text-[#172033]"
          >
            {t('Description')} <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="support-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('Please provide complete details regarding your issue or inquiry...')}
            className={`w-full rounded-xl border bg-white p-3 text-xs text-[#172033] placeholder-[#94A3B8] shadow-xs focus:outline-none focus:ring-2 ${
              validationErrors.description
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-[#DCE3EC] focus:border-[#2563A8] focus:ring-[#2563A8]/20'
            }`}
          />
          {validationErrors.description && (
            <p className="text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle size={11} aria-hidden="true" />
              {validationErrors.description}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#173F7A] px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#123365] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
          >
            <Send size={14} aria-hidden="true" />
            {t('Submit Support Request')}
          </button>
        </div>
      </form>

      {/* Clear Draft Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#172033]/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-draft-heading"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-2xl">
            <h3 id="clear-draft-heading" className="text-sm font-bold text-[#172033]">
              {t('Clear Support Draft?')}
            </h3>
            <p className="mt-2 text-xs leading-5 text-[#64748B]">
              {t('Are you sure you want to discard your saved draft? This action cannot be undone.')}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg border border-[#DCE3EC] px-3 py-1.5 text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC]"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleClearDraft}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                {t('Clear Draft')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}