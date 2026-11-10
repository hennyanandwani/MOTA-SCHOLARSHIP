import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { getCurrentAppUser } from '@/lib/auth/current-user';
import { getOwnedApplicationScope } from '@/lib/applicationConcurrency';
import {
  getEffectiveRequiredDocumentTypes,
  getApplicationDocumentLabel,
  getRequiredDocumentTypesFromPolicySnapshot,
} from '@/lib/applicationRequirements';
import { studentNavigation } from '@/lib/navigation';
import { prisma } from '@/lib/prisma';
import { getStudentAiReason } from '@/lib/phase6Workflow';
import { AiCorrectionForm } from '@/components/student/applications/AiCorrectionForm';
import { AiVerificationProgress } from '@/components/student/applications/AiVerificationProgress';
import { SYNTHETIC_POLICY_LABEL } from '@/lib/syntheticVerificationPolicy';
import { resolveSchemeRequiredDocumentTypes } from '@/lib/schemeRequiredDocuments';
import { isRetryableTechnicalFailure } from '@/lib/studentAiRetry';

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_VERIFICATION: 'Under review',
  FLAGGED_FOR_MANUAL_REVIEW: 'Manual review',
  RECOMMENDED_FOR_APPROVAL: 'Recommended for approval',
  APPROVED_BY_OFFICER: 'Approved',
  REJECTED_BY_OFFICER: 'Rejected',
  REJECTED_BY_AI: 'AI-ineligible',
};

