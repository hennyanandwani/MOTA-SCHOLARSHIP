import "server-only";
import { prisma } from "@/lib/prisma";
import { getEffectiveRequiredDocumentTypes } from "@/lib/applicationRequirements";

export async function resolveSchemeRequiredDocumentTypes(
  schemeId: string,
) {
  const policy = await prisma.scholarshipVerificationPolicy.findFirst({
    where: { schemeId, status: "PUBLISHED" },
    orderBy: { version: "desc" },
    select: { requiredDocumentTypes: true },
  });
  return getEffectiveRequiredDocumentTypes(policy?.requiredDocumentTypes);
}
