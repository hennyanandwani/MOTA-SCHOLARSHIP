import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import {
  isSchemeUniqueConflict,
  validateSchemeCreateInput,
} from "@/lib/scholarshipSchemeValidation";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const schemes = await prisma.scholarshipScheme.findMany({
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
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
    return NextResponse.json({ schemes });
  } catch (error) {
    console.error("Admin scheme list query failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load schemes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validation = validateSchemeCreateInput(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { name, type, description, isActive } = validation.value;
  if (!name || !type) {
    return NextResponse.json({ error: "Scheme name and type are required." }, { status: 400 });
  }

  try {
    const scheme = await prisma.scholarshipScheme.create({
      data: { name, type, description, isActive },
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
    return NextResponse.json({ scheme }, { status: 201 });
  } catch (error) {
    if (isSchemeUniqueConflict(error)) {
      return NextResponse.json(
        { error: "A scheme with conflicting unique data already exists." },
        { status: 409 },
      );
    }
    console.error("Admin scheme creation failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to create the scheme." }, { status: 500 });
  }
}
