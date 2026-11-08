import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  buildDocumentVersionSnapshot,
  validateReevaluationDocuments,
  type ReevaluationDocument,
} from "../lib/aiVerificationReevaluation";
import {
  getDispatchCandidateStaleness,
  isDispatchCandidateVersionCurrent,
} from "../lib/aiVerificationDispatcherCore";
import { syntheticDecisionBlocked } from "../lib/syntheticVerificationPolicy";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const requiredDocumentTypes = [
  "CASTE_CERTIFICATE",
  "INCOME_CERTIFICATE",
  "IDENTITY_PROOF",
  "MARKSHEET",
  "ADMISSION_PROOF",
  "BANK_PROOF",
  "PHOTOGRAPH",
] as const;
const aiEligibleDocumentTypes = requiredDocumentTypes.slice(0, 5);
const documents: ReevaluationDocument[] = [
  ...requiredDocumentTypes.map((type, index) => ({
    id: `document-${index}`,
    type,
    mimeType: "image/png",
    sizeBytes: 1200,
    updatedAt: new Date("2026-11-07T12:00:00.000Z"),
  })),
  {
    id: "manual-pdf",
    type: "OTHER",
    mimeType: "application/pdf",
    sizeBytes: 1200,
    updatedAt: new Date("2026-11-07T12:00:00.000Z"),
  },
];
const documentVersions = documents.map((document) => ({
  id: document.id,
  type: document.type,
  updatedAt: (document.updatedAt as Date).toISOString(),
}));

test("re-evaluation selects only the five policy-eligible images and snapshots all versions", () => {
  const result = validateReevaluationDocuments({
    documents,
    expectedVersions: documentVersions,
    requiredDocumentTypes,
    aiEligibleDocumentTypes,
  });
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.deepEqual(result.selectedDocumentIds, [
    "document-0",
    "document-1",
    "document-2",
    "document-3",
    "document-4",
  ]);
  assert.equal(result.documentSnapshot.length, 8);
  assert.equal(result.selectedDocumentIds.includes("manual-pdf"), false);
});

