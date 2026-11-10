'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, Eye, EyeOff, LoaderCircle, UserRound } from 'lucide-react';
import { ProfileHeader } from './ProfileHeader';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

type ProfileField =
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'dateOfBirth'
  | 'gender'
  | 'category'
  | 'subCaste'
  | 'stCertificateNumber'
  | 'mobileNumber'
  | 'address'
  | 'villageTown'
  | 'district'
  | 'state'
  | 'pinCode'
  | 'academicLevel'
  | 'courseName'
  | 'specialization'
  | 'instituteName'
  | 'institutionType'
  | 'universityBoard'
  | 'currentYearSemester'
  | 'admissionYear'
  | 'academicSession'
  | 'previousQualification'
  | 'previousResult'
  | 'enrollmentNumber'
  | 'expectedGraduationYear'
  | 'guardianName'
  | 'motherName'
  | 'familyAnnualIncome'
  | 'incomeCertificateNumber'
  | 'guardianOccupation'
  | 'familyMembers'
  | 'residentialStatus'
  | 'accountHolderName'
  | 'bankName'
  | 'accountNumber'
  | 'ifscCode'
  | 'branchName';

type ProfileFields = Record<ProfileField, string>;
type SectionId = 'personal' | 'contact' | 'academic' | 'family' | 'bank';
type TimestampField =
  | 'personalInfoUpdatedAt'
  | 'contactInfoUpdatedAt'
  | 'academicInfoUpdatedAt'
  | 'familyInfoUpdatedAt'
  | 'bankInfoUpdatedAt';

type StudentProfile = ProfileFields & {
  id: string;
  email: string;
  fullName: string;
  studentId: string;
  rollNumber: string;
  autoFillEnabled: boolean;
  personalInfoUpdatedAt: string | null;
  contactInfoUpdatedAt: string | null;
  academicInfoUpdatedAt: string | null;
  familyInfoUpdatedAt: string | null;
  bankInfoUpdatedAt: string | null;
};

type ProfileSection = {
  id: SectionId;
  title: string;
  description: string;
  timestamp: TimestampField;
  fields: readonly FieldDefinition[];
};

type FieldDefinition = {
  key: ProfileField;
  label: string;
  type?: 'text' | 'tel' | 'date' | 'number' | 'select' | 'textarea' | 'bankAccount';
  options?: readonly string[];
  inputMode?: 'numeric' | 'tel' | 'decimal' | 'text';
  autoComplete?: string;
  min?: string;
  max?: string;
  step?: string;
};

const fieldKeys: readonly ProfileField[] = [
  'firstName',
  'middleName',
  'lastName',
  'dateOfBirth',
  'gender',
  'category',
  'subCaste',
  'stCertificateNumber',
  'mobileNumber',
  'address',
  'villageTown',
  'district',
  'state',
  'pinCode',
  'academicLevel',
  'courseName',
  'specialization',
  'instituteName',
  'institutionType',
  'universityBoard',
  'currentYearSemester',
  'admissionYear',
  'academicSession',
  'previousQualification',
  'previousResult',
  'enrollmentNumber',
  'expectedGraduationYear',
  'guardianName',
  'motherName',
  'familyAnnualIncome',
  'incomeCertificateNumber',
  'guardianOccupation',
  'familyMembers',
  'residentialStatus',
  'accountHolderName',
  'bankName',
  'accountNumber',
  'ifscCode',
  'branchName',
];

