import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_DISPATCH_EXECUTION_BUDGET_MS,
  AI_VERIFICATION_TIMEOUT_MS,
  AiVerificationAdapterError,
  createAiVerificationAdapter,
  type AiVerificationCriterion,
  type AiVerificationInput,
  type AiVerificationStoredDocument,
} from "../lib/aiVerificationAdapterCore";
import { requiredApplicationDocumentTypes } from "../lib/applicationRequirements";

const serviceEnv = {
  FELLOWSHIFT_AI_SERVICE_URL: "https://service.example/api/v1/verifications",
  FELLOWSHIFT_AI_SERVICE_TOKEN: "server-only-test-token",
};

const criteria: AiVerificationCriterion[] = [{
  field: "category",
  operator: "eq",
  value: "ST",
  reason_code: "CATEGORY_MATCH",
  explanation: "Applicant category must match the scheme.",
}];
const applicationData = { personal: { name: "Test Student" } };
const input: AiVerificationInput = {
  applicationId: "application-1",
  idempotencyKey: "application-1:1",
  applicationData,
  criteria,
  requiredDocumentTypes: [...requiredApplicationDocumentTypes],
  aiEligibleDocumentTypes: [
    "INCOME_CERTIFICATE",
    "IDENTITY_PROOF",
    "CASTE_CERTIFICATE",
    "MARKSHEET",
  ],
  documentIds: ["document-1"],
};

function png(width = 10, height = 20): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  new DataView(bytes.buffer).setUint32(16, width, false);
  new DataView(bytes.buffer).setUint32(20, height, false);
  return bytes;
}

const storedDocument: AiVerificationStoredDocument = {
  id: "document-1",
  applicationId: "application-1",
  type: "INCOME_CERTIFICATE",
  storagePath: "student-1/application-1/document.png",
  mimeType: "image/png",
  sizeBytes: png().byteLength,
};

