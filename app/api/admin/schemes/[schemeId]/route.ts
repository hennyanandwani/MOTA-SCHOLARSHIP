import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import {
  isSchemeUniqueConflict,
  validateSchemeUpdateInput,
} from "@/lib/scholarshipSchemeValidation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ schemeId: string }> },
) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { schemeId } = await params;
  if (!schemeId || schemeId.length > 120) {
    return NextResponse.json({ error: "Invalid scheme ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validation = validateSchemeUpdateInput(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const result = await prisma.scholarshipScheme.updateMany({
      where: { id: schemeId },
      data: validation.value,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Scholarship scheme not found." }, { status: 404 });
    }

    const scheme = await prisma.scholarshipScheme.findUnique({
      where: { id: schemeId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!scheme) {
      return NextResponse.json({ error: "Scholarship scheme not found." }, { status: 404 });
    }
    return NextResponse.json({ scheme });
  } catch (error) {
    if (isSchemeUniqueConflict(error)) {
      return NextResponse.json(
        { error: "A scheme with conflicting unique data already exists." },
        { status: 409 },
      );
    }
    console.error("Admin scheme update failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to update the scheme." }, { status: 500 });
  }
}
