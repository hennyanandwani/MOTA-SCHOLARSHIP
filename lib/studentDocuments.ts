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
  fileName?: string;
  uploadedDate?: string;
  lastUpdated: string;
  status: StudentDocumentStatus;
  fileSize?: string;
  issue?: string;
  applicationValue?: string;
  extractedValue?: string;
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

export const demoStudentDocuments: StudentDocument[] = [
  {
    id: 'central-st-certificate',
    name: 'ST Certificate',
    category: 'Caste / ST Certificate',
    fileName: 'ST_Certificate_2026.pdf',
    uploadedDate: '12 Sep 2026',
    lastUpdated: '12 Sep 2026',
    status: 'Verified',
    fileSize: '2.4 MB',
  },
  {
    id: 'central-income-certificate',
    name: 'Income Certificate',
    category: 'Income',
    fileName: 'Income_Certificate_2026.pdf',
    uploadedDate: '14 Sep 2026',
    lastUpdated: '14 Sep 2026',
    status: 'Needs Attention',
    fileSize: '1.8 MB',
    issue: 'Information requires additional review.',
    applicationValue: 'Rahul Kumar',
    extractedValue: 'Rahul K. Kumar',
  },
  {
    id: 'central-identity-proof',
    name: 'Aadhaar / Identity Proof',
    category: 'Identity',
    fileName: 'Identity_Proof.pdf',
    uploadedDate: '10 Sep 2026',
    lastUpdated: '10 Sep 2026',
    status: 'Under Review',
    fileSize: '860 KB',
  },
  {
    id: 'central-marksheet',
    name: 'Previous Academic Marksheet',
    category: 'Academic',
    fileName: 'Marksheet_2025.pdf',
    uploadedDate: '11 Sep 2026',
    lastUpdated: '11 Sep 2026',
    status: 'Verified',
    fileSize: '1.2 MB',
  },
  {
    id: 'central-bonafide',
    name: 'Admission / Bonafide Certificate',
    category: 'Admission',
    fileName: 'Bonafide_2026.pdf',
    uploadedDate: '15 Sep 2026',
    lastUpdated: '15 Sep 2026',
    status: 'Verified',
    fileSize: '940 KB',
  },
  {
    id: 'central-bank-proof',
    name: 'Bank Account Proof',
    category: 'Bank',
    fileName: 'Bank_Proof.pdf',
    lastUpdated: '16 Sep 2026',
    status: 'Needs Attention',
    fileSize: '760 KB',
    issue: 'Information requires additional review.',
  },
  {
    id: 'central-photograph',
    name: 'Passport-size Photograph',
    category: 'Identity',
    fileName: 'profile_photo.jpg',
    uploadedDate: '10 Sep 2026',
    lastUpdated: '10 Sep 2026',
    status: 'Verified',
    fileSize: '420 KB',
  },
];