const sections: readonly ProfileSection[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Keep your personal details current. Leave fields blank if they do not apply.',
    timestamp: 'personalInfoUpdatedAt',
    fields: [
      { key: 'firstName', label: 'First Name', autoComplete: 'given-name' },
      { key: 'middleName', label: 'Middle Name', autoComplete: 'additional-name' },
      { key: 'lastName', label: 'Last Name', autoComplete: 'family-name' },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      {
        key: 'gender',
        label: 'Gender',
        type: 'select',
        options: ['Male', 'Female', 'Other', 'Prefer not to say'],
      },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: ['Scheduled Tribe'],
      },
      { key: 'subCaste', label: 'Sub-caste' },
      { key: 'stCertificateNumber', label: 'ST Certificate Number' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact & Address',
    description: 'Your account email is read-only and comes from your account.',
    timestamp: 'contactInfoUpdatedAt',
    fields: [
      { key: 'mobileNumber', label: 'Mobile Number', type: 'tel', inputMode: 'tel', autoComplete: 'tel' },
      { key: 'address', label: 'Address', type: 'textarea', autoComplete: 'street-address' },
      { key: 'villageTown', label: 'Village/Town', autoComplete: 'address-level2' },
      { key: 'district', label: 'District' },
      { key: 'state', label: 'State', autoComplete: 'address-level1' },
      { key: 'pinCode', label: 'PIN Code', inputMode: 'numeric', autoComplete: 'postal-code' },
    ],
  },
  {
    id: 'academic',
    title: 'Academic Information',
    description: 'Record your current education and institution details.',
    timestamp: 'academicInfoUpdatedAt',
    fields: [
      {
        key: 'academicLevel',
        label: 'Academic Level',
        type: 'select',
        options: ['Class 10', 'Class 11', 'Class 12', 'Diploma', 'Undergraduate', 'Postgraduate', 'PhD'],
      },
      { key: 'courseName', label: 'Course' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'instituteName', label: 'Institution Name', autoComplete: 'organization' },
      {
        key: 'institutionType',
        label: 'Institution Type',
        type: 'select',
        options: ['Government', 'Government Aided', 'Private', 'Other'],
      },
      { key: 'universityBoard', label: 'University/Board' },
      { key: 'currentYearSemester', label: 'Current Year/Semester' },
      { key: 'admissionYear', label: 'Admission Year', type: 'number', inputMode: 'numeric', min: '1950', step: '1' },
      { key: 'academicSession', label: 'Academic Session' },
      { key: 'previousQualification', label: 'Previous Qualification' },
      { key: 'previousResult', label: 'Previous Result' },
      { key: 'enrollmentNumber', label: 'Enrollment Number' },
      { key: 'expectedGraduationYear', label: 'Expected Graduation Year', type: 'number', inputMode: 'numeric', min: '1950', step: '1' },
    ],
  },
  {
    id: 'family',
    title: 'Family & Income',
    description: 'Family and income details are optional profile information.',
    timestamp: 'familyInfoUpdatedAt',
    fields: [
      { key: 'guardianName', label: 'Guardian Name' },
      { key: 'motherName', label: "Mother's Name" },
      { key: 'familyAnnualIncome', label: 'Family Annual Income', type: 'number', inputMode: 'decimal', min: '0', step: '0.01' },
      { key: 'incomeCertificateNumber', label: 'Income Certificate Number' },
      { key: 'guardianOccupation', label: 'Guardian Occupation' },
      { key: 'familyMembers', label: 'Number of Family Members', type: 'number', inputMode: 'numeric', min: '1', step: '1' },
      { key: 'residentialStatus', label: 'Residential Status' },
    ],
  },
  {
    id: 'bank',
    title: 'Bank Details',
    description: 'Bank details are saved in your profile and are not shared with application records.',
    timestamp: 'bankInfoUpdatedAt',
    fields: [
      { key: 'accountHolderName', label: 'Account Holder Name' },
      { key: 'bankName', label: 'Bank Name' },
      { key: 'accountNumber', label: 'Account Number', type: 'bankAccount', inputMode: 'numeric' },
      { key: 'ifscCode', label: 'IFSC Code' },
      { key: 'branchName', label: 'Branch Name' },
    ],
  },
];

