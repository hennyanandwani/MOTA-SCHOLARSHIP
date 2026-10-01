'use client';

import { Info, LockKeyhole } from 'lucide-react';
import { useStudentSettings } from '@/components/student/settings/StudentSettingsProvider';
import type {
  AcademicInformation,
  BankInformation,
  FamilyInformation,
  PersonalInformation,
} from '@/lib/applicationDraft';

export type FieldErrors = Record<string, string>;

const inputClassName = 'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#172033] outline-none placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100';
const fieldId = (section: string, field: string) => `${section}-${field}`;

export function PersonalInformationForm({
  data,
  errors,
  onChange,
}: {
  data: PersonalInformation;
  errors: FieldErrors;
  onChange: (field: keyof PersonalInformation, value: string) => void;
}) {
  return (
    <section aria-labelledby="personal-information-heading">
      <StepHeading id="personal-information-heading" title="Personal Information" description="Enter your details exactly as they appear on your official documents." />
      <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0 sm:col-span-2">
          <p className="text-xs font-medium text-[#475569]">Full Name <RequiredMark /></p>
          <div className="mt-1.5 grid min-w-0 gap-3 sm:grid-cols-3">
            <TextField section="personal" name="firstName" label="First Name" value={data.firstName} required error={errors[fieldId('personal', 'firstName')]} onChange={onChange} />
            <TextField section="personal" name="middleName" label="Middle Name" value={data.middleName} error={errors[fieldId('personal', 'middleName')]} onChange={onChange} />
            <TextField section="personal" name="lastName" label="Last Name" value={data.lastName} required error={errors[fieldId('personal', 'lastName')]} onChange={onChange} />
          </div>
        </div>

        <TextField section="personal" name="dateOfBirth" label="Date of Birth" type="date" value={data.dateOfBirth} required error={errors[fieldId('personal', 'dateOfBirth')]} onChange={onChange} />
        <SelectField section="personal" name="gender" label="Gender" value={data.gender} required options={['Male', 'Female', 'Other', 'Prefer not to say']} error={errors[fieldId('personal', 'gender')]} onChange={onChange} />
        <SelectField section="personal" name="category" label="Category" value={data.category} required options={['Scheduled Tribe']} error={errors[fieldId('personal', 'category')]} onChange={onChange} />
        <TextField section="personal" name="stCertificateNumber" label="ST Certificate Number" value={data.stCertificateNumber} sensitive required error={errors[fieldId('personal', 'stCertificateNumber')]} onChange={onChange} />
        <TextField section="personal" name="identityNumber" label="Aadhaar / Identity Number" value={data.identityNumber} placeholder="XXXX XXXX 1234" helper="Demo only. Do not enter a real identity number." sensitive inputMode="numeric" required error={errors[fieldId('personal', 'identityNumber')]} onChange={onChange} />
        <TextField section="personal" name="mobileNumber" label="Mobile Number" type="tel" inputMode="tel" value={data.mobileNumber} sensitive required error={errors[fieldId('personal', 'mobileNumber')]} onChange={onChange} />
        <TextField section="personal" name="emailAddress" label="Email Address" type="email" value={data.emailAddress} required error={errors[fieldId('personal', 'emailAddress')]} onChange={onChange} />
        <TextAreaField section="personal" name="address" label="Address" value={data.address} required error={errors[fieldId('personal', 'address')]} onChange={onChange} />
        <TextField section="personal" name="villageTown" label="Village / Town" value={data.villageTown} required error={errors[fieldId('personal', 'villageTown')]} onChange={onChange} />
        <TextField section="personal" name="district" label="District" value={data.district} required error={errors[fieldId('personal', 'district')]} onChange={onChange} />
        <TextField section="personal" name="state" label="State" value={data.state} required error={errors[fieldId('personal', 'state')]} onChange={onChange} />
        <TextField section="personal" name="pinCode" label="PIN Code" inputMode="numeric" value={data.pinCode} required error={errors[fieldId('personal', 'pinCode')]} onChange={onChange} />
      </div>
    </section>
  );
}

