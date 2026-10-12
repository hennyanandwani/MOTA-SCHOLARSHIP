import { NextResponse } from 'next/server';
import { ApplicationStatus } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

type RouteContext = { params: Promise<{ applicationNumber: string }> };
const reviewableStatuses: ApplicationStatus[] = [
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.PENDING_VERIFICATION,
  ApplicationStatus.FLAGGED_FOR_MANUAL_REVIEW,
  ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
];
const transitions: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  [ApplicationStatus.SUBMITTED]: [
    ApplicationStatus.PENDING_VERIFICATION,
    ApplicationStatus.FLAGGED_FOR_MANUAL_REVIEW,
    ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
    ApplicationStatus.REJECTED_BY_OFFICER,
  ],
  [ApplicationStatus.PENDING_VERIFICATION]: [
    ApplicationStatus.FLAGGED_FOR_MANUAL_REVIEW,
    ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
    ApplicationStatus.REJECTED_BY_OFFICER,
  ],
  [ApplicationStatus.FLAGGED_FOR_MANUAL_REVIEW]: [
    ApplicationStatus.PENDING_VERIFICATION,
    ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
    ApplicationStatus.REJECTED_BY_OFFICER,
  ],
  [ApplicationStatus.RECOMMENDED_FOR_APPROVAL]: [
    ApplicationStatus.APPROVED_BY_OFFICER,
    ApplicationStatus.REJECTED_BY_OFFICER,
  ],
};

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
  if (!reviewableStatuses.includes(nextStatus) &&
      nextStatus !== ApplicationStatus.APPROVED_BY_OFFICER &&
      nextStatus !== ApplicationStatus.REJECTED_BY_OFFICER) {
    return NextResponse.json({ error: 'This status is not a review decision.' }, { status: 400 });
  }

  const { applicationNumber } = await params;
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const application = await transaction.scholarshipApplication.findUnique({
        where: { applicationNumber },
        select: { id: true, status: true },
      });
      if (!application) return { error: 'Application not found.', statusCode: 404 as const };
      if (!transitions[application.status]?.includes(nextStatus)) {
        return { error: "This decision is not allowed from the application's current status.", statusCode: 409 as const };
      }

      const update = await transaction.scholarshipApplication.updateMany({
        where: { id: application.id, status: application.status },
        data: { status: nextStatus },
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
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }
    return NextResponse.json({ status: result.status });
  } catch (error) {
    console.error('Admin application decision failed:', error instanceof Error ? error.name : 'Unknown error');
    return NextResponse.json({ error: 'Unable to save the application decision.' }, { status: 500 });
  }
}
