import { NextResponse } from "next/server";
import { requireEnvironmentVariable } from "@/lib/env";
import { dispatchNextAiVerification } from "@/lib/aiVerificationDispatcher";
import { isAuthorizedInternalBearer } from "@/lib/internalServiceAuth";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  try {
    const result = await dispatchNextAiVerification();
    return NextResponse.json(result, {
      status: result.kind === "failed" ? 202 : 200,
    });
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