export function AcademicInformationForm({
  data,
  errors,
  onChange,
}: {
  data: AcademicInformation;
  errors: FieldErrors;
  onChange: (field: keyof AcademicInformation, value: string) => void;
}) {
  return (
    <section aria-labelledby="academic-information-heading">
      <StepHeading id="academic-information-heading" title="Academic Information" description="Enter details for your current course and institution." />
      <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
        <SelectField section="academic" name="academicLevel" label="Current Academic Level" value={data.academicLevel} required options={['Class 10', 'Class 11', 'Class 12', 'Diploma', 'Undergraduate', 'Postgraduate', 'PhD']} error={errors[fieldId('academic', 'academicLevel')]} onChange={onChange} />
        <TextField section="academic" name="course" label="Course / Program" value={data.course} required error={errors[fieldId('academic', 'course')]} onChange={onChange} />
        <TextField section="academic" name="specialization" label="Specialization" value={data.specialization} error={errors[fieldId('academic', 'specialization')]} onChange={onChange} />
        <TextField section="academic" name="institutionName" label="Institution Name" value={data.institutionName} required error={errors[fieldId('academic', 'institutionName')]} onChange={onChange} />
        <SelectField section="academic" name="institutionType" label="Institution Type" value={data.institutionType} required options={['Government', 'Government Aided', 'Private', 'Other']} error={errors[fieldId('academic', 'institutionType')]} onChange={onChange} />
        <TextField section="academic" name="universityBoard" label="University / Board" value={data.universityBoard} required error={errors[fieldId('academic', 'universityBoard')]} onChange={onChange} />
        <TextField section="academic" name="currentYearSemester" label="Current Year / Semester" value={data.currentYearSemester} required error={errors[fieldId('academic', 'currentYearSemester')]} onChange={onChange} />
        <TextField section="academic" name="admissionYear" label="Admission Year" inputMode="numeric" value={data.admissionYear} required error={errors[fieldId('academic', 'admissionYear')]} onChange={onChange} />
        <TextField section="academic" name="academicSession" label="Academic Session" value={data.academicSession} required error={errors[fieldId('academic', 'academicSession')]} onChange={onChange} />
        <TextField section="academic" name="previousQualification" label="Previous Qualification" value={data.previousQualification} required error={errors[fieldId('academic', 'previousQualification')]} onChange={onChange} />
        <TextField section="academic" name="previousResult" label="Previous Exam Percentage / CGPA" value={data.previousResult} required error={errors[fieldId('academic', 'previousResult')]} onChange={onChange} />
        <TextField section="academic" name="enrollmentNumber" label="Enrollment / Registration Number" value={data.enrollmentNumber} required error={errors[fieldId('academic', 'enrollmentNumber')]} onChange={onChange} />
        <TextField section="academic" name="expectedGraduationYear" label="Expected Graduation Year" inputMode="numeric" value={data.expectedGraduationYear} required error={errors[fieldId('academic', 'expectedGraduationYear')]} onChange={onChange} />
      </div>
      <InfoNote>Enter academic information exactly as recorded by your institution.</InfoNote>
    </section>
  );
}

export function FamilyBankInformationForm({
  family,
  bank,
  errors,
  onFamilyChange,
  onBankChange,
}: {
  family: FamilyInformation;
  bank: BankInformation;
  errors: FieldErrors;
  onFamilyChange: (field: keyof FamilyInformation, value: string) => void;
  onBankChange: (field: keyof BankInformation, value: string) => void;
}) {
  return (
    <section aria-labelledby="family-bank-heading">
      <StepHeading id="family-bank-heading" title="Family & Bank Information" description="Provide family details and demo bank information for this application preview." />

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-[#172033]">Family Information</h3>
        <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
          <TextField section="family" name="guardianName" label="Father / Guardian Name" value={family.guardianName} required error={errors[fieldId('family', 'guardianName')]} onChange={onFamilyChange} />
          <TextField section="family" name="motherName" label="Mother’s Name" value={family.motherName} error={errors[fieldId('family', 'motherName')]} onChange={onFamilyChange} />
          <TextField section="family" name="annualIncome" label="Family Annual Income (₹)" inputMode="numeric" value={family.annualIncome} required error={errors[fieldId('family', 'annualIncome')]} onChange={onFamilyChange} />
          <TextField section="family" name="incomeCertificateNumber" label="Income Certificate Number" value={family.incomeCertificateNumber} sensitive required error={errors[fieldId('family', 'incomeCertificateNumber')]} onChange={onFamilyChange} />
          <TextField section="family" name="guardianOccupation" label="Occupation of Parent / Guardian" value={family.guardianOccupation} error={errors[fieldId('family', 'guardianOccupation')]} onChange={onFamilyChange} />
          <TextField section="family" name="familyMembers" label="Number of Family Members" type="number" inputMode="numeric" min="1" value={family.familyMembers} required error={errors[fieldId('family', 'familyMembers')]} onChange={onFamilyChange} />
          <SelectField section="family" name="residentialStatus" label="Residential Status" value={family.residentialStatus} options={['Rural', 'Urban']} error={errors[fieldId('family', 'residentialStatus')]} onChange={onFamilyChange} />
        </div>
      </div>

      <div className="mt-7 border-t border-[#EEF1F5] pt-5">
        <h3 className="text-sm font-semibold text-[#172033]">Bank Information</h3>
        <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
          <TextField section="bank" name="accountHolderName" label="Account Holder Name" value={bank.accountHolderName} required error={errors[fieldId('bank', 'accountHolderName')]} onChange={onBankChange} />
          <TextField section="bank" name="bankName" label="Bank Name" value={bank.bankName} required error={errors[fieldId('bank', 'bankName')]} onChange={onBankChange} />
          <TextField section="bank" name="accountNumber" label="Account Number" value={bank.accountNumber} placeholder="Demo account number" sensitive inputMode="numeric" required error={errors[fieldId('bank', 'accountNumber')]} onChange={onBankChange} />
          <TextField section="bank" name="confirmAccountNumber" label="Confirm Account Number" value={bank.confirmAccountNumber} placeholder="Re-enter demo account number" sensitive inputMode="numeric" required error={errors[fieldId('bank', 'confirmAccountNumber')]} onChange={onBankChange} />
          <TextField section="bank" name="ifscCode" label="IFSC Code" value={bank.ifscCode} required error={errors[fieldId('bank', 'ifscCode')]} onChange={onBankChange} />
          <TextField section="bank" name="branchName" label="Branch Name" value={bank.branchName} required error={errors[fieldId('bank', 'branchName')]} onChange={onBankChange} />
        </div>
      </div>

      <InfoNote>Bank details are required for scholarship disbursement where applicable. All values shown are fictional demo data.</InfoNote>
    </section>
  );
}

function StepHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div>
      <h2 id={id} className="text-lg font-semibold text-[#172033]">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-[#64748B]">{description}</p>
    </div>
  );
}

