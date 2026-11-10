import "server-only";
import { getSchemeWithDetails } from "@/lib/schemeDetails";
import { prisma } from "@/lib/prisma";
import type { PersistedSchemeType } from "@/lib/scholarshipSchemeValidation";
import {
  getEffectiveRequiredDocumentTypes,
  type ApplicationRequirementDocumentType,
} from "@/lib/applicationRequirements";
import { resolveSchemeRequiredDocumentTypes } from "@/lib/schemeRequiredDocuments";

export type PersistedScholarshipScheme = {
  id: string;
  name: string;
  description: string | null;
  type: PersistedSchemeType;
  isActive: boolean;
};

export type SchemeWorkflowInfo = {
  id: string;
  name: string;
  type: "Scholarship" | "Fellowship";
  requiredDocumentTypes: ApplicationRequirementDocumentType[];
};

export async function getPersistedScholarshipScheme(
  schemeId: string,
): Promise<PersistedScholarshipScheme | null> {
  return prisma.scholarshipScheme.findUnique({
    where: { id: schemeId },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      isActive: true,
    },
  });
}

export async function getSchemeWorkflowInfo(
  schemeId: string,
): Promise<SchemeWorkflowInfo | null> {
  const scheme = await getPersistedScholarshipScheme(schemeId);
  if (scheme) {
    return {
      id: scheme.id,
      name: scheme.name,
      type: scheme.type === "FELLOWSHIP" ? "Fellowship" : "Scholarship",
      requiredDocumentTypes: await resolveSchemeRequiredDocumentTypes(scheme.id),
    };
  }

  const demoScheme = getSchemeWithDetails(schemeId)?.scheme;
  if (!demoScheme) return null;
  return {
    id: demoScheme.id,
    name: demoScheme.name,
    type: demoScheme.type,
    requiredDocumentTypes: getEffectiveRequiredDocumentTypes(null),
  };
}
