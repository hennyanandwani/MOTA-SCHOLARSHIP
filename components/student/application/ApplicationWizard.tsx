'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  Save,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ApplicationReview } from '@/components/student/application/ApplicationReview';
import {
  AcademicInformationForm,
  FamilyBankInformationForm,
  PersonalInformationForm,
  type FieldErrors,
} from '@/components/student/application/ApplicationStepForms';
import {
  demoApplicationData,
  emptyDeclarations,
  isSavedApplicationDraft,
  type AcademicInformation,
  type ApplicationData,
  type ApplicationDeclarations,
  type ApplicationStep,
  type BankInformation,
  type FamilyInformation,
  type PersonalInformation,
  type SavedApplicationDraft,
} from '@/lib/applicationDraft';
import type { Scheme } from '@/lib/schemes';

const stepNames = ['Personal', 'Academic', 'Family & Bank', 'Review'] as const;
const buttonBase = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8] focus-visible:ring-offset-2';

const personalRequired: (keyof PersonalInformation)[] = [
  'firstName', 'lastName', 'dateOfBirth', 'gender', 'category', 'stCertificateNumber',
  'identityNumber', 'mobileNumber', 'emailAddress', 'address', 'villageTown', 'district',
  'state', 'pinCode',
];
const academicRequired: (keyof AcademicInformation)[] = [
  'academicLevel', 'course', 'institutionName', 'institutionType', 'universityBoard',
  'currentYearSemester', 'admissionYear', 'academicSession', 'previousQualification',
  'previousResult', 'enrollmentNumber', 'expectedGraduationYear',
];
const familyRequired: (keyof FamilyInformation)[] = [
  'guardianName', 'annualIncome', 'incomeCertificateNumber', 'familyMembers',
];
const bankRequired: (keyof BankInformation)[] = [
  'accountHolderName', 'bankName', 'accountNumber', 'confirmAccountNumber', 'ifscCode', 'branchName',
];

