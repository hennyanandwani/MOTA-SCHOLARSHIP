import { NextResponse } from "next/server";
import {
  AiVerificationJobStatus,
  AiVerificationStatus,
  ManualReviewStatus,
  Prisma,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { buildAiJobIdempotencyKey } from "@/lib/aiVerificationContract";
import { buildAiVerificationJobPolicyData } from "@/lib/scholarshipVerificationPolicy";
import { canCreateSyntheticPolicy } from "@/lib/syntheticVerificationPolicy";

type RouteContext = { params: Promise<{ applicationNumber: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid AI review action is required." }, { status: 400 });
  }
  const input = body as { action?: unknown; reason?: unknown };
  if (input.action !== "retry") {
    return NextResponse.json({ error: "Only a technical retry is supported." }, { status: 400 });
  }
  if (
    typeof input.reason !== "string" ||
    input.reason.trim().length < 3 ||
    input.reason.length > 2000
  ) {
    return NextResponse.json({ error: "A reason is required (3 to 2000 characters)." }, { status: 400 });
  }
  const reason = input.reason.trim();
  const { applicationNumber } = await params;

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const application = await transaction.scholarshipApplication.findUnique({
        where: { applicationNumber },
        select: {
          id: true,
          schemeId: true,
          status: true,
          scheme: { select: { name: true } },
          submittedAt: true,
          aiInputVersion: true,
          aiVerificationStatus: true,
          aiVerificationJobs: {
            orderBy: { inputVersion: "desc" },
            take: 1,
            select: { id: true, inputVersion: true, status: true, outcome: true },
          },
        },
      });
      if (!application) return { kind: "not_found" as const };
      if (!application.submittedAt) return { kind: "not_submitted" as const };

      const latestJob = application.aiVerificationJobs[0];
      const retryAllowed =
        application.aiVerificationStatus === AiVerificationStatus.FAILED &&
        latestJob?.status === AiVerificationJobStatus.FAILED;
      if (!retryAllowed) {
        return { kind: "invalid_state" as const };
      }

      const publishedPolicy = await transaction.scholarshipVerificationPolicy.findFirst({
        where: { schemeId: application.schemeId, status: "PUBLISHED" },
        orderBy: { version: "desc" },
        select: {
          id: true,
          schemeId: true,
          version: true,
          status: true,
          eligibilityCriteria: true,
          requiredDocumentTypes: true,
          aiEligibleDocumentTypes: true,
          officialGuidelineReference: true,
          guidelineRevision: true,
          publishedById: true,
          publishedAt: true,
          isSynthetic: true,
        },
      });
      const policyJobData = buildAiVerificationJobPolicyData(publishedPolicy);
      if (
        policyJobData.isSynthetic &&
        (!canCreateSyntheticPolicy(process.env.NODE_ENV, application.scheme.name) ||
          await transaction.scholarshipVerificationPolicy.count({
            where: { schemeId: application.schemeId, isSynthetic: false },
          }) > 0)
      ) {
        return { kind: "synthetic_blocked" as const };
      }

      const nextVersion = application.aiInputVersion + 1;
      const updated = await transaction.scholarshipApplication.updateMany({
        where: {
          id: application.id,
          aiInputVersion: application.aiInputVersion,
          status: application.status,
        },
        data: {
          aiInputVersion: nextVersion,
          aiVerificationStatus: AiVerificationStatus.WAITING_FOR_CONFIGURATION,
          aiEligibility: null,
          aiExplanation: null,
          studentAiReason: null,
          aiModelVersion: null,
          aiCompletedAt: null,
          manualReviewStatus: ManualReviewStatus.NOT_READY,
        },
      });
      if (updated.count !== 1) return { kind: "conflict" as const };

      const job = await transaction.aiVerificationJob.create({
        data: {
          applicationId: application.id,
          requestedById: auth.user.id,
          requestReason: reason,
          inputVersion: nextVersion,
          idempotencyKey: buildAiJobIdempotencyKey(application.id, nextVersion),
          status: AiVerificationJobStatus.WAITING_FOR_CONFIGURATION,
          ...policyJobData,
        },
        select: { id: true, inputVersion: true, status: true },
      });
      return { kind: "queued" as const, job };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    switch (result.kind) {
      case "not_found":
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
      case "not_submitted":
        return NextResponse.json({ error: "Only submitted applications can be reconsidered." }, { status: 409 });
      case "invalid_state":
        return NextResponse.json({ error: "This AI retry or reconsideration is not allowed from the current state." }, { status: 409 });
      case "synthetic_blocked":
        return NextResponse.json({ error: "Synthetic test policy is unavailable outside an isolated local test scheme.", code: "SYNTHETIC_POLICY_BLOCKED" }, { status: 403 });
      case "conflict":
        return NextResponse.json({ error: "Application changed while the request was being recorded." }, { status: 409 });
      case "queued":
        return NextResponse.json({
          job: result.job,
          message: "Recorded for integration, but the AI service adapter is not configured and no request was sent.",
        }, { status: 202 });
    }
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Application changed while the request was being recorded." }, { status: 409 });
    }
    console.error("AI review request failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to record AI review request." }, { status: 500 });
  }
}
