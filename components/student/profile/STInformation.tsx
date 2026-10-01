'use client';

import type { CommunityInformation } from '@/lib/studentProfile';
import { useStudentSettings } from '@/components/student/settings/StudentSettingsProvider';
import { maskSensitiveValue } from '@/lib/studentSettings';
import { EditableProfileSection, type ProfileField } from './EditableProfileSection';

export function STInformation({ values, editing, onBeginEdit, onCancel, onSave }: {
  values: CommunityInformation;
  editing: boolean;
  onBeginEdit: () => void;
  onCancel: () => void;
  onSave: (values: CommunityInformation) => void;
}) {
  const { currentSettings } = useStudentSettings();
  const maskSensitiveInformation = currentSettings.maskSensitiveInformation;
  const fields: readonly ProfileField<CommunityInformation>[] = [
    { key: 'certificateStatus', label: 'ST Certificate Status', type: 'select', options: ['Verified', 'Provided', 'Pending review', 'Not provided'] },
    { key: 'certificateNumber', label: 'Certificate Number (demo)', type: maskSensitiveInformation ? 'password' : 'text', displayValue: (value) => maskSensitiveValue(value, maskSensitiveInformation) },
    { key: 'issuingAuthority', label: 'Certificate Issuing Authority' },
    { key: 'fpoMembership', label: 'FPO Membership', type: 'select', options: ['No membership added', 'Member'] },
    { key: 'fpoName', label: 'FPO Name' },
  ];

  return <EditableProfileSection id="community-information" title="Community & Scheme Information" values={values} fields={fields} editing={editing} onBeginEdit={onBeginEdit} onCancel={onCancel} onSave={onSave} />;
}