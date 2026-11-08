import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import {
  buildUpdatedDraftPolicyData,
  isPolicyWriteConflict,
  parsePolicyMutation,
} from "@/lib/adminScholarshipPolicy";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ schemeId: string; policyId: string }>;
};

function validId(value: string): boolean {
  return value.length > 0 && value.length <= 120;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { schemeId, policyId } = await params;
  if (!validId(schemeId) || !validId(policyId)) {
    return NextResponse.json({ error: "Invalid scheme or policy ID.", code: "INVALID_ID" }, { status: 400 });
  }
  try {
    const policy = await prisma.scholarshipVerificationPolicy.findFirst({
      where: { id: policyId, schemeId },
      include: { publishedBy: { select: { id: true, fullName: true } } },
    });
    if (!policy) {
      return NextResponse.json({ error: "Scholarship policy not found.", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Admin scholarship policy read failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load the scholarship policy.", code: "POLICY_READ_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { schemeId, policyId } = await params;
  if (!validId(schemeId) || !validId(policyId)) {
    return NextResponse.json({ error: "Invalid scheme or policy ID.", code: "INVALID_ID" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON.", code: "INVALID_JSON" }, { status: 400 });
  }
  const validation = parsePolicyMutation(body);
  if (!validation.success) {
    return NextResponse.json({ error: "Verification policy is invalid.", code: "POLICY_INVALID", details: validation.errors }, { status: 400 });
  }

  try {
    const policy = await prisma.$transaction(async (transaction) => {
      const current = await transaction.scholarshipVerificationPolicy.findFirst({
        where: { id: policyId, schemeId },
        select: { status: true, isSynthetic: true },
      });
      if (!current) return { kind: "not_found" as const };
      if (current.isSynthetic) return { kind: "synthetic_immutable" as const };
      if (current.status !== "DRAFT") return { kind: "immutable" as const };
      const updated = await transaction.scholarshipVerificationPolicy.updateMany({
        where: { id: policyId, schemeId, status: "DRAFT" },
        data: buildUpdatedDraftPolicyData(validation.value),
      });
      if (updated.count !== 1) return { kind: "immutable" as const };
      const saved = await transaction.scholarshipVerificationPolicy.findUnique({
        where: { id: policyId },
        include: { publishedBy: { select: { id: true, fullName: true } } },
      });
      return saved ? { kind: "updated" as const, policy: saved } : { kind: "not_found" as const };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (policy.kind === "not_found") {
      return NextResponse.json({ error: "Scholarship policy not found.", code: "NOT_FOUND" }, { status: 404 });
    }
    if (policy.kind === "synthetic_immutable") {
      return NextResponse.json({ error: "The fixed synthetic test policy cannot be edited.", code: "SYNTHETIC_POLICY_IMMUTABLE" }, { status: 409 });
    }
    if (policy.kind === "immutable") {
      return NextResponse.json({ error: "Published policies are immutable. Create a new draft version.", code: "POLICY_IMMUTABLE" }, { status: 409 });
    }
    return NextResponse.json({ policy: policy.policy });
  } catch (error) {
    if (isPolicyWriteConflict(error)) {
      return NextResponse.json({ error: "The policy changed concurrently. Refresh and try again.", code: "POLICY_CONFLICT" }, { status: 409 });
    }
    console.error("Admin scholarship policy update failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to update the policy draft.", code: "POLICY_UPDATE_FAILED" }, { status: 500 });
  }
}
