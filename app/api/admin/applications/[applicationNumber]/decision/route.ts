import { NextResponse } from 'next/server';
import { ApplicationStatus, Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { syntheticDecisionBlocked } from '@/lib/syntheticVerificationPolicy';
import { getRequiredDocumentTypesFromPolicySnapshot } from '@/lib/applicationRequirements';
import { requireAdmin } from '@/lib/adminAuth';
import {
  getApplicationDecisionFailure,
  getMissingVerifiedDocumentTypes,
  isAiOutcomeAvailableForManualReview,
} from '@/lib/adminWorkflow';

type RouteContext = { params: Promise<{ applicationNumber: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const user = auth.user;

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'A valid decision request is required.' }, { status: 400 });
  }
  const { status, officer_remarks: officerRemarks } = body as {
    status?: unknown;
    officer_remarks?: unknown;
  };
  const validStatuses = Object.values(ApplicationStatus) as string[];
  if (typeof status !== 'string' || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'A supported application status is required.' }, { status: 400 });
  }
  if (typeof officerRemarks !== 'string' || officerRemarks.trim().length < 3 || officerRemarks.length > 2000) {
    return NextResponse.json(
      { error: 'Officer remarks are required (3 to 2000 characters).' },
      { status: 400 },
    );
  }
  const nextStatus = status as ApplicationStatus;

  const { applicationNumber } = await params;
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const application = await transaction.scholarshipApplication.findUnique({
        where: { applicationNumber },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          aiVerificationStatus: true,
          aiAttemptCount: true,
          aiInputVersion: true,
          manualReviewStatus: true,
          aiVerificationJobs: {
            orderBy: { inputVersion: 'desc' },
            take: 1,
            select: { inputVersion: true, isSynthetic: true, policySnapshot: true },
          },
          documents: {
            select: { type: true, verificationStatus: true },
          },
        },
      });
      if (!application) return { error: 'Application not found.', statusCode: 404 as const };
      const latestJob = application.aiVerificationJobs[0];
      const requiredDocumentTypes = getRequiredDocumentTypesFromPolicySnapshot(
        latestJob?.inputVersion === application.aiInputVersion
          ? latestJob.policySnapshot
          : null,
      );
      if (!application.submittedAt) {
        return { error: 'Only submitted applications can receive review decisions.', statusCode: 409 as const };
      }
      if (
        application.aiVerificationJobs[0]?.inputVersion === application.aiInputVersion &&
        syntheticDecisionBlocked(
          application.aiVerificationJobs[0]?.isSynthetic ||
          application.aiVerificationJobs[0]?.policySnapshot,
        )
      ) {
        return { error: 'Synthetic test policies cannot authorize scholarship decisions.', statusCode: 409 as const };
      }
      if (
        !isAiOutcomeAvailableForManualReview(
          application.aiVerificationStatus,
          application.aiAttemptCount,
        ) ||
        !['PENDING', 'IN_PROGRESS', 'NEEDS_ATTENTION'].includes(application.manualReviewStatus)
      ) {
        return { error: 'Only AI-eligible applications in manual review can receive Admin decisions.', statusCode: 409 as const };
      }

      const failure = getApplicationDecisionFailure(
        application.status,
        nextStatus,
        application.documents,
        requiredDocumentTypes,
      );
      if (failure === 'documents_not_verified') {
        return {
          error: 'Verify all required documents before recommending or approving this application.',
          statusCode: 422 as const,
          validationErrors: getMissingVerifiedDocumentTypes(
            application.documents,
            requiredDocumentTypes,
          ),
        };
      }
      if (failure) {
        return { error: "This decision is not allowed from the application's current status.", statusCode: 409 as const };
      }

      const update = await transaction.scholarshipApplication.updateMany({
        where: {
          id: application.id,
          status: application.status,
          aiVerificationStatus: 'ELIGIBLE',
          submittedAt: { not: null },
        },
        data: {
          status: nextStatus,
          manualReviewStatus:
            nextStatus === ApplicationStatus.RECOMMENDED_FOR_APPROVAL
              ? 'VERIFIED'
              : nextStatus === ApplicationStatus.REJECTED_BY_OFFICER
                ? 'REJECTED'
                : nextStatus === ApplicationStatus.FLAGGED_FOR_MANUAL_REVIEW
                  ? 'NEEDS_ATTENTION'
                  : 'IN_PROGRESS',
        },
      });
      if (update.count !== 1) {
        return { error: 'The application changed during review. Reload and try again.', statusCode: 409 as const };
      }
      await transaction.applicationDecision.create({
        data: {
          applicationId: application.id,
          officerId: user.id,
          status: nextStatus,
          officerRemarks: officerRemarks.trim(),
        },
      });
      return { status: nextStatus };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, ...('validationErrors' in result ? { validationErrors: result.validationErrors } : {}) },
        { status: result.statusCode },
      );
    }
    return NextResponse.json({ status: result.status });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2034'
    ) {
      return NextResponse.json(
        { error: 'The application changed during review. Reload and try again.' },
        { status: 409 },
      );
    }
    console.error('Admin application decision failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Unable to save the application decision.' }, { status: 500 });
  }
}