const inputClassName =
  'mt-1.5 h-11 w-full min-w-0 rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function inputValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function profileFromResponse(payload: unknown): StudentProfile {
  if (!isRecord(payload) || !isRecord(payload.profile)) {
    throw new Error('The server returned an invalid profile response.');
  }
  const source = payload.profile;
  if (
    typeof source.id !== 'string' ||
    typeof source.email !== 'string' ||
    typeof source.fullName !== 'string' ||
    typeof source.studentId !== 'string' ||
    typeof source.rollNumber !== 'string' ||
    typeof source.autoFillEnabled !== 'boolean'
  ) {
    throw new Error('The server returned an invalid profile response.');
  }

  const profileFields = Object.fromEntries(
    fieldKeys.map((key) => [key, inputValue(source[key])]),
  ) as ProfileFields;
  const timestamp = (key: TimestampField) =>
    typeof source[key] === 'string' ? source[key] : null;

  return {
    ...profileFields,
    id: source.id,
    email: source.email,
    fullName: source.fullName,
    studentId: source.studentId,
    rollNumber: source.rollNumber,
    autoFillEnabled: source.autoFillEnabled,
    personalInfoUpdatedAt: timestamp('personalInfoUpdatedAt'),
    contactInfoUpdatedAt: timestamp('contactInfoUpdatedAt'),
    academicInfoUpdatedAt: timestamp('academicInfoUpdatedAt'),
    familyInfoUpdatedAt: timestamp('familyInfoUpdatedAt'),
    bankInfoUpdatedAt: timestamp('bankInfoUpdatedAt'),
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload) && typeof payload.error === 'string') {
    const validationErrors = isRecord(payload.validationErrors)
      ? Object.values(payload.validationErrors).filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    return [payload.error, ...validationErrors].join(' ');
  }
  return fallback;
}

function getSectionValues(profile: ProfileFields, section: ProfileSection) {
  return Object.fromEntries(
    section.fields.map(({ key }) => [key, profile[key]]),
  ) as Partial<ProfileFields>;
}

function populatedFieldCount(profile: ProfileFields): number {
  return fieldKeys.filter((key) => profile[key].trim() !== '').length;
}

function formatUpdatedAt(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });
}

