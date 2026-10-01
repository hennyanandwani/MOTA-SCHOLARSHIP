'use client';

import type { ContactInformation as ContactInformationData } from '@/lib/studentProfile';
import { EditableProfileSection, type ProfileField } from './EditableProfileSection';

const fields: readonly ProfileField<ContactInformationData>[] = [
  { key: 'address', label: 'Address', autoComplete: 'street-address' },
  { key: 'villageOrTown', label: 'Village / Town', autoComplete: 'address-level2' },
  { key: 'district', label: 'District' },
  { key: 'state', label: 'State', autoComplete: 'address-level1' },
  { key: 'pinCode', label: 'PIN Code', inputMode: 'numeric', autoComplete: 'postal-code' },
];

export function ContactInformation({ values, editing, onBeginEdit, onCancel, onSave }: {
  values: ContactInformationData;
  editing: boolean;
  onBeginEdit: () => void;
  onCancel: () => void;
  onSave: (values: ContactInformationData) => void;
}) {
  return <EditableProfileSection id="contact-information" title="Contact & Location" values={values} fields={fields} editing={editing} onBeginEdit={onBeginEdit} onCancel={onCancel} onSave={onSave} />;
}