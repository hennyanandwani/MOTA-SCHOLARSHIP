import { NextResponse } from "next/server";
import {
  AiVerificationStatus,
  ApplicationApprovalActorType,
  ApplicationStatus,
  ApprovalStatus,
  ManualReviewStatus,
  Prisma,
  SelectionOutcome,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { syntheticDecisionBlocked } from "@/lib/syntheticVerificationPolicy";
import { requireApprover } from "@/lib/approverAuth";
import { isAiOutcomeAvailableForManualReview } from "@/lib/adminWorkflow";
import { getRequiredDocumentTypesFromPolicySnapshot } from "@/lib/applicationRequirements";
import { canTransitionApproval } from "@/lib/phase6Workflow";

type RouteContext = { params: Promise<{ applicationNumber: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireApprover();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid approval decision is required." }, { status: 400 });
  }
  const input = body as {
    status?: unknown;
    expectedStatus?: unknown;
    remarks?: unknown;
  };
  const allowedStatuses = Object.values(ApprovalStatus) as string[];
  if (
    typeof input.status !== "string" ||
    !allowedStatuses.includes(input.status) ||
    typeof input.expectedStatus !== "string" ||
    !allowedStatuses.includes(input.expectedStatus)
  ) {
    return NextResponse.json({ error: "A supported approval status and expected current status are required." }, { status: 400 });
  }
  if (
    typeof input.remarks !== "string" ||
    input.remarks.trim().length < 3 ||
    input.remarks.length > 2000
  ) {
    return NextResponse.json({ error: "Approval remarks are required (3 to 2000 characters)." }, { status: 400 });
  }
  const nextStatus = input.status as ApprovalStatus;
  const expectedStatus = input.expectedStatus as ApprovalStatus;
  const remarks = input.remarks.trim();
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
        return { kind: "prerequisites" as const };
      }
      if (!application.submittedAt || application.status !== ApplicationStatus.RECOMMENDED_FOR_APPROVAL) {
        return { kind: "not_reviewable" as const };
      }
      if (
        !isAiOutcomeAvailableForManualReview(
          application.aiVerificationStatus,
          application.aiAttemptCount,
        ) ||
        application.manualReviewStatus !== ManualReviewStatus.VERIFIED ||
        application.selectionDecisions[0]?.outcome !== SelectionOutcome.SELECTED
      ) {
        return { kind: "prerequisites" as const };
      }
      if (
        requiredDocumentTypes.some(
          (type) =>
            !application.documents.some(
              (document) =>
                document.type === type && document.verificationStatus === "VERIFIED",
            ),
        ) ||
        application.documents.some((document) => document.verificationStatus !== "VERIFIED")
      ) {
        return { kind: "prerequisites" as const };
      }

      const currentStatus = application.approvalDecisions[0]?.status;
      if (
        !currentStatus ||
        currentStatus !== expectedStatus ||
        !canTransitionApproval(currentStatus, nextStatus)
      ) {
        return { kind: "invalid_transition" as const };
      }

      const lock = await transaction.scholarshipApplication.updateMany({
        where: {
          id: application.id,
          status: ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
          aiInputVersion: application.aiInputVersion,
        },
        data: { updatedAt: new Date() },
      });
      if (lock.count !== 1) return { kind: "conflict" as const };

      await transaction.applicationApprovalDecision.create({
        data: {
          applicationId: application.id,
          status: nextStatus,
          remarks,
          actorType: ApplicationApprovalActorType.APPROVER,
          actorId: auth.user.id,
        },
      });
      return { kind: "saved" as const };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    switch (result.kind) {
      case "not_found":
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
      case "not_reviewable":
        return NextResponse.json({ error: "Only submitted, manually verified recommendations can be approved." }, { status: 409 });
      case "prerequisites":
        return NextResponse.json({ error: "AI eligibility, complete manual verification, verified documents, and Selected outcome are required." }, { status: 409 });
      case "invalid_transition":
        return NextResponse.json({ error: "Approval status changed or this transition is not allowed." }, { status: 409 });
      case "conflict":
        return NextResponse.json({ error: "Application changed during approval. Reload and retry." }, { status: 409 });
      case "saved":
        return NextResponse.json({ status: nextStatus });
    }
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Application changed during approval. Reload and retry." }, { status: 409 });
    }
    console.error("Approver decision failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to save approval decision." }, { status: 500 });
  }
}
