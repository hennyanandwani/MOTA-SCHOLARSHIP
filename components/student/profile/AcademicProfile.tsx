'use client';

import type { AcademicProfile as AcademicProfileData } from '@/lib/studentProfile';
import { EditableProfileSection, type ProfileField } from './EditableProfileSection';

const fields: readonly ProfileField<AcademicProfileData>[] = [
  { key: 'academicLevel', label: 'Academic Level', type: 'select', options: ['School', 'Undergraduate', 'Postgraduate', 'Research'] },
  { key: 'course', label: 'Course / Program' },
  { key: 'institutionName', label: 'Institution Name' },
  { key: 'universityOrBoard', label: 'University / Board' },
  { key: 'academicYear', label: 'Academic Year' },
  { key: 'previousQualification', label: 'Previous Qualification' },
  { key: 'percentageOrCgpa', label: 'Percentage / CGPA' },
];

export function AcademicProfile({ values, editing, onBeginEdit, onCancel, onSave }: {
  values: AcademicProfileData;
  editing: boolean;
  onBeginEdit: () => void;
  onCancel: () => void;
  onSave: (values: AcademicProfileData) => void;
}) {
  return <EditableProfileSection id="academic-profile" title="Academic Profile" values={values} fields={fields} editing={editing} onBeginEdit={onBeginEdit} onCancel={onCancel} onSave={onSave} />;
}