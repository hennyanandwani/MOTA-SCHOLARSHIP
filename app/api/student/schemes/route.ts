import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/studentAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireStudent();
  if (auth.response) return auth.response;

  try {
    const schemes = await prisma.scholarshipScheme.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
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
    console.error("Student scheme list query failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load schemes." }, { status: 500 });
  }
}
