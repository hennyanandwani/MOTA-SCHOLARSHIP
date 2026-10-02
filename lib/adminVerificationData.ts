export type VerificationPriority = 'High' | 'Medium' | 'Low';
export type OCRStatus = 'Extracted' | 'Processing' | 'Extraction Failed';
export type AIMatchStatus = 'Match' | 'Partial Match' | 'Mismatch' | 'Unable to Compare';
export type VerificationStatus = 'Pending' | 'Under Review' | 'Verified' | 'Rejected';

export type ExtractedField = {
  key: string;
  label: string;
  value: string;
  confidence: number;
};

export type CrossCheckField = {
  key: string;
  label: string;
  applicationValue: string;
  documentValue: string;
  status: 'Match' | 'Mismatch' | 'Unable to Compare';
  explanation?: string;
};

export type VerificationFlag = {
  id: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  relatedField: string;
};

export type SourceCheckInfo = {
  sourceName: string;
  status: 'Not Connected' | 'Demo Match' | 'Demo Mismatch' | 'Demo Verified';
  referenceId: string;
  verifiedAt?: string;
};

export type ActivityEntry = {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  note?: string;
  type?: 'system' | 'ai' | 'reviewer' | 'flag';
};

export type VerificationRecord = {
  id: string;
  applicationId: string;
  applicantName: string;
  schemeId: string;
  schemeName: string;
  documentName: string;
  documentType: string;
  state: string;
  district: string;
  uploadedAt: string;
  fileName: string;
  fileSize: string;
  priority: VerificationPriority;
  ocrStatus: OCRStatus;
  aiMatch: AIMatchStatus;
  verificationStatus: VerificationStatus;
  reviewer: string;
  reviewerDecision?: 'Verify Document' | 'Mark for Review' | 'Reject Document';
  reviewerNote?: string;
  rejectionReason?: string;
  decisionDate?: string;
  extractedFields: ExtractedField[];
  crossCheckFields: CrossCheckField[];
  flags: VerificationFlag[];
  aiSuggestedReview?: string;
  sourceCheck: SourceCheckInfo;
  activities: ActivityEntry[];
};