function RequiredMark() {
  return <span className="text-[#C2414B]" aria-hidden="true">*</span>;
}

function TextField<T extends string>({
  section,
  name,
  label,
  value,
  onChange,
  required = false,
  error,
  type = 'text',
  placeholder,
  helper,
  sensitive = false,
  inputMode,
  min,
}: {
  section: string;
  name: T;
  label: string;
  value: string;
  onChange: (field: T, value: string) => void;
  required?: boolean;
  error?: string;
  type?: 'text' | 'email' | 'date' | 'tel' | 'number';
  placeholder?: string;
  helper?: string;
  sensitive?: boolean;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  min?: string;
}) {
  const { currentSettings } = useStudentSettings();
  const id = fieldId(section, name);
  const describedBy = [error ? `${id}-error` : '', helper ? `${id}-helper` : ''].filter(Boolean).join(' ') || undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-xs font-medium text-[#475569]">
        {label} {required && <RequiredMark />}
      </label>
      <div className="relative">
        <input
          id={id}
          type={sensitive && currentSettings.maskSensitiveInformation ? 'password' : type}
          value={value}
          onChange={(event) => onChange(name, event.target.value)}
          required={required}
          min={min}
          inputMode={inputMode}
          placeholder={placeholder}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${inputClassName} ${sensitive ? 'pr-10' : ''} ${error ? 'border-[#C2414B] focus:border-[#C2414B] focus:ring-rose-100' : ''}`}
        />
        {sensitive && <LockKeyhole size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]" aria-hidden="true" />}
      </div>
      {helper && <p id={`${id}-helper`} className="mt-1 text-[10px] leading-4 text-[#64748B]">{helper}</p>}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] font-medium text-[#A8323D]">{error}</p>}
    </div>
  );
}

function SelectField<T extends string>({
  section,
  name,
  label,
  value,
  options,
  onChange,
  required = false,
  error,
}: {
  section: string;
  name: T;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (field: T, value: string) => void;
  required?: boolean;
  error?: string;
}) {
  const id = fieldId(section, name);

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-xs font-medium text-[#475569]">
        {label} {required && <RequiredMark />}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClassName} ${error ? 'border-[#C2414B] focus:border-[#C2414B] focus:ring-rose-100' : ''}`}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] font-medium text-[#A8323D]">{error}</p>}
    </div>
  );
}

function TextAreaField<T extends string>({
  section,
  name,
  label,
  value,
  onChange,
  required = false,
  error,
}: {
  section: string;
  name: T;
  label: string;
  value: string;
  onChange: (field: T, value: string) => void;
  required?: boolean;
  error?: string;
}) {
  const id = fieldId(section, name);

  return (
    <div className="min-w-0 sm:col-span-2">
      <label htmlFor={id} className="text-xs font-medium text-[#475569]">
        {label} {required && <RequiredMark />}
      </label>
      <textarea
        id={id}
        rows={2}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`mt-1.5 w-full min-w-0 resize-y rounded-lg border border-[#DCE3EC] bg-white px-3 py-2.5 text-sm text-[#172033] outline-none focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100 ${error ? 'border-[#C2414B] focus:border-[#C2414B] focus:ring-rose-100' : ''}`}
      />
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] font-medium text-[#A8323D]">{error}</p>}
    </div>
  );
}

function InfoNote({ children }: { children: string }) {
  return (
    <p className="mt-5 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-3 text-xs leading-5 text-[#31577F]">
      <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />{children}
    </p>
  );
}