'use client';

import { Check, PencilLine } from 'lucide-react';
import { useStudentSettings } from '@/components/student/settings/StudentSettingsProvider';
import { maskSensitiveValue } from '@/lib/studentSettings';
import type {
  AcademicInformation,
  ApplicationData,
  ApplicationDeclarations,
  ApplicationStep,
} from '@/lib/applicationDraft';

type ReviewSectionProps = {
  data: ApplicationData;
  declarations: ApplicationDeclarations;
  declarationError: string;
  onDeclarationChange: (field: keyof ApplicationDeclarations, checked: boolean) => void;
  onEdit: (step: ApplicationStep) => void;
};

export function ApplicationReview({
  data,
  declarations,
  declarationError,
  onDeclarationChange,
  onEdit,
}: ReviewSectionProps) {
  const { currentSettings } = useStudentSettings();
  const maskSensitiveInformation = currentSettings.maskSensitiveInformation;
  const fullName = [data.personal.firstName, data.personal.middleName, data.personal.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <section aria-labelledby="application-review-heading">
      <div>
        <h2 id="application-review-heading" className="text-lg font-semibold text-[#172033]">Review Your Application</h2>
        <p className="mt-1 text-sm leading-5 text-[#64748B]">Review all information carefully before continuing to document submission.</p>
      </div>

      <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
        <ReviewCard
          title="Personal Information"
          step={1}
          onEdit={onEdit}
          values={[
            ['Full Name', fullName],
            ['Date of Birth', formatDate(data.personal.dateOfBirth)],
            ['Gender', data.personal.gender],
            ['Category', data.personal.category],
            ['ST Certificate Number', maskSensitiveValue(data.personal.stCertificateNumber, maskSensitiveInformation)],
            ['Aadhaar / Identity Number', maskSensitiveValue(data.personal.identityNumber, maskSensitiveInformation)],
            ['Mobile Number', maskSensitiveValue(data.personal.mobileNumber, maskSensitiveInformation)],
            ['Email Address', data.personal.emailAddress],
            ['Address', data.personal.address],
            ['Village / Town', data.personal.villageTown],
            ['District', data.personal.district],
            ['State and PIN Code', `${data.personal.state} ${data.personal.pinCode}`],
          ]}
        />
        <ReviewCard
          title="Academic Information"
          step={2}
          onEdit={onEdit}
          values={academicValues(data.academic)}
        />
        <ReviewCard
          title="Family Information"
          step={3}
          onEdit={onEdit}
          values={[
            ['Father / Guardian', data.family.guardianName],
            ['Mother', data.family.motherName],
            ['Family Annual Income', data.family.annualIncome ? `₹${Number(data.family.annualIncome).toLocaleString('en-IN')}` : ''],
            ['Income Certificate Number', maskSensitiveValue(data.family.incomeCertificateNumber, maskSensitiveInformation)],
            ['Occupation', data.family.guardianOccupation],
            ['Family Members', data.family.familyMembers],
            ['Residential Status', data.family.residentialStatus],
          ]}
        />
        <ReviewCard
          title="Bank Information"
          step={3}
          onEdit={onEdit}
          values={[
            ['Account Holder', data.bank.accountHolderName],
            ['Bank Name', data.bank.bankName],
            ['Account Number', maskSensitiveValue(data.bank.accountNumber, maskSensitiveInformation)],
            ['IFSC Code', data.bank.ifscCode],
            ['Branch Name', data.bank.branchName],
          ]}
        />
      </div>

      <section id="application-declarations" aria-labelledby="declaration-heading" className="mt-5 scroll-mt-24 rounded-xl border border-[#DCE3EC] bg-[#F8FAFC] p-4 sm:p-5">
        <h3 id="declaration-heading" className="text-sm font-semibold text-[#172033]">Declaration</h3>
        <div className="mt-3 space-y-3">
          <DeclarationCheckbox
            id="declaration-truth"
            checked={declarations.informationIsTrue}
            onChange={(checked) => onDeclarationChange('informationIsTrue', checked)}
            invalid={Boolean(declarationError) && !declarations.informationIsTrue}
          >
            I confirm that the information provided in this application is true and matches my available supporting documents.
          </DeclarationCheckbox>
          <DeclarationCheckbox
            id="declaration-verification"
            checked={declarations.verificationAcknowledged}
            onChange={(checked) => onDeclarationChange('verificationAcknowledged', checked)}
            invalid={Boolean(declarationError) && !declarations.verificationAcknowledged}
          >
            I understand that the application may be subject to document verification and official scrutiny.
          </DeclarationCheckbox>
        </div>
        {declarationError && <p role="alert" className="mt-3 text-xs font-medium text-[#A8323D]">{declarationError}</p>}
        <button
          type="button"
          onClick={() => onEdit(1)}
          className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
        >
          <PencilLine size={14} aria-hidden="true" />Back to Edit
        </button>
      </section>
    </section>
  );
}

function ReviewCard({
  title,
  step,
  values,
  onEdit,
}: {
  title: string;
  step: ApplicationStep;
  values: [string, string][];
  onEdit: (step: ApplicationStep) => void;
}) {
  return (
    <article className="min-w-0 rounded-lg border border-[#DCE3EC] bg-white p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] pb-3">
        <h3 className="text-sm font-semibold text-[#172033]">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          aria-label={`Edit ${title}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
        >
          <PencilLine size={13} aria-hidden="true" />Edit
        </button>
      </div>
      <dl className="mt-1 divide-y divide-[#F1F4F7]">
        {values.map(([label, value]) => (
          <div key={label} className="grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 py-2.5">
            <dt className="text-[11px] leading-4 text-[#64748B]">{label}</dt>
            <dd className="break-words text-right text-xs font-medium leading-4 text-[#172033]">{value || 'Not provided'}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function DeclarationCheckbox({
  id,
  checked,
  onChange,
  invalid,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid: boolean;
  children: string;
}) {
  return (
    <label htmlFor={id} className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border bg-white p-3.5 text-xs leading-5 text-[#334155] focus-within:ring-2 focus-within:ring-[#2563A8] ${invalid ? 'border-[#C2414B]' : 'border-[#DCE3EC]'}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-invalid={invalid}
        aria-describedby={invalid ? 'declaration-error' : undefined}
        className="peer sr-only"
      />
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? 'border-[#173F7A] bg-[#173F7A] text-white' : 'border-[#94A3B8] bg-white text-transparent'} peer-focus-visible:ring-2 peer-focus-visible:ring-[#2563A8]`} aria-hidden="true">
        <Check size={13} />
      </span>
      <span>{children}</span>
    </label>
  );
}

function academicValues(academic: AcademicInformation): [string, string][] {
  return [
    ['Academic Level', academic.academicLevel],
    ['Course', academic.course],
    ['Specialization', academic.specialization],
    ['Institution', academic.institutionName],
    ['Institution Type', academic.institutionType],
    ['University / Board', academic.universityBoard],
    ['Current Year / Semester', academic.currentYearSemester],
    ['Admission Year', academic.admissionYear],
    ['Academic Session', academic.academicSession],
    ['Previous Qualification', academic.previousQualification],
    ['Previous Result', academic.previousResult],
    ['Enrollment Number', academic.enrollmentNumber],
    ['Expected Graduation', academic.expectedGraduationYear],
  ];
}

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

