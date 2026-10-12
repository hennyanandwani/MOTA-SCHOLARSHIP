import {
  ApplicationStatus,
  VerificationStatus,
} from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { AdminApplicationRecord } from '@/lib/adminData';

export type AdminApplicationSummary = AdminApplicationRecord;

export type AdminApplicationDetail = {
  id: string;
  applicationNumber: string;
  status: ApplicationStatus;
  academicYear: string;
  submittedAt: string | null;
  updatedAt: string;
  scheme: { id: string; name: string; type: string };
  applicant: { name: string; email: string; rollNumber: string };
  formData: Record<string, unknown> | null;
  aiConfidence: string | null;
  aiRemarks: string | null;
  documents: {
    id: string;
    type: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    verificationStatus: VerificationStatus;
    verificationRemarks: string | null;
    createdAt: string;
  }[];
  decisions: {
    id: string;
    status: ApplicationStatus;
    officerRemarks: string | null;
    createdAt: string;
    officerName: string;
  }[];
};

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nestedString(value: unknown, group: string, field: string): string {
  const section = record(record(value)?.[group]);
  const result = section?.[field];
  return typeof result === 'string' && result.trim() ? result.trim() : 'Not provided';
}

function currentStage(status: ApplicationStatus): string {
  switch (status) {
    case ApplicationStatus.DRAFT: return 'Draft';
    case ApplicationStatus.SUBMITTED: return 'Awaiting verification';
    case ApplicationStatus.PENDING_VERIFICATION: return 'Verification in progress';
    case ApplicationStatus.FLAGGED_FOR_MANUAL_REVIEW: return 'Manual review';
    case ApplicationStatus.RECOMMENDED_FOR_APPROVAL: return 'Awaiting officer decision';
    case ApplicationStatus.APPROVED_BY_OFFICER: return 'Approved';
    case ApplicationStatus.REJECTED_BY_OFFICER: return 'Rejected';
  }
}

function verificationStatus(statuses: VerificationStatus[]): AdminApplicationRecord['verificationStatus'] {
  if (statuses.length === 0) return 'Not run';
  if (statuses.every((status) => status === VerificationStatus.PENDING)) {
    return 'Pending';
  }
  if (statuses.includes(VerificationStatus.REJECTED)) return 'Failed';
  if (statuses.includes(VerificationStatus.FLAGGED)) return 'Discrepancy Flagged';
  if (statuses.every((status) => status === VerificationStatus.VERIFIED)) return 'Verified';
  return 'Pending';
}

export async function getAdminApplicationSummaries(): Promise<AdminApplicationSummary[]> {
  const applications = await prisma.scholarshipApplication.findMany({
    orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
    select: {
      applicationNumber: true,
      status: true,
      academicYear: true,
      submittedAt: true,
      updatedAt: true,
      formData: true,
      aiConfidence: true,
      scheme: { select: { id: true, name: true } },
      student: {
        select: {
          rollNumber: true,
          user: { select: { fullName: true } },
        },
      },
      documents: { select: { verificationStatus: true } },
    },
  });

  return applications.map((application) => ({
    applicationId: application.applicationNumber,
    applicantName: application.student.user.fullName,
    category: 'ST',
    gender: nestedString(application.formData, 'personal', 'gender'),
    schemeId: application.scheme.id,
    schemeName: application.scheme.name,
    academicYear: application.academicYear,
    state: nestedString(application.formData, 'personal', 'state'),
    district: nestedString(application.formData, 'personal', 'district'),
    institutionName: nestedString(application.formData, 'academic', 'institutionName'),
    course: nestedString(application.formData, 'academic', 'course'),
    familyIncome: (() => {
      const value = nestedString(application.formData, 'family', 'annualIncome');
      const amount = Number(value);
      return Number.isFinite(amount) ? amount : null;
    })(),
    submittedDate: application.submittedAt?.toLocaleDateString('en-IN') ?? 'Not submitted',
    currentStage: currentStage(application.status),
    status: application.status,
    verificationStatus: verificationStatus(
      application.documents.map((document) => document.verificationStatus),
    ),
    deficiencyStatus: 'Not tracked',
    riskScore: application.aiConfidence === null
      ? 'Not assessed'
      : `${application.aiConfidence.toString()}% confidence`,
    lastActionDate: application.updatedAt.toISOString(),
    verifiedDocsCount: application.documents.filter(
      (document) => document.verificationStatus === VerificationStatus.VERIFIED,
    ).length,
    pendingDocsCount: application.documents.filter(
      (document) => document.verificationStatus === VerificationStatus.PENDING,
    ).length,
    flaggedDocsCount: application.documents.filter(
      (document) =>
        document.verificationStatus === VerificationStatus.FLAGGED ||
        document.verificationStatus === VerificationStatus.REJECTED,
    ).length,
  }));
}

export async function getAdminApplicationDetail(
  applicationNumber: string,
): Promise<AdminApplicationDetail | null> {
  const application = await prisma.scholarshipApplication.findUnique({
    where: { applicationNumber },
    select: {
      id: true,
      applicationNumber: true,
      status: true,
      academicYear: true,
      submittedAt: true,
      updatedAt: true,
      formData: true,
      aiConfidence: true,
      aiRemarks: true,
      scheme: { select: { id: true, name: true, type: true } },
      student: {
        select: {
          rollNumber: true,
          user: { select: { fullName: true, email: true } },
        },
      },
      documents: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          type: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          verificationStatus: true,
          verificationRemarks: true,
          createdAt: true,
        },
      },
      decisions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          officerRemarks: true,
          createdAt: true,
          officer: { select: { fullName: true } },
        },
      },
    },
  });

  if (!application) return null;

  const data = record(application.formData);
  const bank = record(data?.bank);
  const sanitizedFormData = data
    ? {
        ...data,
        bank: bank
          ? {
              ...bank,
              accountNumber:
                typeof bank.accountNumber === 'string'
                  ? `••••${bank.accountNumber.slice(-4)}`
                  : 'Not provided',
              confirmAccountNumber: undefined,
            }
          : undefined,
      }
    : null;

  return {
    id: application.id,
    applicationNumber: application.applicationNumber,
    status: application.status,
    academicYear: application.academicYear,
    submittedAt: application.submittedAt?.toISOString() ?? null,
    updatedAt: application.updatedAt.toISOString(),
    scheme: application.scheme,
    applicant: {
      name: application.student.user.fullName,
      email: application.student.user.email,
      rollNumber: application.student.rollNumber,
    },
    formData: sanitizedFormData,
    aiConfidence: application.aiConfidence?.toString() ?? null,
    aiRemarks: application.aiRemarks,
    documents: application.documents.map((document) => ({
      ...document,
      createdAt: document.createdAt.toISOString(),
    })),
    decisions: application.decisions.map((decision) => ({
      ...decision,
      createdAt: decision.createdAt.toISOString(),
      officerName: decision.officer.fullName,
    })),
  };
}
