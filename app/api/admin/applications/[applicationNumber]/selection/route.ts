import { NextResponse } from "next/server";
import {
  AiVerificationStatus,
  ApplicationStatus,
  ManualReviewStatus,
  Prisma,
  SelectionOutcome,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { syntheticDecisionBlocked } from "@/lib/syntheticVerificationPolicy";
import { requireAdmin } from "@/lib/adminAuth";
import { getRequiredDocumentTypesFromPolicySnapshot } from "@/lib/applicationRequirements";
import { getSelectionTransitionFailure } from "@/lib/phase6Workflow";

type RouteContext = { params: Promise<{ applicationNumber: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid selection decision is required." }, { status: 400 });
  }

  const input = body as {
    outcome?: unknown;
    expectedOutcome?: unknown;
    remarks?: unknown;
  };
  const outcomes = Object.values(SelectionOutcome) as string[];
  if (
    typeof input.outcome !== "string" ||
    !outcomes.includes(input.outcome) ||
    !(input.expectedOutcome === null ||
      (typeof input.expectedOutcome === "string" && outcomes.includes(input.expectedOutcome)))
  ) {
    return NextResponse.json({ error: "A supported selection outcome and expected current outcome are required." }, { status: 400 });
  }
  if (
    typeof input.remarks !== "string" ||
    input.remarks.trim().length < 3 ||
    input.remarks.length > 2000
  ) {
    return NextResponse.json({ error: "Selection remarks are required (3 to 2000 characters)." }, { status: 400 });
  }
  const remarks = input.remarks.trim();

  const { applicationNumber } = await params;
  const nextOutcome = input.outcome as SelectionOutcome;
  const expectedOutcome = input.expectedOutcome as SelectionOutcome | null;
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
          aiInputVersion: true,
          aiVerificationJobs: {
            orderBy: { inputVersion: "desc" },
            take: 1,
            select: { inputVersion: true, isSynthetic: true, policySnapshot: true },
          },
          documents: { select: { type: true, verificationStatus: true } },
          selectionDecisions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { outcome: true },
          },
          approvalDecisions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true },
          },
        },
      });
      if (!application) return { kind: "not_found" as const };
      const latestJob = application.aiVerificationJobs[0];
      const requiredDocumentTypes = getRequiredDocumentTypesFromPolicySnapshot(
        latestJob?.inputVersion === application.aiInputVersion
          ? latestJob.policySnapshot
          : null,
      );
      if (
        application.aiVerificationJobs[0]?.inputVersion === application.aiInputVersion &&
        syntheticDecisionBlocked(
          application.aiVerificationJobs[0]?.isSynthetic ||
          application.aiVerificationJobs[0]?.policySnapshot,
        )
      ) {
        return { kind: "invalid" as const, error: "Synthetic test policies cannot progress to scholarship selection." };
      }

      const currentOutcome = application.selectionDecisions[0]?.outcome ?? null;
      const currentApproval = application.approvalDecisions[0]?.status ?? null;
      const failure = getSelectionTransitionFailure({
        applicationStatus: application.status,
        submittedAt: application.submittedAt,
        aiStatus: application.aiVerificationStatus as AiVerificationStatus,
        aiAttemptCount: application.aiAttemptCount,
        manualReviewStatus: application.manualReviewStatus as ManualReviewStatus,
        documents: application.documents,
        requiredDocumentTypes,
        currentOutcome,
        expectedOutcome,
        nextOutcome,
        currentApproval,
      });
      if (failure) return { kind: "invalid" as const, error: failure };

      const lock = await transaction.scholarshipApplication.updateMany({
        where: {
          id: application.id,
          status: ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
          aiInputVersion: application.aiInputVersion,
        },
        data: { updatedAt: new Date() },
      });
      if (lock.count !== 1) return { kind: "conflict" as const };

      await transaction.applicationSelectionDecision.create({
        data: {
          applicationId: application.id,
          outcome: nextOutcome,
          priority: null,
          remarks,
          reviewerId: auth.user.id,
        },
      });
      if (nextOutcome === SelectionOutcome.SELECTED) {
        await transaction.applicationApprovalDecision.create({
          data: {
            applicationId: application.id,
            status: "PENDING_APPROVAL",
            remarks: "Selection recorded; awaiting a separately authorized approver.",
            actorType: "SYSTEM",
          },
        });
      }
      return { kind: "saved" as const };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    switch (result.kind) {
      case "not_found":
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
      case "invalid":
        return NextResponse.json({ error: result.error }, { status: 409 });
      case "conflict":
        return NextResponse.json({ error: "Application changed during selection. Reload and retry." }, { status: 409 });
      case "saved":
        return NextResponse.json({ outcome: nextOutcome });
    }
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Application changed during selection. Reload and retry." }, { status: 409 });
    }
    console.error("Admin selection decision failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to save selection decision." }, { status: 500 });
  }
}
