import { NextResponse } from "next/server";
import { requireEnvironmentVariable } from "@/lib/env";
import { verifyAiCallbackSignature } from "@/lib/aiVerificationContract";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (rawBody.length > 64_000) {
    return NextResponse.json({ error: "Callback body is too large." }, { status: 413 });
  }

  let secret: string;
  try {
    secret = requireEnvironmentVariable(
      "AI_VERIFICATION_CALLBACK_SECRET",
      process.env.AI_VERIFICATION_CALLBACK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "AI callback integration is not configured." }, { status: 503 });
  }
  if (secret.length < 32) {
    return NextResponse.json({ error: "AI callback integration is not configured." }, { status: 503 });
  }

  if (!verifyAiCallbackSignature({
    secret,
    timestamp: request.headers.get("x-fellowshift-timestamp") ?? "",
    rawBody,
    signature: request.headers.get("x-fellowshift-signature") ?? "",
  })) {
    return NextResponse.json({ error: "Callback authentication failed." }, { status: 401 });
  }

  return NextResponse.json(
    { error: "AI verification is synchronous; callback results are not accepted." },
    { status: 410 },
  );
}