export function ApplicationWizard({ scheme }: { scheme: Scheme }) {
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationData>(demoApplicationData);
  const [declarations, setDeclarations] = useState<ApplicationDeclarations>(emptyDeclarations);
  const [currentStep, setCurrentStep] = useState<ApplicationStep>(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [declarationError, setDeclarationError] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [savedAt, setSavedAt] = useState('');
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  const storageKey = `student-application-draft:${scheme.id}`;
  const eligibilityHref = `/student/schemes/${scheme.id}/eligibility`;
  const documentsHref = `/student/schemes/${scheme.id}/apply/documents`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isSavedApplicationDraft(parsed)) {
          setApplication(parsed.data);
          setCurrentStep(parsed.currentStep);
          setDeclarations(parsed.declarations);
          setSavedAt(parsed.savedAt);
        }
      }
    } catch {
      setDraftMessage('Saved draft could not be loaded. Demo values are shown.');
    }
    setHasLoadedDraft(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedDraft) return;

    const nextSavedAt = new Date().toISOString();
    const draft: SavedApplicationDraft = {
      data: application,
      currentStep,
      declarations,
      savedAt: nextSavedAt,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setSavedAt(nextSavedAt);
    } catch {
      setDraftMessage('This browser could not save the draft locally. Your current entries remain in this session.');
    }
  }, [application, currentStep, declarations, hasLoadedDraft, storageKey]);

  function updateApplicationField(section: 'personal', field: keyof PersonalInformation, value: string): void;
  function updateApplicationField(section: 'academic', field: keyof AcademicInformation, value: string): void;
  function updateApplicationField(section: 'family', field: keyof FamilyInformation, value: string): void;
  function updateApplicationField(section: 'bank', field: keyof BankInformation, value: string): void;
  function updateApplicationField(
    section: keyof ApplicationData,
    field: string,
    value: string,
  ) {
    setApplication((previous) => {
      switch (section) {
        case 'personal':
          return { ...previous, personal: { ...previous.personal, [field]: value } };
        case 'academic':
          return { ...previous, academic: { ...previous.academic, [field]: value } };
        case 'family':
          return { ...previous, family: { ...previous.family, [field]: value } };
        case 'bank':
          return { ...previous, bank: { ...previous.bank, [field]: value } };
      }
    });

    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[`${section}-${field}`];
      return next;
    });
    setDraftMessage('');
  }

  function updateDeclaration(field: keyof ApplicationDeclarations, checked: boolean) {
    setDeclarations((previous) => ({ ...previous, [field]: checked }));
    setDeclarationError('');
    setDraftMessage('');
  }

  function handleSaveDraft() {
    const nextSavedAt = new Date().toISOString();
    const draft: SavedApplicationDraft = {
      data: application,
      currentStep,
      declarations,
      savedAt: nextSavedAt,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setSavedAt(nextSavedAt);
      setDraftMessage('Draft saved on this device.');
    } catch {
      setDraftMessage('This browser could not save the draft locally. Your entries remain in this session.');
    }
  }

  function handleContinue() {
    if (currentStep === 4) {
      if (!declarations.informationIsTrue || !declarations.verificationAcknowledged) {
        setDeclarationError('Please confirm both declarations before continuing to documents.');
        document.getElementById('application-declarations')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('declaration-truth')?.focus({ preventScroll: true });
        return;
      }

      router.push(documentsHref);
      return;
    }

    const errors = validateStep(currentStep, application);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstInvalidId = Object.keys(errors)[0];
      requestAnimationFrame(() => {
        const firstInvalidField = document.getElementById(firstInvalidId);
        firstInvalidField?.focus();
        firstInvalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    setFieldErrors({});
    setCurrentStep((currentStep + 1) as ApplicationStep);
    setDraftMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setCurrentStep((currentStep - 1) as ApplicationStep);
    setFieldErrors({});
    setDeclarationError('');
    setDraftMessage('');
  }

  function editStep(step: ApplicationStep) {
    setCurrentStep(step);
    setDeclarationError('');
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const fullName = [application.personal.firstName, application.personal.middleName, application.personal.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
        <Link href="/student" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Student Portal</Link>
        <span aria-hidden="true">/</span>
        <Link href="/student/all-schemes" className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">All Schemes</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/student/schemes/${scheme.id}`} className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Scheme Details</Link>
        <span aria-hidden="true">/</span>
        <Link href={eligibilityHref} className="rounded-sm hover:text-[#2563A8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]">Eligibility Check</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-[#334155]">Application</span>
      </nav>

      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#2563A8]">Scholarship application</p>
          <h2 className="text-2xl font-bold text-[#172033]">Scholarship Application</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">
            Complete the application carefully. Your information should match your official documents.
          </p>
        </div>
        <div className="w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white p-3.5 sm:max-w-[330px]">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">Draft</span>
            <span className="text-[10px] font-medium text-[#64748B]">{savedAt ? formatSavedAt(savedAt) : 'Preparing local draft'}</span>
          </div>
          <p className="mt-2 break-words text-xs font-semibold text-[#172033]">{scheme.name}</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
            <span>Academic Year: 2026–27</span>
            <span>Draft — Not Submitted</span>
          </div>
        </div>
      </header>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          <ApplicationStepper currentStep={currentStep} />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
            <p className="font-semibold text-[#334155]">Step {currentStep} of 4</p>
            <p className="text-[#64748B]">Your progress is saved locally in this demo.</p>
          </div>

          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              handleContinue();
            }}
            className="min-w-0 rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-6"
          >
            {currentStep === 1 && (
              <PersonalInformationForm
                data={application.personal}
                errors={fieldErrors}
                onChange={(field, value) => updateApplicationField('personal', field, value)}
              />
            )}
            {currentStep === 2 && (
              <AcademicInformationForm
                data={application.academic}
                errors={fieldErrors}
                onChange={(field, value) => updateApplicationField('academic', field, value)}
              />
            )}
            {currentStep === 3 && (
              <FamilyBankInformationForm
                family={application.family}
                bank={application.bank}
                errors={fieldErrors}
                onFamilyChange={(field, value) => updateApplicationField('family', field, value)}
                onBankChange={(field, value) => updateApplicationField('bank', field, value)}
              />
            )}
            {currentStep === 4 && (
              <ApplicationReview
                data={application}
                declarations={declarations}
                declarationError={declarationError}
                onDeclarationChange={updateDeclaration}
                onEdit={editStep}
              />
            )}

            {draftMessage && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-[#126747]">{draftMessage}</p>}

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#EEF1F5] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {currentStep === 1 ? (
                  <Link href={eligibilityHref} className={`${buttonBase} w-full border border-[#DCE3EC] bg-white text-[#334155] hover:bg-[#F8FAFC] sm:w-auto`}>
                    <ArrowLeft size={15} aria-hidden="true" />Back
                  </Link>
                ) : (
                  <button type="button" onClick={goBack} className={`${buttonBase} w-full border border-[#DCE3EC] bg-white text-[#334155] hover:bg-[#F8FAFC] sm:w-auto`}>
                    <ArrowLeft size={15} aria-hidden="true" />Back
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:flex sm:items-center">
                <button type="button" onClick={handleSaveDraft} className={`${buttonBase} border border-[#B8C9DC] bg-white text-[#173F7A] hover:bg-blue-50`}>
                  <Save size={15} aria-hidden="true" />Save Draft
                </button>
                {currentStep < 4 ? (
                  <button type="submit" className={`${buttonBase} bg-[#173F7A] text-white hover:bg-[#123365]`}>
                    Continue<ArrowRight size={15} aria-hidden="true" />
                  </button>
                ) : (
                  <button type="submit" className={`${buttonBase} bg-[#173F7A] text-white hover:bg-[#123365]`}>
                    Continue to Documents<ArrowRight size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </form>
          <p className="text-[11px] leading-5 text-[#64748B]">
            Sample application for demonstration. Do not enter actual identity or bank details.
          </p>
        </div>

        <ApplicationSidebar currentStep={currentStep} fullName={fullName} />
      </div>
    </div>
  );
}

function ApplicationStepper({ currentStep }: { currentStep: ApplicationStep }) {
  return (
    <nav aria-label="Application steps" className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
      <ol className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
        {stepNames.map((stepName, index) => {
          const step = (index + 1) as ApplicationStep;
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <li key={stepName} aria-current={isCurrent ? 'step' : undefined} className="flex min-w-0 items-center gap-2.5">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${isComplete ? 'border-[#16805B] bg-[#16805B] text-white' : isCurrent ? 'border-[#2563A8] bg-blue-50 text-[#173F7A] ring-2 ring-blue-100' : 'border-[#CBD5E1] bg-white text-[#64748B]'}`}>
                {isComplete ? <Check size={15} aria-hidden="true" /> : String(step).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-xs font-semibold ${isCurrent ? 'text-[#173F7A]' : isComplete ? 'text-[#16805B]' : 'text-[#475569]'}`}>{stepName}</span>
                <span className="mt-0.5 block text-[10px] text-[#64748B]">{isCurrent ? 'Current step' : isComplete ? 'Complete' : 'Upcoming'}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ApplicationSidebar({ currentStep, fullName }: { currentStep: ApplicationStep; fullName: string }) {
  const checklist: { label: string; complete: boolean; current?: boolean }[] = [
    { label: 'Eligibility reviewed', complete: true },
    { label: 'Personal information', complete: currentStep > 1, current: currentStep === 1 },
    { label: 'Academic information', complete: currentStep > 2, current: currentStep === 2 },
    { label: 'Family & bank information', complete: currentStep > 3, current: currentStep === 3 },
    { label: 'Documents', complete: false },
    { label: 'Final review', complete: false, current: currentStep === 4 },
    { label: 'Submission', complete: false },
  ];

  return (
    <aside className="hidden min-w-0 space-y-4 xl:block">
      <section aria-labelledby="application-checklist-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-[0_1px_3px_rgba(23,32,51,0.04)]">
        <h2 id="application-checklist-heading" className="text-sm font-semibold text-[#172033]">Application Checklist</h2>
        <ul className="mt-4 space-y-3">
          {checklist.map((item) => (
            <li key={item.label} className="flex min-w-0 items-start gap-2.5 text-xs">
              {item.complete ? (
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#16805B]" aria-hidden="true" />
              ) : item.current ? (
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
              ) : (
                <Circle size={15} className="mt-0.5 shrink-0 text-[#94A3B8]" aria-hidden="true" />
              )}
              <span className={`${item.current ? 'font-semibold text-[#173F7A]' : item.complete ? 'text-[#334155]' : 'text-[#64748B]'}`}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[#DCE3EC] bg-[#F8FAFC] p-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#2563A8]"><HelpCircle size={18} aria-hidden="true" /></span>
        <h2 className="mt-3 text-sm font-semibold text-[#172033]">Need help?</h2>
        <p className="mt-1 text-xs leading-5 text-[#64748B]">Make sure your information matches your official documents.</p>
        <div className="mt-3 flex items-start gap-2 border-t border-[#DCE3EC] pt-3 text-[10px] leading-4 text-[#64748B]">
          <ShieldCheck size={13} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
          {fullName ? `Draft for ${fullName}` : 'Demo draft information'}
        </div>
        <div className="mt-3 flex items-start gap-2 text-[10px] leading-4 text-[#64748B]">
          <FileText size={13} className="mt-0.5 shrink-0 text-[#2563A8]" aria-hidden="true" />
          This preview is stored in this browser only.
        </div>
      </section>
    </aside>
  );
}

function validateStep(step: ApplicationStep, application: ApplicationData): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 1) addRequiredErrors('personal', application.personal, personalRequired, errors);
  if (step === 2) addRequiredErrors('academic', application.academic, academicRequired, errors);
  if (step === 3) {
    addRequiredErrors('family', application.family, familyRequired, errors);
    addRequiredErrors('bank', application.bank, bankRequired, errors);
  }

  if (step === 1 && application.personal.emailAddress.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.personal.emailAddress.trim())) {
      errors['personal-emailAddress'] = 'Enter a valid email address.';
    }
  }

  if (step === 3) {
    if (application.family.familyMembers && Number(application.family.familyMembers) < 1) {
      errors['family-familyMembers'] = 'Enter at least one family member.';
    }
    if (
      application.bank.accountNumber &&
      application.bank.confirmAccountNumber &&
      application.bank.accountNumber !== application.bank.confirmAccountNumber
    ) {
      errors['bank-confirmAccountNumber'] = 'Account numbers do not match.';
    }
  }

  return errors;
}

function addRequiredErrors<T extends object>(
  section: string,
  values: T,
  fields: readonly (keyof T)[],
  errors: FieldErrors,
) {
  for (const field of fields) {
    const value = values[field];
    if (typeof value !== 'string' || !value.trim()) {
      errors[`${section}-${String(field)}`] = 'This field is required.';
    }
  }
}

function formatSavedAt(value: string) {
  const savedTime = new Date(value).getTime();
  if (Number.isNaN(savedTime)) return 'Saved locally on this device';
  if (Date.now() - savedTime < 60_000) return 'Last saved just now · this device';
  return `Last saved ${new Date(savedTime).toLocaleString()} · this device`;
}