test("submission creates its AI job with a snapshot of transaction-read document versions", () => {
  const savedDocumentMetadata = documents.map(({ id, type, updatedAt }) => ({
    id,
    type,
    updatedAt,
  }));
  const documentSnapshot = buildDocumentVersionSnapshot(savedDocumentMetadata);
  assert.ok(documentSnapshot.length > 0);
  assert.deepEqual(documentSnapshot[0], {
    id: "document-0",
    type: "CASTE_CERTIFICATE",
    updatedAt: "2026-11-07T12:00:00.000Z",
  });

  const route = read("app/api/student/applications/[applicationId]/submit/route.ts");
  assert.match(route, /import \{ buildDocumentVersionSnapshot \} from "@\/lib\/aiVerificationReevaluation"/);
  assert.match(route, /documents:\s*\{\s*select:\s*\{\s*id:\s*true,[\s\S]*?type:\s*true,[\s\S]*?updatedAt:\s*true/);
  assert.match(route, /prisma\.\$transaction\(async \(tx\) =>/);
  assert.match(route, /tx\.aiVerificationJob\.create\(\{\s*data:\s*\{[\s\S]*?documentSnapshot:\s*buildDocumentVersionSnapshot\(\s*application\.documents,\s*\)/);
});

test("re-evaluation rejects stale, missing, duplicate, unsupported, or oversized documents", () => {
  const stale = documents.map((document) => ({ ...document }));
  stale[0] = { ...stale[0], updatedAt: new Date("2026-11-07T12:01:00.000Z") };
  assert.deepEqual(
    validateReevaluationDocuments({
      documents: stale,
      expectedVersions: documentVersions,
      requiredDocumentTypes,
      aiEligibleDocumentTypes,
    }),
    { success: false, code: "DOCUMENT_VERSION_STALE" },
  );
  assert.deepEqual(
    validateReevaluationDocuments({
      documents: documents.slice(1),
      expectedVersions: documentVersions.slice(1),
      requiredDocumentTypes,
      aiEligibleDocumentTypes,
    }),
    { success: false, code: "REQUIRED_DOCUMENT_MISSING" },
  );
  const duplicate = [...documents, { ...documents[0], id: "duplicate" }];
  const duplicateVersions = duplicate.map((document) => ({
    id: document.id,
    type: document.type,
    updatedAt: new Date(document.updatedAt).toISOString(),
  }));
  assert.deepEqual(
    validateReevaluationDocuments({
      documents: duplicate,
      expectedVersions: duplicateVersions,
      requiredDocumentTypes,
      aiEligibleDocumentTypes,
    }),
    { success: false, code: "AI_DOCUMENT_DUPLICATE" },
  );
  assert.deepEqual(
    validateReevaluationDocuments({
      documents: documents.map((document) =>
        document.type === "CASTE_CERTIFICATE"
          ? { ...document, mimeType: "application/pdf" }
          : document,
      ),
      expectedVersions: documentVersions,
      requiredDocumentTypes,
      aiEligibleDocumentTypes,
    }),
    { success: false, code: "AI_DOCUMENT_FORMAT_UNSUPPORTED" },
  );
});

test("the dispatcher rejects document changes made after a re-evaluation was queued", () => {
  const expected = documents.map((document) => ({
    id: document.id,
    type: document.type,
    updatedAt: new Date(document.updatedAt).toISOString(),
  }));
  const candidate = {
    jobId: "job-new",
    applicationId: "application-test",
    inputVersion: 2,
    claimAttemptCount: 0,
    applicationStatus: "SUBMITTED",
    applicationInputVersion: 2,
    applicationAiStatus: "WAITING_FOR_CONFIGURATION",
    applicationSchemeId: "scheme-test",
    idempotencyKey: "application-test:2",
    policyId: "policy-test",
    policySnapshot: {},
    documentSnapshot: expected,
    applicationData: {},
    documents: documents.map((document) => ({
      id: document.id,
      type: document.type,
      mimeType: document.mimeType,
      updatedAt: document.updatedAt,
    })),
  };
  assert.equal(getDispatchCandidateStaleness(candidate), null);
  const stale = {
    ...candidate,
    documents: candidate.documents.map((document) =>
      document.id === "document-0"
        ? { ...document, updatedAt: new Date("2026-11-07T12:01:00.000Z") }
        : document,
    ),
  };
  assert.equal(getDispatchCandidateStaleness(stale), "DOCUMENT_VERSION_STALE");
});

test("a prior waiting job remains unmodified and is not reclaimed after input version advances", () => {
  const historicalCandidate = { inputVersion: 1, applicationInputVersion: 2 };
  assert.equal(isDispatchCandidateVersionCurrent(historicalCandidate), false);
  assert.equal(isDispatchCandidateVersionCurrent({ inputVersion: 2, applicationInputVersion: 2 }), true);

  const route = read("app/api/admin/applications/[applicationNumber]/ai-review/re-evaluate/route.ts");
  assert.match(route, /const nextVersion = application\.aiInputVersion \+ 1/);
  assert.match(route, /transaction\.aiVerificationJob\.create\(\{\s*data:\s*\{[\s\S]*?inputVersion: nextVersion/);
  assert.match(route, /policySnapshot/);
  assert.match(route, /documentSnapshot:/);
  assert.match(route, /requestedById: auth\.user\.id/);
  assert.match(route, /idempotencyKey: buildAiJobIdempotencyKey/);
  assert.doesNotMatch(route, /transaction\.aiVerificationJob\.updateMany/);

  const dispatcher = read("lib/aiVerificationDispatcher.ts");
  const preserveOldVersionCheck = dispatcher.indexOf(
    "if (!isDispatchCandidateVersionCurrent(candidate)) continue;",
  );
  const staleJobMutation = dispatcher.indexOf("status: AiVerificationJobStatus.SUPERSEDED");
  assert.ok(preserveOldVersionCheck >= 0);
  assert.ok(staleJobMutation > preserveOldVersionCheck);

  const schema = read("prisma/schema.prisma");
  assert.match(schema, /@@unique\(\[applicationId, inputVersion\]\)/);
  assert.match(schema, /idempotencyKey\s+String\s+@unique/);
});

test("re-evaluation and synthetic decision routes enforce Admin, version, history, and production boundaries", () => {
  const route = read("app/api/admin/applications/[applicationNumber]/ai-review/re-evaluate/route.ts");
  assert.match(route, /requireAdmin/);
  assert.match(route, /schemeId: application\.schemeId/);
  assert.match(route, /isSynthetic: policy\.isSynthetic/);
  assert.match(route, /documentSnapshot:/);
  assert.match(route, /requestedById: auth\.user\.id/);
  assert.match(route, /TransactionIsolationLevel\.Serializable/);
  assert.match(route, /idempotencyKey: buildAiJobIdempotencyKey/);
  assert.match(route, /aiInputVersion: application\.aiInputVersion/);
  assert.match(route, /No AI request was sent/);
  assert.equal(syntheticDecisionBlocked(true), true);
  assert.equal(syntheticDecisionBlocked(false), false);
  assert.equal(syntheticDecisionBlocked({ isSynthetic: true }), true);
  assert.equal(syntheticDecisionBlocked({ isSynthetic: false }), false);

  const schema = read("prisma/schema.prisma");
  assert.match(schema, /@@unique\(\[applicationId, inputVersion\]\)/);
  assert.match(schema, /idempotencyKey\s+String\s+@unique/);
  assert.doesNotMatch(route, /transaction\.aiVerificationJob\.updateMany/);

  for (const path of [
    "app/api/admin/applications/[applicationNumber]/decision/route.ts",
    "app/api/admin/applications/[applicationNumber]/selection/route.ts",
    "app/api/approver/applications/[applicationNumber]/approval/route.ts",
  ]) {
    assert.match(read(path), /syntheticDecisionBlocked/);
  }
});