function formatDate(value: Date | null): string {
  if (!value) return 'Not submitted';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function documentStatusLabel(status: string): string {
  switch (status) {
    case 'VERIFIED': return 'Verified';
    case 'FLAGGED': return 'Needs attention';
    case 'REJECTED': return 'Rejected';
    default: return 'Uploaded · pending verification';
  }
}

export default async function ApplicationTrackingRoute({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const user = await getCurrentAppUser();
  if (!user || !user.student || user.role !== 'STUDENT') redirect('/login');

  const application = await prisma.scholarshipApplication.findFirst({
    where: getOwnedApplicationScope(applicationId, user.student.id),
    select: {
      id: true,
      applicationNumber: true,
      academicYear: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
      aiVerificationStatus: true,
      aiAttemptCount: true,
      aiInputVersion: true,
      studentAiReason: true,
      scheme: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      documents: {
        select: {
          id: true,
          type: true,
          originalName: true,
          verificationStatus: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      aiVerificationJobs: {
        orderBy: { inputVersion: 'desc' },
        take: 1,
        select: {
          inputVersion: true,
          status: true,
          lastErrorCode: true,
          outcome: true,
          completedAt: true,
          isSynthetic: true,
          policySnapshot: true,
        },
      },
      selectionDecisions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { outcome: true },
      },
      approvalDecisions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true },
      },
    },
  });

  if (!application) notFound();

  const documentsByType = new Map<string, (typeof application.documents)[number]>();
  const latestAiJob = application.aiVerificationJobs[0];
  const isCurrentJob = latestAiJob?.inputVersion === application.aiInputVersion;
  const canRetryAiVerification = isRetryableTechnicalFailure({
    verificationStatus: application.aiVerificationStatus,
    currentInputVersion: application.aiInputVersion,
    jobInputVersion: latestAiJob?.inputVersion ?? -1,
    jobStatus: latestAiJob?.status ?? '',
    jobOutcome: latestAiJob?.outcome ?? null,
    lastErrorCode: latestAiJob?.lastErrorCode ?? null,
  });
  const requiredDocumentTypeList = isCurrentJob
    ? getRequiredDocumentTypesFromPolicySnapshot(latestAiJob.policySnapshot)
    : application.status === 'DRAFT'
      ? await resolveSchemeRequiredDocumentTypes(application.scheme.id)
      : getEffectiveRequiredDocumentTypes(null);
  const requiredDocumentTypes = new Set<string>(requiredDocumentTypeList);
  for (const document of application.documents) {
    if (!documentsByType.has(document.type)) {
      documentsByType.set(document.type, document);
    }
  }
  const supportingDocuments = application.documents.filter(
    (document) => !requiredDocumentTypes.has(document.type),
  );
  const isDraft = application.status === 'DRAFT';
  const isSyntheticTest = Boolean(
    latestAiJob?.inputVersion === application.aiInputVersion &&
    latestAiJob.isSynthetic,
  );
  const hasCorrection = Boolean(
    latestAiJob?.status === 'COMPLETED' &&
    latestAiJob.outcome === 'INELIGIBLE' &&
    latestAiJob.completedAt &&
    application.documents.some((document) => document.updatedAt > latestAiJob.completedAt!),
  );

  return (
    <div className="min-h-screen">
      <Topbar
        title="Application Details"
        subtitle="Your persisted scholarship application status"
        userName={user.fullName}
      />
      <Sidebar items={studentNavigation} title="Student Portal" />
      <main className="min-w-0 p-4 sm:p-6 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <section className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2563A8]">
                  {application.scheme.type === 'FELLOWSHIP' ? 'Fellowship' : 'Scholarship'}
                </p>
                <h1 className="mt-2 text-xl font-bold text-[#172033]">{application.scheme.name}</h1>
                <p className="mt-1 break-all text-xs text-[#64748B]">{application.applicationNumber}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1D5796]">
                {statusLabels[application.status] ?? application.status}
              </span>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-[#EEF1F5] pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#64748B]">Academic year</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">{application.academicYear}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Submitted</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">{formatDate(application.submittedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Last updated</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">{formatDate(application.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Status</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">
                  {isDraft ? 'Not submitted' : statusLabels[application.status] ?? application.status}
                </dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="workflow-status-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-7">
            <h2 id="workflow-status-heading" className="text-base font-semibold text-[#172033]">Review status</h2>
            {isSyntheticTest && (
              <p role="note" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold leading-6 text-amber-950">
                {SYNTHETIC_POLICY_LABEL}. This test result cannot approve or reject a scholarship application.
              </p>
            )}
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[#64748B]">AI verification</dt>
                <dd className="mt-2">
                  <AiVerificationProgress
                    applicationId={application.id}
                    initialStatus={application.aiVerificationStatus}
                    initialRetryAvailable={canRetryAiVerification}
                    initialReason={getStudentAiReason(
                      application.aiVerificationStatus,
                      application.studentAiReason,
                    )}
                    compact
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Selection outcome</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">{application.selectionDecisions[0]?.outcome.replaceAll('_', ' ') ?? 'Not decided'}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#64748B]">Approval</dt>
                <dd className="mt-1 text-sm font-medium text-[#172033]">{application.approvalDecisions[0]?.status.replaceAll('_', ' ') ?? 'Not pending'}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="document-status-heading" className="rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-7">
            <h2 id="document-status-heading" className="text-base font-semibold text-[#172033]">Required documents</h2>
            <p className="mt-1 text-sm text-[#64748B]">Only saved document metadata is shown; private storage links are not exposed.</p>
            <ul className="mt-4 divide-y divide-[#EEF1F5]">
              {requiredDocumentTypeList.map((type) => {
                const document = documentsByType.get(type);
                const documentStatus = !document
                  ? 'Missing'
                  : documentStatusLabel(document.verificationStatus);

                return (
                  <li key={type} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="text-[#334155]">{getApplicationDocumentLabel(type)}</span>
                    <span className="text-right font-medium text-[#475569]">{documentStatus}</span>
                  </li>
                );
              })}
            </ul>
            {supportingDocuments.length > 0 && (
              <div className="mt-5 border-t border-[#EEF1F5] pt-4">
                <h3 className="text-sm font-semibold text-[#172033]">Other uploaded documents</h3>
                <ul className="mt-2 divide-y divide-[#EEF1F5]">
                  {supportingDocuments.map((document) => (
                    <li key={document.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="min-w-0 break-all text-[#334155]">{document.originalName}</span>
                      <span className="shrink-0 text-right font-medium text-[#475569]">{documentStatusLabel(document.verificationStatus)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {application.aiVerificationStatus === 'INELIGIBLE' &&
            application.aiAttemptCount >= 1 &&
            application.aiAttemptCount <= 3 && (
              <AiCorrectionForm
                applicationId={application.id}
                hasCorrection={hasCorrection}
                requiredDocumentTypes={requiredDocumentTypeList}
              />
            )}

          <nav aria-label="Application actions" className="flex flex-wrap gap-3">
            {isDraft && (
              <Link href={`/student/schemes/${encodeURIComponent(application.scheme.id)}/apply`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#173F7A] px-4 text-sm font-semibold text-white hover:bg-[#123362]">
                Continue draft
              </Link>
            )}
            <Link href="/student/applications" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] bg-white px-4 text-sm font-semibold text-[#334155]">
              Back to My Applications
            </Link>
            <Link href={`/student/schemes/${encodeURIComponent(application.scheme.id)}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DCE3EC] bg-white px-4 text-sm font-semibold text-[#334155]">
              View scheme details
            </Link>
          </nav>
          <p className="text-xs leading-5 text-[#64748B]">
            Workflow activity, selection details, and payment information are not available in the current application record.
          </p>
        </div>
      </main>
    </div>
  );
}
