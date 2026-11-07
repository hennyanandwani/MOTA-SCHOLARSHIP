import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { requireEnvironmentVariable } from "@/lib/env";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import {
  createAiVerificationAdapter,
  type AiVerificationInput,
  type AiVerificationResult,
} from "@/lib/aiVerificationAdapterCore";

const DOCUMENT_BUCKET = "scholarship-documents";

function getPrivateStorageClient() {
  const { url } = getSupabasePublicConfig();
  const secret = requireEnvironmentVariable(
    "SUPABASE_SECRET_KEY",
    process.env.SUPABASE_SECRET_KEY,
  );
  return createSupabaseClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function submitFastApiAiVerification(
  input: AiVerificationInput,
  signal?: AbortSignal,
): Promise<AiVerificationResult> {
  let storage: ReturnType<typeof getPrivateStorageClient> | undefined;
  const adapter = createAiVerificationAdapter({
    env: {
      FELLOWSHIFT_AI_SERVICE_URL: process.env.FELLOWSHIFT_AI_SERVICE_URL,
      FELLOWSHIFT_AI_SERVICE_TOKEN: process.env.FELLOWSHIFT_AI_SERVICE_TOKEN,
    },
    async findDocuments(applicationId, documentIds) {
      if (documentIds.length === 0) return [];
      const documents = await prisma.applicationDocument.findMany({
        where: {
          applicationId,
          id: { in: [...documentIds] },
        },
        select: {
          id: true,
          applicationId: true,
          type: true,
          storagePath: true,
          mimeType: true,
          sizeBytes: true,
        },
      });
      const documentsById = new Map(documents.map((document) => [document.id, document]));
      return documentIds.flatMap((id) => {
        const document = documentsById.get(id);
        return document ? [document] : [];
      });
    },
    async downloadDocument(storagePath) {
      storage ??= getPrivateStorageClient();
      const { data, error } = await storage.storage
        .from(DOCUMENT_BUCKET)
        .download(storagePath);
      if (error || !data) {
        throw new Error("Private application document download failed.");
      }
      return new Uint8Array(await data.arrayBuffer());
    },
  });

  return adapter.verify(input, signal);
}