export function ProfilePageClient() {
  const t = useStudentTranslation();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [draft, setDraft] = useState<ProfileFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<SectionId | null>(null);
  const [savingAutoFill, setSavingAutoFill] = useState(false);
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<SectionId, string>>>({});
  const [sectionSaved, setSectionSaved] = useState<Partial<Record<SectionId, boolean>>>({});
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  const [autoFillSaved, setAutoFillSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/student/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await readJson(response);
        if (!response.ok) {
          throw new Error(errorMessage(payload, 'Unable to load your profile.'));
        }
        const nextProfile = profileFromResponse(payload);
        setProfile(nextProfile);
        setDraft(getSectionValues(nextProfile, {
          id: 'personal',
          title: '',
          description: '',
          timestamp: 'personalInfoUpdatedAt',
          fields: sections.flatMap((section) => section.fields),
        }) as ProfileFields);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setLoadError(
          cause instanceof Error ? cause.message : 'Unable to load your profile.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  function updateField(key: ProfileField, value: string, sectionId: SectionId) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setSectionErrors((current) => ({ ...current, [sectionId]: undefined }));
    setSectionSaved((current) => ({ ...current, [sectionId]: false }));
  }

  async function saveSection(event: FormEvent<HTMLFormElement>, section: ProfileSection) {
    event.preventDefault();
    if (!draft || savingSection || savingAutoFill) return;

    setSavingSection(section.id);
    setSectionErrors((current) => ({ ...current, [section.id]: undefined }));
    setSectionSaved((current) => ({ ...current, [section.id]: false }));
    try {
      const updates = Object.fromEntries(
        section.fields.map(({ key }) => [key, draft[key]]),
      );
      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(errorMessage(payload, 'Unable to save this section.'));
      }
      const nextProfile = profileFromResponse(payload);
      setProfile(nextProfile);
      setDraft((current) =>
        current ? { ...current, ...getSectionValues(nextProfile, section) } : current,
      );
      setSectionSaved((current) => ({ ...current, [section.id]: true }));
    } catch (cause) {
      setSectionErrors((current) => ({
        ...current,
        [section.id]:
          cause instanceof Error ? cause.message : 'Unable to save this section.',
      }));
    } finally {
      setSavingSection(null);
    }
  }

  async function saveAutoFillPreference(enabled: boolean) {
    if (!profile || savingSection || savingAutoFill || profile.autoFillEnabled === enabled) return;

    setSavingAutoFill(true);
    setAutoFillError(null);
    setAutoFillSaved(false);
    try {
      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoFillEnabled: enabled }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(errorMessage(payload, 'Unable to save your Auto Fill preference.'));
      }
      const nextProfile = profileFromResponse(payload);
      if (nextProfile.autoFillEnabled !== enabled) {
        throw new Error('The server did not save your Auto Fill preference.');
      }
      setProfile(nextProfile);
      setAutoFillSaved(true);
    } catch (cause) {
      setAutoFillError(
        cause instanceof Error
          ? cause.message
          : 'Unable to save your Auto Fill preference.',
      );
    } finally {
      setSavingAutoFill(false);
    }
  }

  const completion = profile
    ? Math.round((populatedFieldCount(profile) / fieldKeys.length) * 100)
    : null;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <ProfileHeader />

      {loading ? (
        <p role="status" className="rounded-xl border border-[#DCE3EC] bg-white p-5 text-sm text-[#64748B]">
          {t('Loading your profile...')}
        </p>
      ) : loadError && !profile ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {t(loadError)}
        </p>
      ) : profile && draft && completion !== null ? (
        <>
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563A8]">
                <UserRound size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="break-words text-base font-bold text-[#172033]">
                  {profile.fullName}
                </h2>
                <p className="mt-1 break-all text-xs text-[#64748B]">
                  {t('Student ID')}: {profile.rollNumber}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-[#EEF1F5] pt-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-[#334155]">{t('Profile completion')}</span>
                <span className="font-semibold text-[#173F7A]">{completion}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={t('Profile completion')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
                className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8EEF5]"
              >
                <div
                  className="h-full rounded-full bg-[#2563A8] transition-[width]"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-5 text-[#64748B]">
                {t('This is optional profile information. Completion does not affect scholarship applications.')}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <h2 id="auto-fill-heading" className="text-sm font-semibold text-[#172033]">
                  {t('Auto Fill')}
                </h2>
                <p className="mt-1 text-xs leading-5 text-[#64748B]">
                  {t('Automatically fill matching information in new scholarship applications using your saved profile.')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#334155]">
                  {profile.autoFillEnabled ? t('ON') : t('OFF')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-label={t('Auto Fill')}
                  aria-checked={profile.autoFillEnabled}
                  disabled={savingSection !== null || savingAutoFill}
                  onClick={() => void saveAutoFillPreference(!profile.autoFillEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition disabled:cursor-wait disabled:opacity-60 ${profile.autoFillEnabled ? 'bg-[#16805B]' : 'bg-slate-300'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${profile.autoFillEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
            {savingAutoFill && (
              <p role="status" className="mt-3 flex items-center gap-2 text-xs text-[#64748B]">
                <LoaderCircle size={13} className="animate-spin" aria-hidden="true" />
                {t('Saving Auto Fill preference...')}
              </p>
            )}
            {autoFillError && (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {t(autoFillError)}
              </p>
            )}
            {autoFillSaved && (
              <p role="status" className="mt-3 text-xs font-medium text-[#166534]">
                {t('Auto Fill preference saved.')}
              </p>
            )}
          </section>

          {sections.map((section) => (
            <ProfileSectionForm
              key={section.id}
              section={section}
              profile={profile}
              draft={draft}
              disabled={savingSection !== null || savingAutoFill}
              saving={savingSection === section.id}
              error={sectionErrors[section.id] ?? null}
              saved={sectionSaved[section.id] ?? false}
              showAccountNumber={showAccountNumber}
              onToggleAccountNumber={() => setShowAccountNumber((shown) => !shown)}
              onChange={(key, value) => updateField(key, value, section.id)}
              onSubmit={(event) => void saveSection(event, section)}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}

function ProfileSectionForm({
  section,
  profile,
  draft,
  disabled,
  saving,
  error,
  saved,
  showAccountNumber,
  onToggleAccountNumber,
  onChange,
  onSubmit,
}: {
  section: ProfileSection;
  profile: StudentProfile;
  draft: ProfileFields;
  disabled: boolean;
  saving: boolean;
  error: string | null;
  saved: boolean;
  showAccountNumber: boolean;
  onToggleAccountNumber: () => void;
  onChange: (key: ProfileField, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const t = useStudentTranslation();
  const updatedAt = formatUpdatedAt(
    profile[section.timestamp],
    'en',
  );

  return (
    <section
      id={`profile-${section.id}`}
      aria-labelledby={`profile-${section.id}-heading`}
      className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF1F5] pb-4">
        <div>
          <h2 id={`profile-${section.id}-heading`} className="text-sm font-semibold text-[#172033]">
            {t(section.title)}
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">{t(section.description)}</p>
        </div>
        {updatedAt && (
          <p className="text-[11px] text-[#64748B]">
            {t('Last updated')}: <time dateTime={profile[section.timestamp] ?? undefined}>{updatedAt}</time>
          </p>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          {section.id === 'contact' && (
            <label className="block min-w-0 text-xs font-medium text-[#475569]">
              {t('Account Email')}
              <input
                type="email"
                value={profile.email}
                readOnly
                autoComplete="email"
                className={`${inputClassName} bg-slate-50`}
              />
            </label>
          )}
          {section.fields.map((field) => (
            <ProfileFieldInput
              key={field.key}
              field={field}
              value={draft[field.key]}
              disabled={disabled}
              showAccountNumber={showAccountNumber}
              onToggleAccountNumber={onToggleAccountNumber}
              onChange={(value) => onChange(field.key, value)}
              t={t}
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {t(error)}
          </p>
        )}
        {saved && (
          <p role="status" aria-live="polite" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-[#166534]">
            {t('Changes saved.')}
          </p>
        )}
        <div className="mt-5 flex justify-end border-t border-[#EEF1F5] pt-4">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white hover:bg-[#123365] disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Check size={14} aria-hidden="true" />
            )}
            {t(saving ? 'Saving...' : 'Save section')}
          </button>
        </div>
      </form>
    </section>
  );
}

function ProfileFieldInput({
  field,
  value,
  disabled,
  showAccountNumber,
  onToggleAccountNumber,
  onChange,
  t,
}: {
  field: FieldDefinition;
  value: string;
  disabled: boolean;
  showAccountNumber: boolean;
  onToggleAccountNumber: () => void;
  onChange: (value: string) => void;
  t: (text: string) => string;
}) {
  const id = `profile-field-${field.key}`;
  const isAccountNumber = field.type === 'bankAccount';
  const type = isAccountNumber
    ? showAccountNumber ? 'text' : 'password'
    : field.type === 'number' || field.type === 'date' || field.type === 'tel'
      ? field.type
      : 'text';
  const commonProps = {
    id,
    value,
    disabled,
    autoComplete: isAccountNumber ? 'off' : field.autoComplete,
    inputMode: field.inputMode,
    min: field.min,
    max: field.max,
    step: field.step,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(event.target.value),
    className: inputClassName,
  };

  return (
    <div className="block min-w-0 text-xs font-medium text-[#475569]">
      <label htmlFor={id}>{t(field.label)}</label>
      {field.type === 'select' ? (
        <select {...commonProps}>
          <option value="">{t('Select an option')}</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>{t(option)}</option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          {...commonProps}
          rows={3}
          className={`${inputClassName} h-auto min-h-24 py-3`}
        />
      ) : (
        <div className="relative">
          <input {...commonProps} type={type} />
          {isAccountNumber && (
            <button
              type="button"
              onClick={onToggleAccountNumber}
              aria-label={t(showAccountNumber ? 'Hide account number' : 'Show account number')}
              aria-pressed={showAccountNumber}
              className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-[#2563A8] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563A8]"
            >
              {showAccountNumber ? (
                <EyeOff size={14} aria-hidden="true" />
              ) : (
                <Eye size={14} aria-hidden="true" />
              )}
              {t(showAccountNumber ? 'Hide' : 'Show')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
