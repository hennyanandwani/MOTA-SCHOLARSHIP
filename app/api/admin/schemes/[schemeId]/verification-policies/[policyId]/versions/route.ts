import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import {
  buildNewDraftVersionData,
  isPolicyWriteConflict,
  parsePolicyMutation,
} from "@/lib/adminScholarshipPolicy";
import type {
  ScholarshipVerificationPolicyRecord,
  VerificationDocumentType,
} from "@/lib/scholarshipVerificationPolicy";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ schemeId: string; policyId: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { schemeId, policyId } = await params;
  if (
    !schemeId ||
    schemeId.length > 120 ||
    !policyId ||
    policyId.length > 120
  ) {
    return NextResponse.json({ error: "Invalid scheme or policy ID.", code: "INVALID_ID" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const source = await transaction.scholarshipVerificationPolicy.findFirst({
        where: { id: policyId, schemeId },
      });
      if (!source) return { kind: "not_found" as const };
      if (source.status !== "PUBLISHED") {
        return { kind: "not_published" as const };
      }

      const validation = parsePolicyMutation({
        eligibilityCriteria: source.eligibilityCriteria,
        requiredDocumentTypes: source.requiredDocumentTypes,
        aiEligibleDocumentTypes: source.aiEligibleDocumentTypes,
        officialGuidelineReference: source.officialGuidelineReference,
        guidelineRevision: source.guidelineRevision,
      }, true);
      if (!validation.success) {
        return { kind: "invalid_source" as const };
      }

      const latest = await transaction.scholarshipVerificationPolicy.aggregate({
        where: { schemeId },
        _max: { version: true },
      });
      const sourceRecord: ScholarshipVerificationPolicyRecord = {
        id: source.id,
        schemeId: source.schemeId,
        version: source.version,
        status: "PUBLISHED",
        eligibilityCriteria: validation.value.eligibilityCriteria,
        requiredDocumentTypes:
          validation.value.requiredDocumentTypes as VerificationDocumentType[],
        aiEligibleDocumentTypes:
          validation.value.aiEligibleDocumentTypes as VerificationDocumentType[],
        officialGuidelineReference: validation.value.officialGuidelineReference,
        guidelineRevision: validation.value.guidelineRevision,
        publishedById: source.publishedById,
        publishedAt: source.publishedAt,
      };
      const draftData = buildNewDraftVersionData(
        sourceRecord,
        (latest._max.version ?? 0) + 1,
      );
      const draft = await transaction.scholarshipVerificationPolicy.create({
        data: {
          ...draftData,
          schemeId,
          status: "DRAFT",
          publishedById: null,
          publishedAt: null,
          eligibilityCriteria:
            draftData.eligibilityCriteria as Prisma.InputJsonValue,
        },
        include: { publishedBy: { select: { id: true, fullName: true } } },
      });
      return { kind: "created" as const, policy: draft };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    switch (result.kind) {
      case "not_found":
        return NextResponse.json({ error: "Scholarship policy not found.", code: "NOT_FOUND" }, { status: 404 });
      case "not_published":
        return NextResponse.json({ error: "A new draft version can only be created from a published policy.", code: "SOURCE_NOT_PUBLISHED" }, { status: 409 });
      case "invalid_source":
        return NextResponse.json({ error: "The published policy is invalid and cannot be copied.", code: "POLICY_INVALID" }, { status: 409 });
      case "created":
        return NextResponse.json({ policy: result.policy }, { status: 201 });
    }
  } catch (error) {
    if (isPolicyWriteConflict(error)) {
      return NextResponse.json({ error: "A conflicting policy version was created. Refresh and try again.", code: "VERSION_CONFLICT" }, { status: 409 });
    }
    console.error("Admin scholarship policy version creation failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to create a new policy version.", code: "POLICY_VERSION_FAILED" }, { status: 500 });
  }
}
