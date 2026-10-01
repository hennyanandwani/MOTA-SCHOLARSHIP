'use client';

import { useStudentSettings } from '@/components/student/settings/StudentSettingsProvider';
import type { BankInformation as BankInformationData } from '@/lib/studentProfile';
import { maskSensitiveValue } from '@/lib/studentSettings';
import { EditableProfileSection, type ProfileField } from './EditableProfileSection';

export function BankInformation({ values, editing, onBeginEdit, onCancel, onSave }: {
  values: BankInformationData;
  editing: boolean;
  onBeginEdit: () => void;
  onCancel: () => void;
  onSave: (values: BankInformationData) => void;
}) {
  const { currentSettings } = useStudentSettings();
  const maskSensitiveInformation = currentSettings.maskSensitiveInformation;
  const fields: readonly ProfileField<BankInformationData>[] = [
    { key: 'bankName', label: 'Bank Name' },
    { key: 'accountHolderName', label: 'Account Holder Name' },
    { key: 'accountNumber', label: 'Account Number', type: maskSensitiveInformation ? 'password' : 'text', displayValue: (value) => maskSensitiveValue(value, maskSensitiveInformation) },
    { key: 'ifscCode', label: 'IFSC Code' },
    { key: 'verificationStatus', label: 'Account Verification Status' },
  ];

  return (
    <div className="min-w-0 space-y-2">
      <EditableProfileSection id="bank-information" title="Bank Information" values={values} fields={fields} editing={editing} onBeginEdit={onBeginEdit} onCancel={onCancel} onSave={onSave} statusLabel="Demo information" />
      <p className="px-1 text-[10px] leading-4 text-[#64748B]">Bank information is used only where required for applicable scholarship or fellowship processing.</p>
    </div>
  );
}