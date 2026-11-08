import { NextResponse } from "next/server";
import { requireEnvironmentVariable } from "@/lib/env";
import {
  dispatchAiVerificationJob,
  dispatchNextAiVerification,
} from "@/lib/aiVerificationDispatcher";
import { isAuthorizedInternalBearer } from "@/lib/internalServiceAuth";

export const runtime = "nodejs";
export const maxDuration = 120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let dispatchToken: string;
  try {
    dispatchToken = requireEnvironmentVariable(
      "AI_VERIFICATION_DISPATCH_TOKEN",
      process.env.AI_VERIFICATION_DISPATCH_TOKEN,
    );
  } catch {
    return NextResponse.json(
      { error: "AI verification dispatch is not configured." },
      { status: 503 },
    );
  }

  if (!isAuthorizedInternalBearer(request.headers.get("authorization"), dispatchToken)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  const rawBody = await request.text();
  if (rawBody.trim()) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }
  }

  const hasJobId = isRecord(body) && Object.prototype.hasOwnProperty.call(body, "jobId");
  const hasApplicationId = isRecord(body) && Object.prototype.hasOwnProperty.call(body, "applicationId");
  const hasTarget = hasJobId || hasApplicationId;
  let target: { jobId: string; applicationId: string } | null = null;
  if (hasTarget) {
    if (
      !isRecord(body) ||
      Object.keys(body).some((key) => key !== "jobId" && key !== "applicationId") ||
      typeof body.jobId !== "string" ||
      body.jobId.length === 0 ||
      typeof body.applicationId !== "string" ||
      body.applicationId.length === 0
    ) {
      return NextResponse.json(
        { error: "Targeted dispatch requires exactly a jobId and applicationId." },
        { status: 400 },
      );
    }
    target = { jobId: body.jobId, applicationId: body.applicationId };
  } else if (isRecord(body) && Object.keys(body).length > 0) {
    return NextResponse.json({ error: "Unsupported dispatch request." }, { status: 400 });
  }

  try {
    if (target) {
      const result = await dispatchAiVerificationJob(target.jobId, target.applicationId);
      const status = result.kind === "failed"
        ? 202
        : result.kind === "not_found"
          ? 404
          : result.kind === "synthetic_blocked"
            ? 403
            : result.kind === "contended" || result.kind === "not_eligible" ||
                result.kind === "stale" || result.kind === "invalid"
              ? 409
              : 200;
      return NextResponse.json(result, { status });
    }

    const result = await dispatchNextAiVerification();
    return NextResponse.json(result, { status: result.kind === "failed" ? 202 : 200 });
  } catch (error) {
    console.error(
      "AI verification dispatch failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return NextResponse.json(
      { error: "Unable to process an AI verification job." },
      { status: 500 },
    );
  }
}
