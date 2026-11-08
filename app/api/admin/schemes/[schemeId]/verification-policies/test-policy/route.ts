import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import { buildDraftPolicyData, isPolicyWriteConflict } from "@/lib/adminScholarshipPolicy";
import {
  validateVerificationPolicyForPublication,
} from "@/lib/scholarshipVerificationPolicy";
import {
  canCreateSyntheticPolicy,
  createSyntheticPolicyInput,
} from "@/lib/syntheticVerificationPolicy";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ schemeId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { schemeId } = await params;
  if (!schemeId || schemeId.length > 120) {
    return NextResponse.json({ error: "Invalid scholarship scheme ID.", code: "INVALID_ID" }, { status: 400 });
  }
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Synthetic policy mode is available only in local development.", code: "SYNTHETIC_MODE_DISABLED" }, { status: 403 });
  }

  const input = createSyntheticPolicyInput();
  const validation = validateVerificationPolicyForPublication(input);
  if (!validation.success) {
    console.error("Synthetic policy fixture validation failed:", validation.errors);
    return NextResponse.json({ error: "The fixed synthetic test policy is invalid.", code: "SYNTHETIC_FIXTURE_INVALID" }, { status: 500 });
  }

  try {
    const policy = await prisma.$transaction(async (transaction) => {
      const scheme = await transaction.scholarshipScheme.findUnique({
        where: { id: schemeId },
        select: { id: true, name: true },
      });
      if (!scheme) return { kind: "not_found" as const };
      if (!canCreateSyntheticPolicy(process.env.NODE_ENV, scheme.name)) {
        return { kind: "scheme_not_test" as const };
      }
      const officialPolicyCount = await transaction.scholarshipVerificationPolicy.count({
        where: { schemeId, isSynthetic: false },
      });
      if (officialPolicyCount > 0) {
        return { kind: "official_policy_exists" as const };
      }
      const existingTestPolicy = await transaction.scholarshipVerificationPolicy.count({
        where: {
          schemeId,
          OR: [
            { status: "DRAFT" },
            { status: "PUBLISHED", isSynthetic: true },
          ],
        },
      });
      if (existingTestPolicy > 0) {
        return { kind: "policy_exists" as const };
      }

      const latest = await transaction.scholarshipVerificationPolicy.aggregate({
        where: { schemeId },
        _max: { version: true },
      });
      return {
        kind: "created" as const,
        policy: await transaction.scholarshipVerificationPolicy.create({
          data: buildDraftPolicyData(
            schemeId,
            (latest._max.version ?? 0) + 1,
            validation.value,
            true,
          ),
          include: { publishedBy: { select: { id: true, fullName: true } } },
        }),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    switch (policy.kind) {
      case "not_found":
        return NextResponse.json({ error: "Scholarship scheme not found.", code: "NOT_FOUND" }, { status: 404 });
      case "scheme_not_test":
        return NextResponse.json({ error: "Synthetic policy mode is limited to explicitly named E2E/test schemes.", code: "SYNTHETIC_SCHEME_REQUIRED" }, { status: 403 });
      case "official_policy_exists":
        return NextResponse.json({ error: "Synthetic policy mode is blocked when this scheme has any official policy draft or published version.", code: "OFFICIAL_POLICY_EXISTS" }, { status: 409 });
      case "policy_exists":
        return NextResponse.json({ error: "A policy draft or published version already exists for this scheme.", code: "POLICY_ALREADY_EXISTS" }, { status: 409 });
      case "created":
        return NextResponse.json({ policy: policy.policy }, { status: 201 });
    }
  } catch (error) {
    if (isPolicyWriteConflict(error)) {
      return NextResponse.json({ error: "A conflicting policy version was created. Refresh and try again.", code: "VERSION_CONFLICT" }, { status: 409 });
    }
    console.error("Synthetic policy draft creation failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to create the synthetic policy draft.", code: "POLICY_CREATE_FAILED" }, { status: 500 });
  }
}
