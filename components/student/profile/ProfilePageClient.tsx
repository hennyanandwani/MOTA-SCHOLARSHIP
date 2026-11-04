'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, LoaderCircle, UserRound } from 'lucide-react';
import { ProfileHeader } from './ProfileHeader';
import { useStudentTranslation } from '@/components/student/settings/StudentSettingsProvider';

type StudentProfile = {
  id: string;
  email: string;
  fullName: string;
  studentId: string;
  rollNumber: string;
  subCaste: string | null;
  annualIncome: string;
  academicPercentage: string;
  courseName: string;
  instituteName: string;
};

type EditableProfile = Pick<
  StudentProfile,
  | 'fullName'
  | 'subCaste'
  | 'annualIncome'
  | 'academicPercentage'
  | 'courseName'
  | 'instituteName'
>;

const inputClassName =
  'mt-1.5 h-11 w-full rounded-lg border border-[#DCE3EC] bg-white px-3 text-sm text-[#172033] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563A8] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50';

function editableValues(profile: StudentProfile): EditableProfile {
  return {
    fullName: profile.fullName,
    subCaste: profile.subCaste ?? '',
    annualIncome: profile.annualIncome,
    academicPercentage: profile.academicPercentage,
    courseName: profile.courseName,
    instituteName: profile.instituteName,
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
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    const validationErrors =
      'validationErrors' in payload &&
      typeof payload.validationErrors === 'object' &&
      payload.validationErrors !== null
        ? Object.values(payload.validationErrors).filter(
            (value): value is string => typeof value === 'string',
          )
        : [];
    return [payload.error, ...validationErrors].join(' ');
  }
  return fallback;
}

export function ProfilePageClient() {
  const t = useStudentTranslation();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [draft, setDraft] = useState<EditableProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
        if (
          typeof payload !== 'object' ||
          payload === null ||
          !('profile' in payload) ||
          typeof payload.profile !== 'object' ||
          payload.profile === null
        ) {
          throw new Error('The server returned an invalid profile response.');
        }
        const nextProfile = payload.profile as StudentProfile;
        setProfile(nextProfile);
        setDraft(editableValues(nextProfile));
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError(
          cause instanceof Error ? cause.message : 'Unable to load your profile.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  function updateField<Key extends keyof EditableProfile>(
    key: Key,
    value: EditableProfile[Key],
  ) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setSaved(false);
    setError(null);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;

    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(errorMessage(payload, 'Unable to save your profile.'));
      }
      if (
        typeof payload !== 'object' ||
        payload === null ||
        !('profile' in payload) ||
        typeof payload.profile !== 'object' ||
        payload.profile === null
      ) {
        throw new Error('The server returned an invalid profile response.');
      }
      const nextProfile = payload.profile as StudentProfile;
      setProfile(nextProfile);
      setDraft(editableValues(nextProfile));
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to save your profile.',
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelChanges() {
    if (!profile) return;
    setDraft(editableValues(profile));
    setError(null);
    setSaved(false);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <ProfileHeader />

      {loading ? (
        <p role="status" className="rounded-xl border border-[#DCE3EC] bg-white p-5 text-sm text-[#64748B]">
          {t('Loading your profile...')}
        </p>
      ) : error && !profile ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {t(error)}
        </p>
      ) : profile && draft ? (
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
                  {profile.email}
                </p>
              </div>
            </div>
            <dl className="mt-4 grid gap-4 border-t border-[#EEF1F5] pt-4 sm:grid-cols-2">
              <ReadOnlyField label="Student ID" value={profile.rollNumber} t={t} />
              <ReadOnlyField label="Account email" value={profile.email} t={t} />
            </dl>
          </section>

          <form
            onSubmit={saveProfile}
            className="rounded-xl border border-[#DCE3EC] bg-white p-4 shadow-[0_1px_3px_rgba(23,32,51,0.04)] sm:p-5"
          >
            <div className="border-b border-[#EEF1F5] pb-4">
              <h2 className="text-sm font-semibold text-[#172033]">
                {t('Profile information')}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">
                {t('Update the information stored in your student profile. Application-specific answers are managed separately in each application.')}
              </p>
            </div>

            <div className="mt-4 grid gap-x-4 gap-y-4 sm:grid-cols-2">
              <ProfileInput
                label="Full name"
                value={draft.fullName}
                autoComplete="name"
                disabled={saving}
                onChange={(value) => updateField('fullName', value)}
                t={t}
              />
              <ProfileInput
                label="Sub-caste"
                value={draft.subCaste ?? ''}
                disabled={saving}
                onChange={(value) => updateField('subCaste', value)}
                t={t}
              />
              <ProfileInput
                label="Annual income"
                value={draft.annualIncome}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                disabled={saving}
                onChange={(value) => updateField('annualIncome', value)}
                t={t}
              />
              <ProfileInput
                label="Academic percentage"
                value={draft.academicPercentage}
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                disabled={saving}
                onChange={(value) => updateField('academicPercentage', value)}
                t={t}
              />
              <ProfileInput
                label="Course"
                value={draft.courseName ?? ''}
                disabled={saving}
                onChange={(value) => updateField('courseName', value)}
                t={t}
              />
              <ProfileInput
                label="Institution"
                value={draft.instituteName ?? ''}
                disabled={saving}
                onChange={(value) => updateField('instituteName', value)}
                t={t}
              />
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {t(error)}
              </p>
            )}
            {saved && (
              <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-[#166534]">
                {t('Profile changes saved.')}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#EEF1F5] pt-4">
              <button
                type="button"
                onClick={cancelChanges}
                disabled={saving}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#B8C9DC] px-4 text-xs font-semibold text-[#334155] hover:bg-slate-50 disabled:opacity-60"
              >
                {t('Reset')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#173F7A] px-4 text-xs font-semibold text-white hover:bg-[#123365] disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Check size={14} aria-hidden="true" />
                )}
                {t(saving ? 'Saving...' : 'Save profile')}
              </button>
            </div>
          </form>
        </>
      ) : null}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  t,
}: {
  label: string;
  value: string;
  t: (text: string) => string;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-[#64748B]">{t(label)}</dt>
      <dd className="mt-1 break-words text-xs font-semibold text-[#334155]">{value}</dd>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  type = 'text',
  autoComplete,
  inputMode,
  min,
  max,
  step,
  disabled,
  onChange,
  t,
}: {
  label: string;
  value: string;
  type?: 'text' | 'number';
  autoComplete?: string;
  inputMode?: 'decimal';
  min?: string;
  max?: string;
  step?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  t: (text: string) => string;
}) {
  return (
    <label className="block text-xs font-medium text-[#475569]">
      {t(label)}
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </label>
  );
}
