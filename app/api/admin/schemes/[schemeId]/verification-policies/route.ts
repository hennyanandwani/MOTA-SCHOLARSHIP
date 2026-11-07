import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import {
  buildDraftPolicyData,
  isPolicyWriteConflict,
  parsePolicyMutation,
} from "@/lib/adminScholarshipPolicy";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ schemeId: string }> };

function validId(value: string): boolean {
  return value.length > 0 && value.length <= 120;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { schemeId } = await params;
  if (!validId(schemeId)) {
    return NextResponse.json({ error: "Invalid scholarship scheme ID.", code: "INVALID_ID" }, { status: 400 });
  }

  try {
    const scheme = await prisma.scholarshipScheme.findUnique({
      where: { id: schemeId },
      select: { id: true },
    });
    if (!scheme) {
      return NextResponse.json({ error: "Scholarship scheme not found.", code: "NOT_FOUND" }, { status: 404 });
    }
    const policies = await prisma.scholarshipVerificationPolicy.findMany({
      where: { schemeId },
      orderBy: { version: "desc" },
      include: { publishedBy: { select: { id: true, fullName: true } } },
    });
    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Admin scholarship policy list failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load scholarship policies.", code: "POLICY_READ_FAILED" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { schemeId } = await params;
  if (!validId(schemeId)) {
    return NextResponse.json({ error: "Invalid scholarship scheme ID.", code: "INVALID_ID" }, { status: 400 });
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
      const scheme = await transaction.scholarshipScheme.findUnique({
        where: { id: schemeId },
        select: { id: true },
      });
      if (!scheme) return null;

      const latest = await transaction.scholarshipVerificationPolicy.aggregate({
        where: { schemeId },
        _max: { version: true },
      });
      return transaction.scholarshipVerificationPolicy.create({
        data: buildDraftPolicyData(
          schemeId,
          (latest._max.version ?? 0) + 1,
          validation.value,
        ),
        include: { publishedBy: { select: { id: true, fullName: true } } },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!policy) {
      return NextResponse.json({ error: "Scholarship scheme not found.", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    if (isPolicyWriteConflict(error)) {
      return NextResponse.json({ error: "A conflicting policy version was created. Refresh and try again.", code: "VERSION_CONFLICT" }, { status: 409 });
    }
    console.error("Admin scholarship policy creation failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to create the policy draft.", code: "POLICY_CREATE_FAILED" }, { status: 500 });
  }
}