const successBody = {
  application_id: "application-1",
  outcome: "ELIGIBLE",
  reasons: [{ code: "MATCH", message: "Matched." }],
  documents: [{ provider: "mistral", extracted_fields: { name: "Test Student" } }],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function adapter(overrides: {
  findDocuments?: (
    applicationId: string,
    documentIds: readonly string[],
  ) => Promise<readonly AiVerificationStoredDocument[]>;
  downloadDocument?: (path: string) => Promise<Uint8Array>;
  fetcher?: typeof fetch;
  timeoutMs?: number;
} = {}) {
  return createAiVerificationAdapter({
    env: serviceEnv,
    findDocuments: overrides.findDocuments ?? (async () => [storedDocument]),
    downloadDocument: overrides.downloadDocument ?? (async () => png()),
    fetcher: overrides.fetcher ?? (async () => jsonResponse(successBody)),
    timeoutMs: overrides.timeoutMs,
  });
}

test("builds the confirmed multipart request and preserves the job idempotency key", async () => {
  const seen: RequestInit[] = [];
  const seenUrls: string[] = [];
  const client = adapter({
    fetcher: async (url, init) => {
      seenUrls.push(String(url));
      seen.push(init ?? {});
      return jsonResponse(successBody);
    },
  });

  await client.verify(input);
  await client.verify(input);

  assert.equal(seen.length, 2);
  assert.deepEqual(seenUrls, [
    "https://service.example/api/v1/verifications",
    "https://service.example/api/v1/verifications",
  ]);
  for (const init of seen) {
    const headers = new Headers(init.headers);
    assert.equal(headers.get("Authorization"), "Bearer server-only-test-token");
    assert.equal(headers.get("Idempotency-Key"), "application-1:1");
    assert.equal(headers.has("Content-Type"), false);
    assert.equal(init.method, "POST");
    assert.ok(init.signal);

    const form = init.body as FormData;
    assert.deepEqual(
      JSON.parse(String(form.get("application_data"))),
      { application_id: "application-1", application_data: applicationData },
    );
    assert.deepEqual(JSON.parse(String(form.get("criteria"))), criteria);
    assert.deepEqual(
      JSON.parse(String(form.get("required_document_types"))),
      requiredApplicationDocumentTypes.map((type) =>
        type === "INCOME_CERTIFICATE"
          ? "INCOME_CERT"
          : type === "CASTE_CERTIFICATE"
            ? "ST_CASTE_CERT"
            : type,
      ),
    );
    assert.deepEqual(
      JSON.parse(String(form.get("document_types"))),
      ["INCOME_CERT"],
    );
    const uploaded = form.getAll("documents");
    assert.equal(uploaded.length, 1);
    assert.equal((uploaded[0] as File).type, "image/png");
    assert.equal((uploaded[0] as File).name, "document-1.png");
  }
});

test("maps the supported Prisma document types at the FastAPI request boundary", async () => {
  const documents: AiVerificationStoredDocument[] = [
    { ...storedDocument, id: "income", type: "INCOME_CERTIFICATE", storagePath: "income.png" },
    { ...storedDocument, id: "caste", type: "CASTE_CERTIFICATE", storagePath: "caste.png" },
    { ...storedDocument, id: "marksheet", type: "MARKSHEET", storagePath: "marksheet.png" },
  ];
  const selectedTypes = [
    "INCOME_CERTIFICATE",
    "CASTE_CERTIFICATE",
    "MARKSHEET",
  ];
  let uploadedTypes: string[] = [];
  let uploadedRequiredTypes: string[] = [];
  let uploadedFiles: File[] = [];
  const downloadedPaths: string[] = [];
  const client = adapter({
    findDocuments: async (_applicationId, documentIds) =>
      documentIds.flatMap((id) =>
        documents.filter((document) => document.id === id),
      ),
    downloadDocument: async (path) => {
      downloadedPaths.push(path);
      return png();
    },
    fetcher: async (_url, init) => {
      const form = init?.body as FormData;
      uploadedTypes = JSON.parse(String(form.get("document_types")));
      uploadedRequiredTypes = JSON.parse(
        String(form.get("required_document_types")),
      );
      uploadedFiles = form.getAll("documents").map((file) => file as File);
      return jsonResponse(successBody);
    },
  });

  await client.verify({
    ...input,
    requiredDocumentTypes: selectedTypes,
    aiEligibleDocumentTypes: selectedTypes,
    documentIds: ["marksheet", "caste", "income"],
  });

  assert.deepEqual(uploadedTypes, ["INCOME_CERT", "ST_CASTE_CERT", "MARKSHEET"]);
  assert.deepEqual(uploadedRequiredTypes, uploadedTypes);
  assert.deepEqual(downloadedPaths, ["income.png", "caste.png", "marksheet.png"]);
  assert.deepEqual(
    uploadedFiles.map((file) => file.name),
    ["document-1.png", "document-2.png", "document-3.png"],
  );
  assert.equal(uploadedFiles.length, uploadedTypes.length);
  assert.deepEqual(
    documents.map((document) => document.type),
    ["INCOME_CERTIFICATE", "CASTE_CERTIFICATE", "MARKSHEET"],
  );
});

test("continues rejecting unknown and unsupported document types before storage access", async () => {
  let lookedUpDocuments = false;
  let fetched = false;
  const client = adapter({
    findDocuments: async () => {
      lookedUpDocuments = true;
      return [storedDocument];
    },
    fetcher: async () => {
      fetched = true;
      return jsonResponse(successBody);
    },
  });

  await assert.rejects(
    client.verify({
      ...input,
      aiEligibleDocumentTypes: ["UNRECOGNIZED_DOCUMENT"],
    }),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "DOCUMENTS_UNSUPPORTED",
  );
  await assert.rejects(
    client.verify({
      ...input,
      requiredDocumentTypes: ["UNRECOGNIZED_DOCUMENT"],
    }),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "DOCUMENTS_INVALID",
  );
  assert.equal(lookedUpDocuments, false);
  assert.equal(fetched, false);
});

test("does not submit without authoritative criteria", async () => {
  let fetched = false;
  let lookedUpDocuments = false;
  const client = adapter({
    findDocuments: async () => {
      lookedUpDocuments = true;
      return [storedDocument];
    },
    fetcher: async () => {
      fetched = true;
      return jsonResponse(successBody);
    },
  });

  await assert.rejects(
    client.verify({ ...input, criteria: [] }),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "CRITERIA_UNAVAILABLE",
  );
  assert.equal(lookedUpDocuments, false);
  assert.equal(fetched, false);
});

test("rejects documents not owned by the requested application before storage access", async () => {
  let downloaded = false;
  let fetched = false;
  const client = adapter({
    findDocuments: async () => [
      { ...storedDocument, applicationId: "another-application" },
    ],
    downloadDocument: async () => {
      downloaded = true;
      return png();
    },
    fetcher: async () => {
      fetched = true;
      return jsonResponse(successBody);
    },
  });

  test("sends all required types separately and uploads only selected AI documents", async () => {
    const manualOnlyDocument = {
      ...storedDocument,
      id: "manual-only",
      type: "PHOTOGRAPH",
      storagePath: "student-1/application-1/photo.pdf",
      mimeType: "application/pdf",
    };
    const lookedUp: string[][] = [];
    let uploadedTypes: string[] = [];
    const client = adapter({
      findDocuments: async (_applicationId, documentIds) => {
        lookedUp.push([...documentIds]);
        return documentIds.includes(manualOnlyDocument.id)
          ? [storedDocument, manualOnlyDocument]
          : [storedDocument];
      },
      fetcher: async (_url, init) => {
        const form = init?.body as FormData;
        uploadedTypes = JSON.parse(String(form.get("document_types")));
        assert.deepEqual(
          JSON.parse(String(form.get("required_document_types"))),
          requiredApplicationDocumentTypes.map((type) =>
            type === "INCOME_CERTIFICATE"
              ? "INCOME_CERT"
              : type === "CASTE_CERTIFICATE"
                ? "ST_CASTE_CERT"
                : type,
          ),
        );
        assert.equal(form.getAll("documents").length, 1);
        return jsonResponse(successBody);
      },
    });

    await client.verify(input);
    assert.deepEqual(lookedUp, [["document-1"]]);
    assert.deepEqual(uploadedTypes, ["INCOME_CERT"]);

    await assert.rejects(
      client.verify({
        ...input,
        documentIds: ["document-1", manualOnlyDocument.id],
      }),
      (error: unknown) =>
        error instanceof AiVerificationAdapterError &&
        error.code === "DOCUMENTS_INVALID",
    );
  });

  test("uploads the selected AI images in the explicit policy priority order", async () => {
    const priorityTypes = [
      "INCOME_CERTIFICATE",
      "IDENTITY_PROOF",
      "CASTE_CERTIFICATE",
      "MARKSHEET",
    ];
    const documents = priorityTypes.map((type, index) => ({
      ...storedDocument,
      id: `document-${index}`,
      type,
      storagePath: `student-1/application-1/${type}.png`,
    }));
    let uploadedTypes: string[] = [];
    let uploadedCount = 0;
    const client = adapter({
      findDocuments: async (_applicationId, documentIds) =>
        documentIds.flatMap((id) =>
          documents.filter((document) => document.id === id),
        ),
      fetcher: async (_url, init) => {
        const form = init?.body as FormData;
        uploadedTypes = JSON.parse(String(form.get("document_types")));
        uploadedCount = form.getAll("documents").length;
        return jsonResponse(successBody);
      },
    });

    await client.verify({
      ...input,
      aiEligibleDocumentTypes: priorityTypes,
      documentIds: documents.map((document) => document.id).reverse(),
    });
    assert.deepEqual(uploadedTypes, [
      "INCOME_CERT",
      "IDENTITY_PROOF",
      "ST_CASTE_CERT",
      "MARKSHEET",
    ]);
    assert.equal(uploadedCount, priorityTypes.length);
  });

  test("rejects more than five AI-selected document types before storage access", async () => {
    let lookedUp = false;
    const client = adapter({
      findDocuments: async () => {
        lookedUp = true;
        return [storedDocument];
      },
    });
    await assert.rejects(
      client.verify({
        ...input,
        aiEligibleDocumentTypes: [
          "CASTE_CERTIFICATE",
          "INCOME_CERTIFICATE",
          "IDENTITY_PROOF",
          "MARKSHEET",
          "ADMISSION_PROOF",
          "BANK_PROOF",
        ],
      }),
      (error: unknown) =>
        error instanceof AiVerificationAdapterError &&
        error.code === "DOCUMENTS_UNSUPPORTED",
    );
    assert.equal(lookedUp, false);
  });

  await assert.rejects(
    client.verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "DOCUMENTS_INVALID",
  );
  assert.equal(downloaded, false);
  assert.equal(fetched, false);
});

test("fails closed for PDFs, over-limit documents, and images over 20 megapixels", async () => {
  const pdfAdapter = adapter({
    findDocuments: async () => [{ ...storedDocument, mimeType: "application/pdf" }],
  });
  await assert.rejects(
    pdfAdapter.verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "DOCUMENTS_UNSUPPORTED",
  );

  const oversizedAdapter = adapter({
    findDocuments: async () => [
      { ...storedDocument, sizeBytes: 10 * 1024 * 1024 + 1 },
    ],
  });
  await assert.rejects(
    oversizedAdapter.verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "DOCUMENTS_UNSUPPORTED",
  );

  const largeImageAdapter = adapter({
    downloadDocument: async () => png(5000, 5000),
  });
  await assert.rejects(
    largeImageAdapter.verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "DOCUMENTS_UNSUPPORTED",
  );
});

test("normalizes valid responses and rejects malformed or cross-application responses", async () => {
  const result = await adapter().verify(input);
  assert.deepEqual(result, {
    applicationId: "application-1",
    outcome: "ELIGIBLE",
    reasons: successBody.reasons,
    documents: successBody.documents,
    httpStatus: 200,
  });

  await assert.rejects(
    adapter({
      fetcher: async () => jsonResponse({ ...successBody, application_id: "other" }),
    }).verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "RESPONSE_INVALID",
  );
  await assert.rejects(
    adapter({
      fetcher: async () => new Response("{", { status: 200 }),
    }).verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "RESPONSE_INVALID",
  );
});

test("treats HTTP 503 with FAILED as provider failure, never as ineligibility", async () => {
  const failed = {
    application_id: "application-1",
    outcome: "FAILED",
    reasons: [{ code: "PROVIDER_UNAVAILABLE" }],
    documents: [],
  };
  const result = await adapter({
    fetcher: async () => jsonResponse(failed, 503),
  }).verify(input);
  assert.equal(result.outcome, "FAILED");
  assert.equal(result.httpStatus, 503);

  await assert.rejects(
    adapter({
      fetcher: async () => jsonResponse({ ...successBody, outcome: "INELIGIBLE" }, 503),
    }).verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "HTTP_FAILURE" &&
      error.httpStatus === 503,
  );
});

test("classifies timeout, network, duplicate/conflict, and storage failures", async () => {
  assert.ok(AI_VERIFICATION_TIMEOUT_MS > 65_000);

  await assert.rejects(
    adapter({
      fetcher: async () => {
        throw new DOMException("Request timed out", "TimeoutError");
      },
    }).verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "REQUEST_TIMEOUT",
  );
  await assert.rejects(
    adapter({
      fetcher: async () => {
        throw new TypeError("fetch failed");
      },
    }).verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "NETWORK_FAILURE",
  );
  await assert.rejects(
    adapter({
      fetcher: async () => new Response(null, { status: 409 }),
    }).verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "HTTP_FAILURE" &&
      error.httpStatus === 409,
  );
  await assert.rejects(
    adapter({
      downloadDocument: async () => {
        throw new Error("storage unavailable");
      },
    }).verify(input),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "STORAGE_ACCESS",
  );
});

test("dispatch deadline bounds document lookup and private document retrieval", async () => {
  const pending = () => new Promise<never>(() => {});
  for (const options of [
    { findDocuments: async () => pending() },
    { downloadDocument: async () => pending() },
  ]) {
    const controller = new AbortController();
    const verification = adapter(options).verify(input, controller.signal);
    setTimeout(() => controller.abort(), 5);
    await assert.rejects(
      verification,
      (error: unknown) =>
        error instanceof AiVerificationAdapterError &&
        error.code === "EXECUTION_TIMEOUT",
    );
  }
  assert.ok(AI_VERIFICATION_TIMEOUT_MS < AI_DISPATCH_EXECUTION_BUDGET_MS);
});

test("dispatch deadline bounds synchronous FastAPI processing", async () => {
  const controller = new AbortController();
  let fetchCalls = 0;
  let fetchSignal: AbortSignal | undefined;
  const client = adapter({
    timeoutMs: 66_000,
    fetcher: async (_url, init) => {
      fetchCalls += 1;
      fetchSignal = init?.signal as AbortSignal;
      return new Promise<Response>(() => {});
    },
  });
  const verification = client.verify(input, controller.signal);
  setTimeout(() => controller.abort(), 5);
  await assert.rejects(
    verification,
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "REQUEST_TIMEOUT",
  );
  assert.equal(fetchCalls, 1);
  assert.equal(fetchSignal?.aborted, true);
});

test("rejects unsupported criteria operators and document counts", async () => {
  const invalidCriteria = structuredClone(criteria);
  Object.assign(invalidCriteria[0], { operator: "contains" });
  await assert.rejects(
    adapter().verify({
      ...input,
      criteria: invalidCriteria,
    }),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "CRITERIA_INVALID",
  );
  await assert.rejects(
    adapter().verify({
      ...input,
      documentIds: ["a", "b", "c", "d", "e", "f"],
    }),
    (error: unknown) =>
      error instanceof AiVerificationAdapterError &&
      error.code === "DOCUMENTS_UNSUPPORTED",
  );
});
