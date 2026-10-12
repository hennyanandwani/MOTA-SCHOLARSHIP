export type DocumentStatus =
  | 'not_uploaded'
  | 'uploaded'
  | 'verifying'
  | 'verified'
  | 'needs_attention'
  | 'rejected';

export type DocumentCheckStatus = 'passed' | 'potential_mismatch' | 'requires_review';

export type ApplicationDocument = {
  id: string;
  persistedDocumentId?: string;
  name: string;
  required: boolean;
  description: string;
  icon: 'certificate' | 'identity' | 'academic' | 'bank' | 'photo';
  status: DocumentStatus;
  fileName?: string;
  fileSize?: string;
  sizeBytes?: number;
  progress?: number;
  issue?: string;
  aiChecks?: {
    readability: DocumentCheckStatus;
    requiredFields: DocumentCheckStatus;
    applicationComparison: DocumentCheckStatus;
  };
  extractedFields?: {
    name: string;
    certificateNumber: string;
    issueDate: string;
  };
};

export type PersistedApplicationDocument = {
  id: string;
  type: string;
  originalName: string;
  sizeBytes: number;
  verificationStatus: string;
  verificationRemarks: string | null;
};

export function createEmptyApplicationDocuments(): ApplicationDocument[] {
  return demoApplicationDocuments.map((document) => ({
    ...document,
    status: 'not_uploaded',
    fileName: undefined,
    fileSize: undefined,
    sizeBytes: undefined,
    progress: undefined,
    issue: undefined,
    aiChecks: undefined,
    extractedFields: undefined,
  }));
}

export function mergePersistedApplicationDocuments(
  baseDocuments: ApplicationDocument[],
  persistedDocuments: readonly PersistedApplicationDocument[],
): ApplicationDocument[] {
  const documentIdByType: Record<string, string> = {
    CASTE_CERTIFICATE: 'st-certificate',
    INCOME_CERTIFICATE: 'income-certificate',
    MARKSHEET: 'previous-marksheet',
    IDENTITY_PROOF: 'identity-document',
    ADMISSION_PROOF: 'admission-certificate',
    BANK_PROOF: 'bank-proof',
    PHOTOGRAPH: 'photograph',
  };
  const documentById = new Map(baseDocuments.map((document) => [document.id, document]));

  for (const persisted of persistedDocuments) {
    const documentId = documentIdByType[persisted.type];
    const existing = documentId ? documentById.get(documentId) : undefined;
    if (!existing) continue;

    let status: DocumentStatus = 'uploaded';
    if (persisted.verificationStatus === 'VERIFIED') status = 'verified';
    if (persisted.verificationStatus === 'FLAGGED') status = 'needs_attention';
    if (persisted.verificationStatus === 'REJECTED') status = 'rejected';

    documentById.set(documentId, {
      ...existing,
      persistedDocumentId: persisted.id,
      status,
      fileName: persisted.originalName,
      fileSize: formatFileSize(persisted.sizeBytes),
      sizeBytes: persisted.sizeBytes,
      issue: persisted.verificationRemarks ?? undefined,
    });
  }

  return baseDocuments.map((document) => documentById.get(document.id) ?? document);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const demoApplicationDocuments: ApplicationDocument[] = [
  {
    id: 'st-certificate',
    name: 'ST Certificate',
    required: true,
    description: 'Issued by a competent authority and valid for the applicant.',
    icon: 'certificate',
    status: 'verified',
    fileName: 'st_certificate_rahul_kumar.pdf',
    fileSize: '2.4 MB',
    sizeBytes: 2516582,
    aiChecks: { readability: 'passed', requiredFields: 'passed', applicationComparison: 'passed' },
  },
  {
    id: 'income-certificate',
    name: 'Income Certificate',
    required: true,
    description: 'Current certificate showing the family’s annual income.',
    icon: 'certificate',
    status: 'needs_attention',
    fileName: 'income_certificate.pdf',
    fileSize: '1.8 MB',
    sizeBytes: 1887437,
    issue: 'Possible name mismatch',
    aiChecks: { readability: 'passed', requiredFields: 'passed', applicationComparison: 'potential_mismatch' },
    extractedFields: {
      name: 'Rahul Kumar',
      certificateNumber: 'INC-2026-00451',
      issueDate: '15 July 2026',
    },
  },
  {
    id: 'identity-document',
    name: 'Aadhaar / Identity Document',
    required: true,
    description: 'A clear identity document with details matching your application.',
    icon: 'identity',
    status: 'uploaded',
    fileName: 'identity_document.pdf',
    fileSize: '860 KB',
    sizeBytes: 880640,
    aiChecks: { readability: 'passed', requiredFields: 'passed', applicationComparison: 'requires_review' },
  },
  {
    id: 'previous-marksheet',
    name: 'Previous Academic Marksheet',
    required: true,
    description: 'Marksheet for your most recently completed academic year.',
    icon: 'academic',
    status: 'verified',
    fileName: 'class_12_marksheet.pdf',
    fileSize: '1.2 MB',
    sizeBytes: 1258291,
    aiChecks: { readability: 'passed', requiredFields: 'passed', applicationComparison: 'passed' },
  },
  {
    id: 'admission-certificate',
    name: 'Admission / Bonafide Certificate',
    required: true,
    description: 'Current proof of admission from your institution.',
    icon: 'academic',
    status: 'uploaded',
    fileName: 'bonafide_certificate.pdf',
    fileSize: '940 KB',
    sizeBytes: 962560,
    aiChecks: { readability: 'passed', requiredFields: 'requires_review', applicationComparison: 'requires_review' },
  },
  {
    id: 'bank-proof',
    name: 'Bank Account Proof',
    required: true,
    description: 'Passbook page or bank document showing the account holder and account details.',
    icon: 'bank',
    status: 'not_uploaded',
  },
  {
    id: 'photograph',
    name: 'Passport-size Photograph',
    required: true,
    description: 'A recent, clear passport-size photograph of the applicant.',
    icon: 'photo',
    status: 'not_uploaded',
  },
];

export const documentStatuses: DocumentStatus[] = [
  'not_uploaded',
  'uploaded',
  'verifying',
  'verified',
  'needs_attention',
  'rejected',
];