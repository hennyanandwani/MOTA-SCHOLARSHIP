'use client';

import { useStudentSettings } from '@/components/student/settings/StudentSettingsProvider';
import { maskSensitiveValue } from '@/lib/studentSettings';
import type { PersonalInformation as PersonalInformationData } from '@/lib/studentProfile';
import { EditableProfileSection, type ProfileField } from './EditableProfileSection';

const fields: readonly ProfileField<PersonalInformationData>[] = [
  { key: 'fullName', label: 'Full Name', autoComplete: 'name' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
  { key: 'mobileNumber', label: 'Mobile Number', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  { key: 'emailAddress', label: 'Email Address', type: 'email', autoComplete: 'email', inputMode: 'email' },
];

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(date);
}

export function PersonalInformation({ values, editing, onBeginEdit, onCancel, onSave }: {
  values: PersonalInformationData;
  editing: boolean;
  onBeginEdit: () => void;
  onCancel: () => void;
  onSave: (values: PersonalInformationData) => void;
}) {
  const { currentSettings } = useStudentSettings();
  const maskSensitiveInformation = currentSettings.maskSensitiveInformation;
  const displayFields = fields.map((field) => {
    if (field.key === 'dateOfBirth') return { ...field, displayValue: formatDate };
    if (field.key === 'mobileNumber') return {
      ...field,
      type: maskSensitiveInformation ? 'password' as const : 'tel' as const,
      displayValue: (value: string) => maskSensitiveValue(value, maskSensitiveInformation),
    };
    return field;
  });

  return <EditableProfileSection id="personal-information" title="Personal Information" values={values} fields={displayFields} editing={editing} onBeginEdit={onBeginEdit} onCancel={onCancel} onSave={onSave} successText="Profile information updated." />;
}