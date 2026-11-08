import { NextResponse } from "next/server";
import {
  AiVerificationJobStatus,
  AiVerificationStatus,
  ApplicationStatus,
  ManualReviewStatus,
  Prisma,
} from "@/lib/generated/prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import { buildAiJobIdempotencyKey } from "@/lib/aiVerificationContract";
import {
  validateReevaluationDocuments,
} from "@/lib/aiVerificationReevaluation";
import { projectApplicationDataForCriteria } from "@/lib/aiVerificationDispatcherCore";
import { prisma } from "@/lib/prisma";
import {
  buildAiVerificationJobPolicyData,
  isVerificationDocumentType,
} from "@/lib/scholarshipVerificationPolicy";
import {
  canCreateSyntheticPolicy,
} from "@/lib/syntheticVerificationPolicy";

type RouteContext = { params: Promise<{ applicationNumber: string }> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (
    !isRecord(body) ||
    Object.keys(body).some((key) =>
      !["policyId", "expectedInputVersion", "reason", "documentVersions"].includes(key),
    ) ||
    typeof body.policyId !== "string" ||
    !body.policyId ||
    typeof body.expectedInputVersion !== "number" ||
    !Number.isSafeInteger(body.expectedInputVersion) ||
    body.expectedInputVersion < 1 ||
    typeof body.reason !== "string" ||
    body.reason.trim().length < 3 ||
    body.reason.length > 2000 ||
    !Array.isArray(body.documentVersions)
  ) {
    return NextResponse.json({ error: "A policy version, current input version, reason, and document versions are required." }, { status: 400 });
  }
  const policyId = body.policyId;
  const expectedInputVersion = body.expectedInputVersion;
  const reason = body.reason.trim();
  const documentVersions = body.documentVersions;

  const { applicationNumber } = await params;
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const application = await transaction.scholarshipApplication.findUnique({
        where: { applicationNumber },
        select: {
          id: true,
          schemeId: true,
          status: true,
          submittedAt: true,
          aiInputVersion: true,
          aiVerificationStatus: true,
          formData: true,
          scheme: { select: { name: true } },
          documents: {
            select: { id: true, type: true, mimeType: true, sizeBytes: true, updatedAt: true },
            orderBy: { id: "asc" },
          },
        },
      });
      if (!application) return { kind: "not_found" as const };
      if (
        !application.submittedAt ||
        application.status !== ApplicationStatus.SUBMITTED
      ) {
        return { kind: "not_submitted" as const };
      }
      if (application.aiInputVersion !== expectedInputVersion) {
        return { kind: "input_conflict" as const };
      }
      if (
        application.aiVerificationStatus !== AiVerificationStatus.WAITING_FOR_CONFIGURATION &&
        application.aiVerificationStatus !== AiVerificationStatus.FAILED
      ) {
        return { kind: "invalid_state" as const };
      }

      const currentJobs = await transaction.aiVerificationJob.findMany({
        where: {
          applicationId: application.id,
          inputVersion: application.aiInputVersion,
        },
        select: { status: true },
        take: 2,
      });
      if (currentJobs.some((job) => job.status === AiVerificationJobStatus.PROCESSING)) {
        return { kind: "processing" as const };
      }
      if (
        currentJobs.length !== 1 ||
        (currentJobs[0].status !== AiVerificationJobStatus.WAITING_FOR_CONFIGURATION &&
          currentJobs[0].status !== AiVerificationJobStatus.FAILED)
      ) {
        return { kind: "invalid_state" as const };
      }

      const policy = await transaction.scholarshipVerificationPolicy.findFirst({
        where: {
          id: policyId,
          schemeId: application.schemeId,
          status: "PUBLISHED",
        },
      });
      if (!policy) return { kind: "policy_invalid" as const };
      if (
        policy.requiredDocumentTypes.some((type) => !isVerificationDocumentType(type)) ||
        policy.aiEligibleDocumentTypes.some((type) => !isVerificationDocumentType(type))
      ) {
        return { kind: "policy_invalid" as const };
      }
      const requiredDocumentTypes = policy.requiredDocumentTypes.filter(isVerificationDocumentType);
      const aiEligibleDocumentTypes = policy.aiEligibleDocumentTypes.filter(isVerificationDocumentType);
      if (
        policy.isSynthetic &&
        !canCreateSyntheticPolicy(process.env.NODE_ENV, application.scheme.name)
      ) {
        return { kind: "synthetic_blocked" as const };
      }
      if (
        policy.isSynthetic &&
        await transaction.scholarshipVerificationPolicy.count({
          where: {
            schemeId: application.schemeId,
            isSynthetic: false,
          },
        }) > 0
      ) {
        return { kind: "official_policy_exists" as const };
      }

      const documentValidation = validateReevaluationDocuments({
        documents: application.documents,
        expectedVersions: documentVersions,
        requiredDocumentTypes,
        aiEligibleDocumentTypes,
      });
      if (!documentValidation.success) {
        return { kind: "documents_invalid" as const, code: documentValidation.code };
      }
      const policyJobData = buildAiVerificationJobPolicyData(policy);
      if (!policyJobData.policySnapshot) {
        return { kind: "policy_invalid" as const };
      }
      try {
        projectApplicationDataForCriteria(
          application.formData,
          policyJobData.policySnapshot,
        );
      } catch {
        return { kind: "criterion_data_missing" as const };
      }

      const nextVersion = application.aiInputVersion + 1;
      const updated = await transaction.scholarshipApplication.updateMany({
        where: {
          id: application.id,
          status: ApplicationStatus.SUBMITTED,
          submittedAt: { not: null },
          aiInputVersion: application.aiInputVersion,
          aiVerificationStatus: application.aiVerificationStatus,
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
      if (updated.count !== 1) return { kind: "input_conflict" as const };

      const job = await transaction.aiVerificationJob.create({
        data: {
          applicationId: application.id,
          requestedById: auth.user.id,
          requestReason: reason,
          inputVersion: nextVersion,
          idempotencyKey: buildAiJobIdempotencyKey(application.id, nextVersion),
          status: AiVerificationJobStatus.WAITING_FOR_CONFIGURATION,
          isSynthetic: policy.isSynthetic,
          documentSnapshot: documentValidation.documentSnapshot as Prisma.InputJsonValue,
          ...policyJobData,
        },
        select: {
          id: true,
          inputVersion: true,
          status: true,
          policyId: true,
          isSynthetic: true,
          createdAt: true,
        },
      });
      return { kind: "created" as const, job, selectedDocumentIds: documentValidation.selectedDocumentIds };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    switch (result.kind) {
      case "not_found":
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
      case "not_submitted":
        return NextResponse.json({ error: "Only submitted applications can be re-evaluated." }, { status: 409 });
      case "input_conflict":
        return NextResponse.json({ error: "The application changed. Reload before re-evaluating.", code: "INPUT_VERSION_CONFLICT" }, { status: 409 });
      case "invalid_state":
        return NextResponse.json({ error: "Only an unprocessed or technically failed verification can be re-evaluated.", code: "REEVALUATION_STATE_INVALID" }, { status: 409 });
      case "processing":
        return NextResponse.json({ error: "This application is already being processed.", code: "ALREADY_PROCESSING" }, { status: 409 });
      case "policy_invalid":
        return NextResponse.json({ error: "Select a published policy version for this application's scheme.", code: "POLICY_VERSION_INVALID" }, { status: 409 });
      case "synthetic_blocked":
        return NextResponse.json({ error: "Synthetic policy re-evaluation is restricted to local development E2E/test schemes.", code: "SYNTHETIC_POLICY_BLOCKED" }, { status: 403 });
      case "official_policy_exists":
        return NextResponse.json({ error: "Synthetic policy cannot be used when an official policy draft or published version exists.", code: "OFFICIAL_POLICY_EXISTS" }, { status: 409 });
      case "documents_invalid":
        return NextResponse.json({ error: "The application documents are stale, incomplete, duplicated, or unsupported for the selected policy.", code: result.code }, { status: 409 });
      case "criterion_data_missing":
        return NextResponse.json({ error: "The application is missing data required by this policy's criteria.", code: "CRITERION_DATA_MISSING" }, { status: 409 });
      case "created":
        return NextResponse.json({
          job: result.job,
          selectedDocumentIds: result.selectedDocumentIds,
          message: "A version-bound AI re-evaluation job was recorded. No AI request was sent.",
        }, { status: 202 });
    }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      return NextResponse.json({ error: "A concurrent re-evaluation changed this application. Reload and try again.", code: "REEVALUATION_CONFLICT" }, { status: 409 });
    }
    console.error("AI re-evaluation request failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to record the re-evaluation request." }, { status: 500 });
  }
}
