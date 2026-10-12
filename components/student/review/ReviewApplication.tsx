'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  ClipboardCheck,
  Info,
  ShieldCheck,
} from 'lucide-react';
import type { SchemeType } from '@/lib/schemes';
import {
  createEmptyApplicationDocuments,
  mergePersistedApplicationDocuments,
  type ApplicationDocument,
} from '@/lib/applicationDocuments';
import {
  createEmptyApplicationData,
  getApplicationSubmissionErrors,
  restoreApplicationData,
  type ApplicationData,
  type ApplicationStep,
} from '@/lib/applicationDraft';
import {
  fetchStudentApplications,
  saveStudentApplicationDraft,
  submitStudentApplication,
} from '@/lib/studentApplicationsApi';
import { ApplicationCompleteness } from '@/components/student/review/ApplicationCompleteness';
import {
  DeclarationChecklist,
  initialReviewDeclarations,
  type ReviewDeclaration,
  type ReviewDeclarations,
} from '@/components/student/review/DeclarationChecklist';
import { ReviewDocuments } from '@/components/student/review/ReviewDocuments';
import { ReviewFieldGrid, ReviewSection, type ReviewFieldItem } from '@/components/student/review/ReviewSection';
import { SubmissionSuccess, SubmitConfirmationModal } from '@/components/student/review/SubmissionStates';
import { useStudentSettings } from '@/components/student/settings/StudentSettingsProvider';
import { maskSensitiveValue } from '@/lib/studentSettings';

type ReviewApplicationProps = {
  schemeId: string;
  schemeName: string;
  schemeType: SchemeType;
};

const buttonBase = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';
const stepNames = ['Personal', 'Academic', 'Family & Bank', 'Documents', 'Review & Submit'];

