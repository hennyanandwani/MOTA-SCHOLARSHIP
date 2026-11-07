import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import {
  buildPublishedPolicyData,
  isPolicyWriteConflict,
} from "@/lib/adminScholarshipPolicy";
import { validateVerificationPolicyForPublication } from "@/lib/scholarshipVerificationPolicy";
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
      const current = await transaction.scholarshipVerificationPolicy.findFirst({
        where: { id: policyId, schemeId },
      });
      if (!current) return { kind: "not_found" as const };
      if (current.status !== "DRAFT") return { kind: "immutable" as const };

      const validation = validateVerificationPolicyForPublication({
        eligibilityCriteria: current.eligibilityCriteria,
        requiredDocumentTypes: current.requiredDocumentTypes,
        aiEligibleDocumentTypes: current.aiEligibleDocumentTypes,
        officialGuidelineReference: current.officialGuidelineReference,
        guidelineRevision: current.guidelineRevision,
      });
      if (!validation.success) {
        return { kind: "invalid" as const, errors: validation.errors };
      }

      const updated = await transaction.scholarshipVerificationPolicy.updateMany({
        where: { id: policyId, schemeId, status: "DRAFT" },
        data: buildPublishedPolicyData(
          validation.value,
          auth.user.id,
          new Date(),
        ),
      });
      if (updated.count !== 1) return { kind: "conflict" as const };

      const policy = await transaction.scholarshipVerificationPolicy.findUnique({
        where: { id: policyId },
        include: { publishedBy: { select: { id: true, fullName: true } } },
      });
      return policy
        ? { kind: "published" as const, policy }
        : { kind: "not_found" as const };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    switch (result.kind) {
      case "not_found":
        return NextResponse.json({ error: "Scholarship policy not found.", code: "NOT_FOUND" }, { status: 404 });
      case "immutable":
        return NextResponse.json({ error: "Published policies are immutable.", code: "POLICY_IMMUTABLE" }, { status: 409 });
      case "invalid":
        return NextResponse.json({ error: "Policy cannot be published until all criteria and document settings are valid.", code: "POLICY_INVALID", details: result.errors }, { status: 400 });
      case "conflict":
        return NextResponse.json({ error: "The policy changed concurrently. Refresh and try again.", code: "POLICY_CONFLICT" }, { status: 409 });
      case "published":
        return NextResponse.json({ policy: result.policy });
    }
  } catch (error) {
    if (isPolicyWriteConflict(error)) {
      return NextResponse.json({ error: "The policy changed concurrently. Refresh and try again.", code: "POLICY_CONFLICT" }, { status: 409 });
    }
    console.error("Admin scholarship policy publication failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to publish the policy.", code: "POLICY_PUBLISH_FAILED" }, { status: 500 });
  }
}
