import type { ApplicationData, ApplicationDeclarations, ApplicationStep } from '@/lib/applicationDraft';

export type StudentApplicationDocumentRecord = {
  id: string;
  type: string;
  originalName: string;
  sizeBytes: number;
  verificationStatus: string;
  verificationRemarks: string | null;
};

export type ApplicationSubmissionResponse = {
  id: string;
  applicationNumber: string;
  status: string;
  submittedAt: string;
};

export type StudentApplicationRecord = {
  id: string;
  applicationNumber: string;
  schemeId: string;
  schemeName: string;
  schemeType: 'SCHOLARSHIP' | 'FELLOWSHIP';
  academicYear: string;
  status: string;
  currentStep: ApplicationStep;
  formData: unknown;
  informationConfirmed: boolean;
  verificationAcknowledged: boolean;
  eligibilityNotGuaranteed: boolean;
  termsAccepted: boolean;
  accountNumberConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  documents: StudentApplicationDocumentRecord[];
};

type DraftResponse = {
  id: string;
  applicationNumber: string;
  status: string;
  currentStep: ApplicationStep;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isApplicationStep(value: unknown): value is ApplicationStep {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function parseDocument(value: unknown): StudentApplicationDocumentRecord | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.type !== 'string' ||
    typeof value.originalName !== 'string' ||
    typeof value.sizeBytes !== 'number' ||
    typeof value.verificationStatus !== 'string' ||
    (value.verificationRemarks !== undefined &&
      value.verificationRemarks !== null &&
      typeof value.verificationRemarks !== 'string')
  ) {
    return null;
  }

  return {
    id: value.id,
    type: value.type,
    originalName: value.originalName,
    sizeBytes: value.sizeBytes,
    verificationStatus: value.verificationStatus,
    verificationRemarks:
      typeof value.verificationRemarks === 'string' ? value.verificationRemarks : null,
  };
}

function parseApplication(value: unknown): StudentApplicationRecord | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.applicationNumber !== 'string' ||
    typeof value.schemeId !== 'string' ||
    !isRecord(value.scheme) ||
    typeof value.scheme.name !== 'string' ||
    (value.scheme.type !== 'SCHOLARSHIP' && value.scheme.type !== 'FELLOWSHIP') ||
    typeof value.academicYear !== 'string' ||
    typeof value.status !== 'string' ||
    !isApplicationStep(value.currentStep) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    typeof value.informationConfirmed !== 'boolean' ||
    typeof value.verificationAcknowledged !== 'boolean' ||
    typeof value.eligibilityNotGuaranteed !== 'boolean' ||
    typeof value.termsAccepted !== 'boolean' ||
    typeof value.accountNumberConfirmed !== 'boolean' ||
    !Array.isArray(value.documents)
  ) {
    return null;
  }

  const documents = value.documents.map(parseDocument);
  if (documents.some((document) => document === null)) return null;

  return {
    id: value.id,
    applicationNumber: value.applicationNumber,
    schemeId: value.schemeId,
    schemeName: value.scheme.name,
    schemeType: value.scheme.type,
    academicYear: value.academicYear,
    status: value.status,
    currentStep: value.currentStep,
    formData: value.formData,
    informationConfirmed: value.informationConfirmed,
    verificationAcknowledged: value.verificationAcknowledged,
    eligibilityNotGuaranteed: value.eligibilityNotGuaranteed,
    termsAccepted: value.termsAccepted,
    accountNumberConfirmed: value.accountNumberConfirmed,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    submittedAt: typeof value.submittedAt === 'string' ? value.submittedAt : null,
    documents: documents.filter((document): document is StudentApplicationDocumentRecord => document !== null),
  };
}

async function readResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload) && typeof payload.error === 'string' && payload.error.trim()) {
    const validationErrors = Array.isArray(payload.validationErrors)
      ? payload.validationErrors.filter((error): error is string => typeof error === 'string')
      : [];
    return [payload.error.trim(), ...validationErrors].join(' ').slice(0, 1000);
  }
  return fallback;
}

export async function fetchStudentApplications(): Promise<StudentApplicationRecord[]> {
  const response = await fetch('/api/student/applications', {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to load your applications.'));
  }
  if (!isRecord(payload) || !Array.isArray(payload.applications)) {
    throw new Error('The server returned an unexpected applications response.');
  }

  const applications = payload.applications.map(parseApplication);
  if (applications.some((application) => application === null)) {
    throw new Error('The server returned an invalid application record.');
  }
  return applications.filter((application): application is StudentApplicationRecord => application !== null);
}

export async function saveStudentApplicationDraft({
  schemeId,
  applicationId,
  currentStep,
  data,
  declarations,
}: {
  schemeId: string;
  applicationId?: string;
  currentStep: ApplicationStep;
  data: ApplicationData;
  declarations: ApplicationDeclarations;
}): Promise<DraftResponse> {
  const response = await fetch('/api/student/applications', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      schemeId,
      applicationId,
      academicYear: '2026-2027',
      currentStep,
      data,
      declarations,
    }),
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to save your application draft.'));
  }
  if (!isRecord(payload) || !isRecord(payload.application)) {
    throw new Error('The server returned an unexpected draft response.');
  }

  const application = payload.application;
  if (
    typeof application.id !== 'string' ||
    typeof application.applicationNumber !== 'string' ||
    typeof application.status !== 'string' ||
    !isApplicationStep(application.currentStep) ||
    typeof application.updatedAt !== 'string'
  ) {
    throw new Error('The server returned an invalid saved application.');
  }

  return {
    id: application.id,
    applicationNumber: application.applicationNumber,
    status: application.status,
    currentStep: application.currentStep,
    updatedAt: application.updatedAt,
  };
}

export async function submitStudentApplication(
  applicationId: string,
): Promise<ApplicationSubmissionResponse> {
  const response = await fetch(
    `/api/student/applications/${encodeURIComponent(applicationId)}/submit`,
    {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    },
  );
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to submit your application.'));
  }
  if (!isRecord(payload) || !isRecord(payload.application)) {
    throw new Error('The server returned an unexpected submission response.');
  }

  const application = payload.application;
  if (
    typeof application.id !== 'string' ||
    typeof application.applicationNumber !== 'string' ||
    application.status !== 'SUBMITTED' ||
    typeof application.submittedAt !== 'string'
  ) {
    throw new Error('The server returned an invalid submitted application.');
  }

  return {
    id: application.id,
    applicationNumber: application.applicationNumber,
    status: application.status,
    submittedAt: application.submittedAt,
  };
}

export async function uploadStudentApplicationDocument({
  applicationId,
  file,
  type,
}: {
  applicationId: string;
  file: File;
  type: string;
}): Promise<StudentApplicationDocumentRecord> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await fetch(
    `/api/student/applications/${encodeURIComponent(applicationId)}/documents`,
    {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
      signal: AbortSignal.timeout(120_000),
    },
  );
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Unable to upload this document.'));
  }
  if (!isRecord(payload)) {
    throw new Error('The server returned an unexpected document response.');
  }

  const document = parseDocument(payload.document);
  if (!document) {
    throw new Error('The server returned an invalid uploaded document.');
  }
  return document;
}