export const INITIAL_VERIFICATION_RECORDS: VerificationRecord[] = [
  {
    id: 'VER-2026-001',
    applicationId: 'MOTA-2026-7842',
    applicantName: 'Rahul Bhil',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    documentName: 'Scheduled Tribe Community Certificate',
    documentType: 'ST Category Certificate',
    state: 'Madhya Pradesh',
    district: 'Jhabua',
    uploadedAt: '2026-09-15 10:20 AM',
    fileName: 'st_certificate_rahul.pdf',
    fileSize: '1.8 MB',
    priority: 'High',
    ocrStatus: 'Extracted',
    aiMatch: 'Mismatch',
    verificationStatus: 'Under Review',
    reviewer: 'MoTA Administrator',
    extractedFields: [
      { key: 'name', label: 'Applicant Name', value: 'Rahul Bhil', confidence: 98 },
      { key: 'certNumber', label: 'Certificate Number', value: 'MP-ST-2024-00128', confidence: 94 }
    ],
    crossCheckFields: [
      { key: 'name', label: 'Applicant Name', applicationValue: 'Rahul Bhil', documentValue: 'Rahul Bhil', status: 'Match' },
      { key: 'certNumber', label: 'Certificate Number', applicationValue: 'MP-ST-2024-00123', documentValue: 'MP-ST-2024-00128', status: 'Mismatch', explanation: 'Certificate number mismatch.' }
    ],
    flags: [{ id: 'F1', severity: 'High', description: 'Certificate number mismatch.', relatedField: 'Certificate Number' }],
    aiSuggestedReview: 'Certificate number requires manual review.',
    sourceCheck: { sourceName: 'e-Pramaan', status: 'Demo Mismatch', referenceId: 'DL-9941' },
    activities: [{ id: 'A1', timestamp: '10:20 AM', action: 'Document uploaded', actor: 'System', type: 'system' }],
  },
  {
    id: 'VER-2026-002',
    applicationId: 'MOTA-2026-3190',
    applicantName: 'Sunita Marandi',
    schemeId: 'national-fellowship-st',
    schemeName: 'National Fellowship for ST Students',
    documentName: 'Master Degree Final Marksheet',
    documentType: 'Previous Marksheet',
    state: 'Jharkhand',
    district: 'Ranchi',
    uploadedAt: '2026-09-14 04:15 PM',
    fileName: 'sunita_marksheet.pdf',
    fileSize: '2.4 MB',
    priority: 'Medium',
    ocrStatus: 'Extracted',
    aiMatch: 'Match',
    verificationStatus: 'Pending',
    reviewer: 'Unassigned',
    extractedFields: [{ key: 'name', label: 'Candidate Name', value: 'Sunita Marandi', confidence: 99 }],
    crossCheckFields: [{ key: 'name', label: 'Candidate Name', applicationValue: 'Sunita Marandi', documentValue: 'Sunita Marandi', status: 'Match' }],
    flags: [],
    aiSuggestedReview: 'All fields match application data.',
    sourceCheck: { sourceName: 'NTA/NAD', status: 'Not Connected', referenceId: 'NAD-918' },
    activities: [{ id: 'A1', timestamp: '04:15 PM', action: 'Document uploaded', actor: 'System', type: 'system' }],
  },
  {
    id: 'VER-2026-003',
    applicationId: 'MOTA-2026-1104',
    applicantName: 'Amit Kerketta',
    schemeId: 'top-class-st',
    schemeName: 'Top Class Education for ST Students',
    documentName: 'Income Certificate',
    documentType: 'Income Certificate',
    state: 'Odisha',
    district: 'Sundargarh',
    uploadedAt: '2026-09-13 11:30 AM',
    fileName: 'income_cert_amit.pdf',
    fileSize: '1.2 MB',
    priority: 'High',
    ocrStatus: 'Extracted',
    aiMatch: 'Partial Match',
    verificationStatus: 'Under Review',
    reviewer: 'MoTA Administrator',
    extractedFields: [
      { key: 'name', label: 'Applicant Name', value: 'Amit Kerketta', confidence: 97 },
      { key: 'annualIncome', label: 'Annual Income', value: 'Rs. 2,40,000', confidence: 92 }
    ],
    crossCheckFields: [
      { key: 'name', label: 'Applicant Name', applicationValue: 'Amit Kerketta', documentValue: 'Amit Kerketta', status: 'Match' },
      { key: 'income', label: 'Annual Income', applicationValue: 'Rs. 2,20,000', documentValue: 'Rs. 2,40,000', status: 'Mismatch', explanation: 'Minor variance in annual income.' }
    ],
    flags: [{ id: 'F2', severity: 'Medium', description: 'Minor income variance between form and certificate.', relatedField: 'Annual Income' }],
    aiSuggestedReview: 'Income differs by Rs. 20,000. Both values below scheme ceiling.',
    sourceCheck: { sourceName: 'Odisha e-District', status: 'Not Connected', referenceId: 'OD-INC-4421' },
    activities: [
      { id: 'A1', timestamp: '11:30 AM', action: 'Document received', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: '11:32 AM', action: 'AI OCR extraction completed', actor: 'AI Engine', type: 'ai' }
    ],
  },
  {
    id: 'VER-2026-004',
    applicationId: 'MOTA-2026-5521',
    applicantName: 'Pooja Jamatia',
    schemeId: 'national-overseas-st',
    schemeName: 'National Overseas Scholarship',
    documentName: 'Foreign University Offer Letter',
    documentType: 'Admission Bonafide',
    state: 'Tripura',
    district: 'Gomati',
    uploadedAt: '2026-09-12 02:40 PM',
    fileName: 'oxford_offer_pooja.pdf',
    fileSize: '3.1 MB',
    priority: 'High',
    ocrStatus: 'Extracted',
    aiMatch: 'Match',
    verificationStatus: 'Verified',
    reviewer: 'MoTA Administrator',
    reviewerDecision: 'Verify Document',
    reviewerNote: 'Unconditional admission from QS Top 100 institution verified.',
    decisionDate: '2026-09-13 10:05 AM',
    extractedFields: [
      { key: 'name', label: 'Student Name', value: 'Pooja Jamatia', confidence: 99 },
      { key: 'university', label: 'University', value: 'University of Oxford', confidence: 99 }
    ],
    crossCheckFields: [
      { key: 'name', label: 'Applicant Name', applicationValue: 'Pooja Jamatia', documentValue: 'Pooja Jamatia', status: 'Match' },
      { key: 'university', label: 'University', applicationValue: 'University of Oxford', documentValue: 'University of Oxford', status: 'Match' }
    ],
    flags: [],
    aiSuggestedReview: 'All fields matched. Eligible for scholarship.',
    sourceCheck: { sourceName: 'University Verification', status: 'Demo Verified', referenceId: 'OX-9932', verifiedAt: '2026-09-12 03:00 PM' },
    activities: [
      { id: 'A1', timestamp: '02:40 PM', action: 'Document uploaded', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: 'Sep 13, 10:05 AM', action: 'Verified by MoTA Administrator', actor: 'MoTA Administrator', type: 'reviewer' }
    ],
  },
  {
    id: 'VER-2026-005',
    applicationId: 'MOTA-2026-9014',
    applicantName: 'Kavita Gond',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    documentName: 'Aadhaar Identity Proof',
    documentType: 'Aadhaar Card',
    state: 'Chhattisgarh',
    district: 'Bastar',
    uploadedAt: '2026-09-11 09:10 AM',
    fileName: 'kavita_aadhaar.png',
    fileSize: '0.6 MB',
    priority: 'Medium',
    ocrStatus: 'Extraction Failed',
    aiMatch: 'Unable to Compare',
    verificationStatus: 'Under Review',
    reviewer: 'MoTA Administrator',
    extractedFields: [
      { key: 'name', label: 'Name', value: 'Kavita [Unreadable]', confidence: 42 }
    ],
    crossCheckFields: [
      { key: 'name', label: 'Applicant Name', applicationValue: 'Kavita Gond', documentValue: 'Kavita [Unreadable]', status: 'Unable to Compare', explanation: 'Image blurred - insufficient quality for extraction.' }
    ],
    flags: [
      { id: 'F3', severity: 'High', description: 'Document image quality too low for OCR processing.', relatedField: 'Document Quality' }
    ],
    aiSuggestedReview: 'Recommend requesting clear re-upload from applicant.',
    sourceCheck: { sourceName: 'UIDAI Aadhaar', status: 'Not Connected', referenceId: 'UID-9912' },
    activities: [
      { id: 'A1', timestamp: '09:10 AM', action: 'Document uploaded', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: '09:12 AM', action: 'OCR extraction failed - low image quality', actor: 'AI Engine', type: 'ai' }
    ],
  },
  {
    id: 'VER-2026-006',
    applicationId: 'MOTA-2026-6401',
    applicantName: 'Rameshwar Meena',
    schemeId: 'higher-studies-assistance',
    schemeName: 'Higher Studies Assistance for ST',
    documentName: 'Bank Passbook',
    documentType: 'Bank Account Proof',
    state: 'Rajasthan',
    district: 'Udaipur',
    uploadedAt: '2026-09-10 03:50 PM',
    fileName: 'sbi_passbook_rameshwar.pdf',
    fileSize: '1.5 MB',
    priority: 'Low',
    ocrStatus: 'Extracted',
    aiMatch: 'Match',
    verificationStatus: 'Verified',
    reviewer: 'MoTA Administrator',
    reviewerDecision: 'Verify Document',
    reviewerNote: 'Account holder name matches. IFSC verified.',
    decisionDate: '2026-09-11 11:20 AM',
    extractedFields: [
      { key: 'accountHolder', label: 'Account Holder', value: 'Rameshwar Meena', confidence: 98 },
      { key: 'accountNo', label: 'Account Number', value: '30992817462', confidence: 97 },
      { key: 'ifsc', label: 'IFSC Code', value: 'SBIN0001248', confidence: 99 }
    ],
    crossCheckFields: [
      { key: 'holder', label: 'Account Holder', applicationValue: 'Rameshwar Meena', documentValue: 'Rameshwar Meena', status: 'Match' },
      { key: 'account', label: 'Account Number', applicationValue: '30992817462', documentValue: '30992817462', status: 'Match' }
    ],
    flags: [],
    aiSuggestedReview: 'All account details matched. Ready for DBT disbursement.',
    sourceCheck: { sourceName: 'PFMS DBT Gateway', status: 'Demo Match', referenceId: 'PFMS-8821', verifiedAt: '2026-09-10 03:55 PM' },
    activities: [
      { id: 'A1', timestamp: '03:50 PM', action: 'Document uploaded', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: 'Sep 11, 11:20 AM', action: 'Verified by MoTA Administrator', actor: 'MoTA Administrator', type: 'reviewer' }
    ],
  },
  {
    id: 'VER-2026-007',
    applicationId: 'MOTA-2026-8833',
    applicantName: 'Ananya Boro',
    schemeId: 'doctoral-tribal-studies',
    schemeName: 'Doctoral Fellowship in Tribal Studies',
    documentName: 'PhD Enrollment Certificate',
    documentType: 'Research Bonafide',
    state: 'Assam',
    district: 'Kamrup',
    uploadedAt: '2026-09-09 01:15 PM',
    fileName: 'phd_registration_boro.pdf',
    fileSize: '2.2 MB',
    priority: 'Medium',
    ocrStatus: 'Extracted',
    aiMatch: 'Match',
    verificationStatus: 'Pending',
    reviewer: 'Unassigned',
    extractedFields: [
      { key: 'name', label: 'Scholar Name', value: 'Ananya Boro', confidence: 99 },
      { key: 'university', label: 'University', value: 'Gauhati University', confidence: 98 },
      { key: 'topic', label: 'Research Topic', value: 'Oral Traditions of Bodo Tribes', confidence: 95 }
    ],
    crossCheckFields: [
      { key: 'name', label: 'Scholar Name', applicationValue: 'Ananya Boro', documentValue: 'Ananya Boro', status: 'Match' },
      { key: 'university', label: 'University', applicationValue: 'Gauhati University', documentValue: 'Gauhati University', status: 'Match' }
    ],
    flags: [],
    aiSuggestedReview: 'All research credentials aligned with fellowship guidelines.',
    sourceCheck: { sourceName: 'University Academic Cell', status: 'Demo Match', referenceId: 'GU-PHD-771', verifiedAt: '2026-09-09 01:20 PM' },
    activities: [
      { id: 'A1', timestamp: '01:15 PM', action: 'Document uploaded', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: '01:18 PM', action: 'AI OCR extracted research metadata', actor: 'AI Engine', type: 'ai' }
    ],
  },
  {
    id: 'VER-2026-008',
    applicationId: 'MOTA-2026-4419',
    applicantName: 'Deepak Rathwa',
    schemeId: 'vocational-support-st',
    schemeName: 'Vocational & Technical Training Support',
    documentName: 'Scheduled Tribe Certificate',
    documentType: 'ST Category Certificate',
    state: 'Gujarat',
    district: 'Chhota Udaipur',
    uploadedAt: '2026-09-08 10:00 AM',
    fileName: 'st_cert_deepak.pdf',
    fileSize: '1.4 MB',
    priority: 'High',
    ocrStatus: 'Extracted',
    aiMatch: 'Mismatch',
    verificationStatus: 'Rejected',
    reviewer: 'MoTA Administrator',
    reviewerDecision: 'Reject Document',
    rejectionReason: 'Provisional certificate submitted. Permanent digital certificate required.',
    decisionDate: '2026-09-09 03:30 PM',
    extractedFields: [
      { key: 'name', label: 'Candidate Name', value: 'Deepak Rathwa', confidence: 97 },
      { key: 'tribe', label: 'Tribe', value: 'Rathwa', confidence: 98 },
      { key: 'certType', label: 'Certificate Type', value: 'Provisional', confidence: 96 }
    ],
    crossCheckFields: [
      { key: 'certType', label: 'Certificate Type', applicationValue: 'Permanent', documentValue: 'Provisional', status: 'Mismatch', explanation: 'Temporary certificate submitted instead of permanent barcoded certificate.' }
    ],
    flags: [
      { id: 'F4', severity: 'High', description: 'Provisional certificate submitted - permanent certificate required.', relatedField: 'Certificate Status' }
    ],
    aiSuggestedReview: 'Certificate type invalid for scheme eligibility.',
    sourceCheck: { sourceName: 'Gujarat e-District', status: 'Demo Mismatch', referenceId: 'GJ-REV-1092', verifiedAt: '2026-09-08 10:10 AM' },
    activities: [
      { id: 'A1', timestamp: '10:00 AM', action: 'Document uploaded', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: '10:05 AM', action: 'Provisional certificate detected', actor: 'AI Engine', type: 'flag' },
      { id: 'A3', timestamp: 'Sep 09, 03:30 PM', action: 'Rejected by MoTA Administrator', actor: 'MoTA Administrator', type: 'reviewer' }
    ],
  },
  {
    id: 'VER-2026-009',
    applicationId: 'MOTA-2026-2281',
    applicantName: 'Mina Naik',
    schemeId: 'professional-course-scholarship',
    schemeName: 'Professional & Technical Course Scholarship',
    documentName: 'College Fee Receipt',
    documentType: 'Fee Receipt',
    state: 'Maharashtra',
    district: 'Nandurbar',
    uploadedAt: '2026-09-07 11:20 AM',
    fileName: 'coep_fee_receipt_mina.pdf',
    fileSize: '1.9 MB',
    priority: 'Medium',
    ocrStatus: 'Extracted',
    aiMatch: 'Match',
    verificationStatus: 'Pending',
    reviewer: 'Unassigned',
    extractedFields: [
      { key: 'name', label: 'Student Name', value: 'Mina Naik', confidence: 99 },
      { key: 'college', label: 'College', value: 'COEP Technological University', confidence: 98 },
      { key: 'fee', label: 'Tuition Fee', value: 'Rs. 78,500', confidence: 96 }
    ],
    crossCheckFields: [
      { key: 'name', label: 'Student Name', applicationValue: 'Mina Naik', documentValue: 'Mina Naik', status: 'Match' },
      { key: 'fee', label: 'Tuition Fee', applicationValue: 'Rs. 78,500', documentValue: 'Rs. 78,500', status: 'Match' }
    ],
    flags: [],
    aiSuggestedReview: 'Fee receipt verified. Institution seal authenticated.',
    sourceCheck: { sourceName: 'MahaDBT Institution Verification', status: 'Demo Match', referenceId: 'MHA-FEE-9102', verifiedAt: '2026-09-07 11:25 AM' },
    activities: [
      { id: 'A1', timestamp: '11:20 AM', action: 'Fee receipt uploaded', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: '11:24 AM', action: 'AI OCR parsed fee details', actor: 'AI Engine', type: 'ai' }
    ],
  },
  {
    id: 'VER-2026-010',
    applicationId: 'MOTA-2026-7734',
    applicantName: 'Vikram Soren',
    schemeId: 'post-matric-st',
    schemeName: 'Post Matric Scholarship for ST Students',
    documentName: 'Income Certificate',
    documentType: 'Income Certificate',
    state: 'West Bengal',
    district: 'Purulia',
    uploadedAt: '2026-09-06 05:00 PM',
    fileName: 'wb_income_cert_vikram.pdf',
    fileSize: '1.6 MB',
    priority: 'High',
    ocrStatus: 'Processing',
    aiMatch: 'Unable to Compare',
    verificationStatus: 'Pending',
    reviewer: 'Unassigned',
    extractedFields: [
      { key: 'name', label: 'Applicant Name', value: 'Vikram Soren', confidence: 97 },
      { key: 'income', label: 'Annual Income', value: 'Rs. 1,80,000', confidence: 88 }
    ],
    crossCheckFields: [
      { key: 'name', label: 'Applicant Name', applicationValue: 'Vikram Soren', documentValue: 'Vikram Soren', status: 'Match' }
    ],
    flags: [],
    aiSuggestedReview: 'OCR processing in progress. Check back in a few minutes.',
    sourceCheck: { sourceName: 'WB e-District Portal', status: 'Not Connected', referenceId: 'WB-INC-6612' },
    activities: [
      { id: 'A1', timestamp: '05:00 PM', action: 'Document uploaded', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: '05:01 PM', action: 'OCR extraction in progress', actor: 'AI Engine', type: 'ai' }
    ],
  },
  {
    id: 'VER-2026-011',
    applicationId: 'MOTA-2026-1932',
    applicantName: 'Tenzin Lepcha',
    schemeId: 'pre-matric-st',
    schemeName: 'Pre-Matric Scholarship for ST Students',
    documentName: 'School Bonafide Certificate',
    documentType: 'School Bonafide',
    state: 'Sikkim',
    district: 'Gangtok',
    uploadedAt: '2026-09-05 09:40 AM',
    fileName: 'school_bonafide_tenzin.pdf',
    fileSize: '1.1 MB',
    priority: 'Low',
    ocrStatus: 'Extracted',
    aiMatch: 'Match',
    verificationStatus: 'Pending',
    reviewer: 'Unassigned',
    extractedFields: [
      { key: 'name', label: 'Student Name', value: 'Tenzin Lepcha', confidence: 99 },
      { key: 'school', label: 'School Name', value: 'Govt. Senior Secondary School', confidence: 98 },
      { key: 'class', label: 'Class', value: 'Class X', confidence: 97 }
    ],
    crossCheckFields: [
      { key: 'name', label: 'Student Name', applicationValue: 'Tenzin Lepcha', documentValue: 'Tenzin Lepcha', status: 'Match' },
      { key: 'school', label: 'School', applicationValue: 'Govt. Senior Secondary School, Gangtok', documentValue: 'Govt. Senior Secondary School', status: 'Match' }
    ],
    flags: [],
    aiSuggestedReview: 'Clean match. School enrolment confirmed.',
    sourceCheck: { sourceName: 'Sikkim Education Board', status: 'Demo Match', referenceId: 'SKM-SCH-119', verifiedAt: '2026-09-05 09:45 AM' },
    activities: [
      { id: 'A1', timestamp: '09:40 AM', action: 'School certificate uploaded', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: '09:42 AM', action: 'AI OCR extracted school details', actor: 'AI Engine', type: 'ai' }
    ],
  },
  {
    id: 'VER-2026-012',
    applicationId: 'MOTA-2026-3819',
    applicantName: 'Neelam Kispotta',
    schemeId: 'national-fellowship-st',
    schemeName: 'National Fellowship for ST Students',
    documentName: 'UGC-NET Certificate',
    documentType: 'Exam Qualification',
    state: 'Jharkhand',
    district: 'Gumla',
    uploadedAt: '2026-09-04 02:15 PM',
    fileName: 'ugc_net_neelam.pdf',
    fileSize: '2.1 MB',
    priority: 'High',
    ocrStatus: 'Extracted',
    aiMatch: 'Match',
    verificationStatus: 'Pending',
    reviewer: 'Unassigned',
    extractedFields: [
      { key: 'name', label: 'Candidate Name', value: 'Neelam Kispotta', confidence: 99 },
      { key: 'rollNo', label: 'NTA Roll No', value: 'JH04001928', confidence: 98 },
      { key: 'score', label: 'Percentile', value: '98.65', confidence: 99 }
    ],
    crossCheckFields: [
      { key: 'name', label: 'Candidate Name', applicationValue: 'Neelam Kispotta', documentValue: 'Neelam Kispotta', status: 'Match' },
      { key: 'rollNo', label: 'NTA Roll No', applicationValue: 'JH04001928', documentValue: 'JH04001928', status: 'Match' }
    ],
    flags: [],
    aiSuggestedReview: 'High percentile score. Excellent match for fellowship.',
    sourceCheck: { sourceName: 'NTA Verification Server', status: 'Demo Match', referenceId: 'NTA-JRF-8832', verifiedAt: '2026-09-04 02:20 PM' },
    activities: [
      { id: 'A1', timestamp: '02:15 PM', action: 'Certificate uploaded', actor: 'System', type: 'system' },
      { id: 'A2', timestamp: '02:18 PM', action: 'AI OCR extracted qualification details', actor: 'AI Engine', type: 'ai' }
    ],
  },
];

export const LOCALSTORAGE_VERIFICATION_KEY = 'mota_admin_verification_state';

export function getInitialVerificationRecords(): VerificationRecord[] {
  if (typeof window === 'undefined') return INITIAL_VERIFICATION_RECORDS;
  try {
    const saved = localStorage.getItem(LOCALSTORAGE_VERIFICATION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Unable to load verification state', e);
  }
  return INITIAL_VERIFICATION_RECORDS;
}

export function saveVerificationRecordsToLocalStorage(records: VerificationRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALSTORAGE_VERIFICATION_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Unable to persist state', e);
  }
}
