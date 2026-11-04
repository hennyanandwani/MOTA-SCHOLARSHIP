export type StudentDocumentStatus = 'Verified' | 'Under Review' | 'Needs Attention' | 'Not Uploaded';
export type StudentDocumentCategory =
  | 'Identity'
  | 'Caste / ST Certificate'
  | 'Income'
  | 'Academic'
  | 'Bank'
  | 'Admission'
  | 'Other';

export interface StudentDocument {
  id: string;
  name: string;
  category: StudentDocumentCategory;
  schemeName?: string;
  schemeId?: string;
  editable?: boolean;
  fileName?: string;
  uploadedDate?: string;
  lastUpdated: string;
  status: StudentDocumentStatus;
  fileSize?: string;
  issue?: string;
}

export type StudentDocumentStatusFilter = 'All' | StudentDocumentStatus;
export type StudentDocumentSort = 'Recently Updated' | 'Name' | 'Status';

export const studentDocumentCategories: StudentDocumentCategory[] = [
  'Identity',
  'Caste / ST Certificate',
  'Income',
  'Academic',
  'Bank',
  'Admission',
  'Other',
];
