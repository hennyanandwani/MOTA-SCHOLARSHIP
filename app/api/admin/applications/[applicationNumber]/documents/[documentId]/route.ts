import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { ApplicationStatus, Prisma, VerificationStatus } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { requireEnvironmentVariable } from '@/lib/env';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import {
  getAllowedDocumentVerificationTransitions,
  isAiOutcomeAvailableForManualReview,
  isApplicationDocumentReviewable,
  isSerializableAdminWorkflowConflict,
} from '@/lib/adminWorkflow';

type RouteContext = {
  params: Promise<{ applicationNumber: string; documentId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { applicationNumber, documentId } = await params;
  try {
    const application = await prisma.scholarshipApplication.findUnique({
      where: { applicationNumber },
      select: { id: true },
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    const document = await prisma.applicationDocument.findFirst({
      where: { id: documentId, applicationId: application.id },
      select: { storagePath: true, originalName: true },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    let supabaseUrl: string;
    let supabaseSecret: string;
    try {
      ({ url: supabaseUrl } = getSupabasePublicConfig());
      supabaseSecret = requireEnvironmentVariable(
        'SUPABASE_SECRET_KEY',
        process.env.SUPABASE_SECRET_KEY,
      );
    } catch (configurationError) {
      console.error(
        'Admin document storage configuration is invalid:',
        configurationError instanceof Error ? configurationError.message : 'Unknown error',
      );
      return NextResponse.json({ error: 'Server storage configuration is missing.' }, { status: 500 });
    }
    const supabase = createSupabaseClient(supabaseUrl, supabaseSecret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await supabase.storage
      .from('scholarship-documents')
      .createSignedUrl(document.storagePath, 60, { download: document.originalName });
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Unable to authorize document access.' }, { status: 502 });
    }

    return NextResponse.redirect(data.signedUrl, 302);
  } catch (error) {
    console.error('Admin document access failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Unable to open document.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { applicationNumber, documentId } = await params;
  if (!applicationNumber || applicationNumber.length > 120 || !documentId || documentId.length > 120) {
    return NextResponse.json({ error: 'Invalid application or document ID.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'A valid document review is required.' }, { status: 400 });
  }

  const input = body as {
    status?: unknown;
    expectedStatus?: unknown;
    remarks?: unknown;
  };
  const statuses = Object.values(VerificationStatus) as string[];
  if (
    typeof input.status !== 'string' ||
    !statuses.includes(input.status) ||
    typeof input.expectedStatus !== 'string' ||
    !statuses.includes(input.expectedStatus)
  ) {
    return NextResponse.json({ error: 'A supported verification status and current status are required.' }, { status: 400 });
  }
  if (input.remarks !== undefined && typeof input.remarks !== 'string') {
    return NextResponse.json({ error: 'Verification remarks must be text.' }, { status: 400 });
  }
  const remarks = typeof input.remarks === 'string' ? input.remarks.trim() : '';
  if (remarks.length > 2000) {
    return NextResponse.json({ error: 'Verification remarks cannot exceed 2000 characters.' }, { status: 400 });
  }

  const nextStatus = input.status as VerificationStatus;
  const expectedStatus = input.expectedStatus as VerificationStatus;
  if (
    (nextStatus === VerificationStatus.FLAGGED || nextStatus === VerificationStatus.REJECTED) &&
    remarks.length < 3
  ) {
    return NextResponse.json(
      { error: 'Remarks of at least 3 characters are required when flagging or rejecting a document.' },
      { status: 422 },
    );
  }
  if (!getAllowedDocumentVerificationTransitions(expectedStatus).includes(nextStatus)) {
    return NextResponse.json({ error: 'This document verification transition is not allowed.' }, { status: 409 });
  }

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
          manualReviewStatus: true,
        },
      });
      if (!application) return { kind: 'application_not_found' as const };

      const document = await transaction.applicationDocument.findFirst({
        where: { id: documentId, applicationId: application.id },
        select: { id: true, verificationStatus: true },
      });
      if (!document) return { kind: 'document_not_found' as const };
      if (
        application.status === ApplicationStatus.DRAFT ||
        !application.submittedAt ||
        !isApplicationDocumentReviewable(application.status) ||
        !isAiOutcomeAvailableForManualReview(
          application.aiVerificationStatus,
          application.aiAttemptCount,
        ) ||
        !["PENDING", "IN_PROGRESS", "NEEDS_ATTENTION"].includes(application.manualReviewStatus)
      ) {
        return { kind: 'application_not_reviewable' as const };
      }
      if (document.verificationStatus !== expectedStatus) {
        return { kind: 'stale_document' as const };
      }

      const update = await transaction.applicationDocument.updateMany({
        where: {
          id: documentId,
          applicationId: application.id,
          verificationStatus: expectedStatus,
          application: {
            is: {
              status: {
                in: [
                  ApplicationStatus.SUBMITTED,
                  ApplicationStatus.PENDING_VERIFICATION,
                  ApplicationStatus.FLAGGED_FOR_MANUAL_REVIEW,
                ],
              },
              submittedAt: { not: null },
            },
          },
        },
        data: {
          verificationStatus: nextStatus,
          verificationRemarks: remarks || null,
        },
      });
      if (update.count !== 1) return { kind: 'stale_document' as const };

      await transaction.applicationDocumentVerificationEvent.create({
        data: {
          applicationId: application.id,
          documentId: document.id,
          actorType: "ADMIN",
          reviewerId: auth.user.id,
          previousStatus: expectedStatus,
          newStatus: nextStatus,
          remarks: remarks || null,
        },
      });
      await transaction.scholarshipApplication.updateMany({
        where: {
          id: application.id,
          aiVerificationStatus: application.aiVerificationStatus,
          aiAttemptCount: application.aiAttemptCount,
          manualReviewStatus: { in: ["PENDING", "IN_PROGRESS", "NEEDS_ATTENTION"] },
        },
        data: { manualReviewStatus: "IN_PROGRESS" },
      });

      return {
        kind: 'updated' as const,
        document: await transaction.applicationDocument.findUniqueOrThrow({
          where: { id: documentId },
          select: {
            id: true,
            type: true,
            originalName: true,
            verificationStatus: true,
            verificationRemarks: true,
            updatedAt: true,
          },
        }),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    switch (result.kind) {
      case 'application_not_found':
        return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
      case 'document_not_found':
        return NextResponse.json({ error: 'Document not found for this application.' }, { status: 404 });
      case 'application_not_reviewable':
        return NextResponse.json({ error: 'Only submitted applications in active review can have documents verified.' }, { status: 409 });
      case 'stale_document':
        return NextResponse.json({ error: 'The document changed during review. Reload and try again.' }, { status: 409 });
      case 'updated':
        return NextResponse.json({
          document: {
            ...result.document,
            updatedAt: result.document.updatedAt.toISOString(),
          },
        });
    }
  } catch (error) {
    if (isSerializableAdminWorkflowConflict(error)) {
      return NextResponse.json(
        { error: 'The document changed during review. Reload and try again.' },
        { status: 409 },
      );
    }
    console.error('Admin document verification failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Unable to save document verification.' }, { status: 500 });
  }
}