export function ReviewApplication({ schemeId, schemeName, schemeType }: ReviewApplicationProps) {
  const router = useRouter();
  const { currentSettings } = useStudentSettings();
  const [application, setApplication] = useState<ApplicationData>(createEmptyApplicationData);
  const [documents, setDocuments] = useState<ApplicationDocument[]>(createEmptyApplicationDocuments);
  const [lastSaved, setLastSaved] = useState('');
  const [declarations, setDeclarations] = useState<ReviewDeclarations>(initialReviewDeclarations);
  const [applicationId, setApplicationId] = useState('');
  const [applicationNumber, setApplicationNumber] = useState('');
  const [applicationStatus, setApplicationStatus] = useState('DRAFT');
  const [submittedAt, setSubmittedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [savingStep, setSavingStep] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);
  const submissionRef = useRef(false);
  const savingStepRef = useRef(false);

  const applicationHref = `/student/schemes/${schemeId}/apply`;
  const documentsHref = `/student/schemes/${schemeId}/apply/documents`;

  useEffect(() => {
    let active = true;

    async function loadApplication() {
      try {
        const applications = await fetchStudentApplications();
        let cachedApplicationId: string | null = null;
        try {
          cachedApplicationId = localStorage.getItem(`student-application-id:${schemeId}`);
        } catch {
          // Match by scheme when browser storage is unavailable.
        }
        const draft = applications.find(
          (item) => item.schemeId === schemeId && item.id === cachedApplicationId,
        ) ?? applications.find(
          (item) => item.schemeId === schemeId,
        );

        if (!draft) {
          if (active) setLoadError('No saved application was found for this scholarship. Save your application before reviewing it.');
          return;
        }

        const restoredData = restoreApplicationData(draft.formData);
        if (!restoredData) {
          if (active) setLoadError('The saved application has an unsupported format. Please contact support before continuing.');
          return;
        }

        if (!active) return;
        setApplication(restoredData);
        setDocuments(
          mergePersistedApplicationDocuments(
            createEmptyApplicationDocuments(),
            draft.documents,
          ),
        );
        setApplicationNumber(draft.applicationNumber);
        setApplicationId(draft.id);
        setApplicationStatus(draft.status);
        setLastSaved(formatSavedDate(draft.updatedAt));
        setSubmittedAt(draft.submittedAt ?? '');
        setDeclarations({
          informationAccurate: draft.informationConfirmed,
          verificationAcknowledged: draft.verificationAcknowledged,
          eligibilityNotGuaranteed: draft.eligibilityNotGuaranteed,
          termsAccepted: draft.termsAccepted,
        });
        try {
          localStorage.setItem(`student-application-id:${schemeId}`, draft.id);
        } catch {
          // The server remains the source of truth; the ID can be recovered by scheme.
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error
            ? `Could not load your saved application: ${error.message}`
            : 'Could not load your saved application. Please try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadApplication();
    return () => {
      active = false;
    };
  }, [schemeId]);

  const fullName = [application.personal.firstName, application.personal.middleName, application.personal.lastName]
    .filter(Boolean)
    .join(' ');
  const incompleteDocuments = documents.filter((document) => (
    document.required && document.status !== 'uploaded' && document.status !== 'verified'
  ));
  const allDeclarationsChecked = Object.values(declarations).every(Boolean);

  function updateDeclaration(id: ReviewDeclaration, checked: boolean) {
    setDeclarations((previous) => ({ ...previous, [id]: checked }));
  }

  async function editApplicationStep(step: ApplicationStep) {
    if (savingStepRef.current || applicationStatus !== 'DRAFT') return;
    savingStepRef.current = true;
    setSavingStep(true);
    setLoadError('');
    try {
      const saved = await saveStudentApplicationDraft({
        schemeId,
        applicationId: applicationId || undefined,
        currentStep: step,
        data: application,
        declarations: {
          informationIsTrue: declarations.informationAccurate,
          verificationAcknowledged: declarations.verificationAcknowledged,
          eligibilityNotGuaranteed: declarations.eligibilityNotGuaranteed,
          termsAccepted: declarations.termsAccepted,
        },
      });
      try {
        localStorage.setItem(`student-application-id:${schemeId}`, saved.id);
      } catch {
        // The application can still be recovered from the authenticated account.
      }
      setApplicationId(saved.id);
      setApplicationNumber(saved.applicationNumber);
      setLastSaved(formatSavedDate(saved.updatedAt));
      router.push(applicationHref);
    } catch (error) {
      setLoadError(error instanceof Error
        ? `Could not save your review changes: ${error.message}`
        : 'Could not save your review changes. Please try again.');
    } finally {
      savingStepRef.current = false;
      setSavingStep(false);
    }
  }

  async function confirmSubmission() {
    if (submissionRef.current || applicationStatus !== 'DRAFT') return;
    submissionRef.current = true;
    setSavingStep(true);
    setSubmissionErrors([]);

    try {
      const saved = await saveStudentApplicationDraft({
        schemeId,
        applicationId,
        currentStep: 4,
        data: application,
        declarations: {
          informationIsTrue: declarations.informationAccurate,
          verificationAcknowledged: declarations.verificationAcknowledged,
          eligibilityNotGuaranteed: declarations.eligibilityNotGuaranteed,
          termsAccepted: declarations.termsAccepted,
        },
      });
      setApplicationId(saved.id);

      try {
        localStorage.setItem(`student-application-id:${schemeId}`, saved.id);
      } catch {
        // Submission can continue using the authenticated application ID.
      }

      const submitted = await submitStudentApplication(saved.id);
      setApplicationNumber(submitted.applicationNumber);
      setApplicationStatus(submitted.status);
      setSubmittedAt(submitted.submittedAt);
      setLastSaved(formatSavedDate(submitted.submittedAt));
      setShowConfirmation(false);
    } catch (error) {
      setSubmissionErrors([
        error instanceof Error ? error.message : 'Unable to submit your application. Please try again.',
      ]);
      setShowConfirmation(false);
    } finally {
      submissionRef.current = false;
      setSavingStep(false);
    }
  }

  const personalFields: ReviewFieldItem[] = [
    { label: 'Full Name', value: fullName },
    { label: 'Date of Birth', value: formatDate(application.personal.dateOfBirth) },
    { label: 'Gender', value: application.personal.gender },
    { label: 'Mobile Number', value: maskSensitiveValue(application.personal.mobileNumber, currentSettings.maskSensitiveInformation) },
    { label: 'Email', value: application.personal.emailAddress },
    { label: 'Address', value: application.personal.address },
    { label: 'Village / Town', value: application.personal.villageTown },
    { label: 'District', value: application.personal.district },
    { label: 'State', value: application.personal.state },
  ];

  const academicFields: ReviewFieldItem[] = [
    { label: 'Current Academic Level', value: application.academic.academicLevel },
    { label: 'Course / Program', value: application.academic.course },
    { label: 'Institution Name', value: application.academic.institutionName },
    { label: 'University / Board', value: application.academic.universityBoard },
    { label: 'Academic Year', value: application.academic.academicSession },
    { label: 'Previous Qualification', value: application.academic.previousQualification },
    { label: 'Previous Year Percentage / CGPA', value: application.academic.previousResult },
  ];

  const familyFields: ReviewFieldItem[] = [
    { label: 'Annual Family Income', value: formatIncome(application.family.annualIncome) },
    { label: 'Parent / Guardian Name', value: application.family.guardianName },
    { label: 'Parent / Guardian Occupation', value: application.family.guardianOccupation },
    { label: 'Family Category', value: application.personal.category },
    { label: 'Bank Name', value: application.bank.bankName },
    { label: 'Account Number', value: maskSensitiveValue(application.bank.accountNumber, currentSettings.maskSensitiveInformation) },
    { label: 'IFSC Code', value: application.bank.ifscCode },
  ];

  if (loading) {
    return <p role="status" className="rounded-lg border border-[#DCE3EC] bg-white p-4 text-sm text-[#475569]">Loading your saved application…</p>;
  }

  if (loadError) {
    return (
      <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
        <h1 className="text-base font-semibold text-[#A8323D]">Application review unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-[#7F2931]">{loadError}</p>
        <Link href={applicationHref} className={`${buttonBase} mt-4 border border-[#DCE3EC] bg-white text-[#334155] hover:bg-[#F8FAFC]`}>
          <ArrowLeft size={15} aria-hidden="true" />Return to application
        </Link>
      </section>
    );
  }

  if (applicationStatus === 'SUBMITTED') {
    return (
      <SubmissionSuccess
        applicationId={applicationId}
        submittedOn={formatSubmittedDate(submittedAt)}
        schemeName={schemeName}
      />
    );
  }

  if (applicationStatus !== 'DRAFT') {
    return (
      <section role="status" className="rounded-xl border border-[#DCE3EC] bg-white p-5">
        <h1 className="text-base font-semibold text-[#172033]">Application is being processed</h1>
        <p className="mt-2 text-sm leading-6 text-[#475569]">
          This application is no longer an editable draft. Current status: {applicationStatus}.
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <span aria-hidden="true">/</span>
        <Link href="/student/applications" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">My Applications</Link>
        <span aria-hidden="true">/</span>
        <Link href={applicationHref} className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Application</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-[#334155]">Review &amp; Submit</span>
      </nav>

      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#2563A8]">Final application step</p>
          <h1 className="text-2xl font-bold text-[#172033]">Review &amp; Submit Application</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#64748B]">Review your information and documents carefully before submitting your application.</p>
        </div>
      </header>

      <ApplicationStepper documentsIncomplete={incompleteDocuments.length > 0} />

      <section aria-label="Application information" className="rounded-xl border border-[#C9D8E8] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><ClipboardCheck size={19} aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2563A8]">{schemeType} application</p>
              <h2 className="mt-1 break-words text-sm font-bold text-[#172033]">{schemeName}</h2>
              <p className="mt-1 break-all text-[11px] text-[#64748B]">Application reference: {applicationNumber || applicationId}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-[#EEF1F5] pt-3 sm:grid-cols-3 lg:min-w-[430px] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <InfoValue label="Application Type" value={schemeType} />
            <InfoValue label="Last Saved" value={lastSaved} />
            <div className="col-span-2 sm:col-span-1"><p className="text-[10px] text-[#64748B]">Application Status</p><span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#1D5796]"><ClipboardCheck size={12} aria-hidden="true" />{applicationStatus}</span></div>
          </div>
        </div>
      </section>

      {incompleteDocuments.length > 0 && (
        <section aria-labelledby="documents-warning-heading" className="rounded-xl border border-[#E9D5A5] bg-[#FFFBEB] p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[#94600D]"><AlertCircle size={18} aria-hidden="true" /></span>
            <div className="min-w-0">
              <h2 id="documents-warning-heading" className="text-sm font-semibold text-[#573B0A]">Some documents need your attention</h2>
              <p className="mt-1 text-xs leading-5 text-[#765719]">Your application can be submitted only after all required information and documents are completed.</p>
              <p className="mt-2 text-[11px] font-semibold text-[#684B10]">{incompleteDocuments.length} required document{incompleteDocuments.length === 1 ? '' : 's'} need attention or upload.</p>
              <Link href={documentsHref} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A34E] bg-white px-3 text-xs font-semibold text-[#684B10] hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94600D]"><ArrowLeft size={14} aria-hidden="true" />Review documents</Link>
            </div>
          </div>
        </section>
      )}

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <ReviewSection number="01" title="Personal Information" onEdit={() => editApplicationStep(1)}>
          <ReviewFieldGrid fields={personalFields} />
        </ReviewSection>
        <ReviewSection number="02" title="Academic Information" onEdit={() => editApplicationStep(2)}>
          <ReviewFieldGrid fields={academicFields} />
        </ReviewSection>
        <ReviewSection number="03" title="Family & Financial Information" onEdit={() => editApplicationStep(3)}>
          <ReviewFieldGrid fields={familyFields} />
        </ReviewSection>
        <ApplicationCompleteness
          documentsComplete={incompleteDocuments.length === 0}
          declarationsComplete={allDeclarationsChecked}
        />
      </div>

      <ReviewDocuments documents={documents} documentsHref={documentsHref} />

      <section className="flex min-w-0 items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <Info size={16} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
        <div>
          <h2 className="text-xs font-semibold text-[#173F7A]">Important review notes</h2>
          <p className="mt-1 text-xs leading-5 text-[#31577F]">Please review your application carefully before submission. Information submitted through this portal will be subject to official verification and scrutiny.</p>
        </div>
      </section>

      <DeclarationChecklist values={declarations} onChange={updateDeclaration} />

      <section aria-labelledby="ready-to-submit-heading" className="rounded-xl border border-[#C9D8E8] bg-[#F1F6FC] p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 id="ready-to-submit-heading" className="text-sm font-semibold text-[#172033]">Ready to submit?</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#475569]">Your application will be locked as submitted and enter the official review queue.</p>
            {incompleteDocuments.length > 0 && <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium leading-5 text-[#80520B]"><AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />Complete all required documents before submission.</p>}
            {!allDeclarationsChecked && <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium leading-5 text-[#80520B]"><AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />Accept all declarations before submission.</p>}
            {savingStep && <p role="status" className="mt-2 text-[10px] text-[#64748B]">Saving your application…</p>}
          </div>
          <div className="grid gap-2 sm:flex sm:items-center">
            <Link href={documentsHref} className={`${buttonBase} w-full border border-[#B8C9DC] bg-white text-[#173F7A] hover:bg-blue-50 sm:w-auto`}><ArrowLeft size={15} aria-hidden="true" />Back to Documents</Link>
            <button
              type="button"
              disabled={savingStep}
              onClick={() => {
                const errors = getApplicationSubmissionErrors(application);
                if (incompleteDocuments.length > 0) {
                  errors.push(...incompleteDocuments.map((document) => (
                    `${document.name} is required and must be uploaded without a rejection or review flag.`
                  )));
                }
                if (!allDeclarationsChecked) {
                  errors.push('Accept all four declarations before submitting.');
                }
                setSubmissionErrors(errors);
                if (errors.length === 0) setShowConfirmation(true);
              }}
              className={`${buttonBase} w-full bg-[#173F7A] text-white hover:bg-[#123365] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto`}
            >
              Submit Application<ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {submissionErrors.length > 0 && (
        <section role="alert" aria-label="Submission requirements" className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <h2 className="text-sm font-semibold text-[#A8323D]">Please correct these items before submission</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-[#7F2931]">
            {submissionErrors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </section>
      )}

      <p className="flex items-start gap-2 border-t border-[#DCE3EC] pt-3 text-[10px] leading-4 text-[#64748B]"><ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />Final eligibility is determined through official verification. Selection is subject to the applicable scheme process.</p>

      {showConfirmation && (
        <SubmitConfirmationModal
          onCancel={() => setShowConfirmation(false)}
          onConfirm={() => void confirmSubmission()}
        />
      )}
    </div>
  );
}

function ApplicationStepper({ documentsIncomplete }: { documentsIncomplete: boolean }) {
  return (
    <nav aria-label="Application progress" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-[#172033]">Application progress</h2><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1D5796]">Step 5 of 5</span></div>
      <ol className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-5 sm:gap-2">
        {stepNames.map((name, index) => {
          const complete = index < 3;
          const current = index === 4;
          const Icon = complete ? Check : index === 3 && documentsIncomplete ? AlertCircle : Circle;
          const label = complete ? 'Complete' : current ? 'Current step' : documentsIncomplete ? 'Needs attention' : 'Complete';
          return (
            <li key={name} aria-current={current ? 'step' : undefined} className="flex min-w-0 items-center gap-2.5 sm:flex-col sm:items-start sm:gap-2">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${complete ? 'border-[#16805B] bg-[#16805B] text-white' : current ? 'border-[#2563A8] bg-blue-50 text-[#173F7A] ring-2 ring-blue-100' : index === 3 && documentsIncomplete ? 'border-amber-300 bg-amber-50 text-[#80520B]' : 'border-[#CBD5E1] bg-white text-[#64748B]'}`}>
                {complete || (index === 3 && documentsIncomplete) ? <Icon size={14} aria-hidden="true" /> : String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0"><span className={`block break-words text-xs font-semibold leading-4 ${complete ? 'text-[#16805B]' : current ? 'text-[#173F7A]' : index === 3 && documentsIncomplete ? 'text-[#80520B]' : 'text-[#475569]'}`}>{name}</span><span className="mt-0.5 block text-[10px] text-[#64748B]">{label}</span></span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function InfoValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[10px] text-[#64748B]">{label}</p><p className="mt-1 break-words text-xs font-semibold text-[#172033]">{value}</p></div>;
}

function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function formatSavedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatSubmittedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
}

function formatIncome(value: string): string {
  if (!value || !Number.isFinite(Number(value))) return value;
  return `₹${Number(value).toLocaleString('en-IN')}`;
}
