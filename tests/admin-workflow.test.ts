import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  ApplicationStatus,
  DocumentType,
  VerificationStatus,
} from "../lib/generated/prisma/client";
import { requiredApplicationDocumentTypes } from "../lib/applicationRequirements";
import {
  areRequiredApplicationDocumentsVerified,
  getAllowedApplicationDecisionTransitions,
  getAllowedDocumentVerificationTransitions,
  getApplicationDecisionFailure,
  getMissingVerifiedDocumentTypes,
  isApplicationSubmitted,
  isApplicationDocumentReviewable,
  isSerializableAdminWorkflowConflict,
} from "../lib/adminWorkflow";

function verifiedRequiredDocuments() {
  return requiredApplicationDocumentTypes.map((type) => ({
    type,
    verificationStatus: VerificationStatus.VERIFIED,
  }));
}

test("drafts cannot receive verification or selection decisions", () => {
  assert.equal(isApplicationSubmitted(ApplicationStatus.DRAFT, "2026-01-01"), false);
  assert.equal(isApplicationSubmitted(ApplicationStatus.PENDING_VERIFICATION, null), false);
  assert.equal(isApplicationSubmitted(ApplicationStatus.PENDING_VERIFICATION, "2026-01-01"), true);
  assert.equal(isApplicationDocumentReviewable(ApplicationStatus.DRAFT), false);
  assert.equal(
    getApplicationDecisionFailure(
      ApplicationStatus.DRAFT,
      ApplicationStatus.PENDING_VERIFICATION,
      [],
    ),
    "draft",
  );
  assert.deepEqual(
    getAllowedApplicationDecisionTransitions(ApplicationStatus.DRAFT, []),
    [],
  );
});

test("recommendation and approval require all required persisted documents verified", () => {
  const pendingDocuments: {
    type: DocumentType;
    verificationStatus: VerificationStatus;
  }[] = verifiedRequiredDocuments();
  pendingDocuments[0] = {
    type: DocumentType.CASTE_CERTIFICATE,
    verificationStatus: VerificationStatus.PENDING,
  };

  assert.equal(areRequiredApplicationDocumentsVerified(pendingDocuments), false);
  assert.deepEqual(
    getMissingVerifiedDocumentTypes(pendingDocuments),
    [DocumentType.CASTE_CERTIFICATE],
  );
  assert.equal(
    getApplicationDecisionFailure(
      ApplicationStatus.PENDING_VERIFICATION,
      ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
      pendingDocuments,
    ),
    "documents_not_verified",
  );
  assert.equal(
    getApplicationDecisionFailure(
      ApplicationStatus.PENDING_VERIFICATION,
      ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
      verifiedRequiredDocuments(),
    ),
    null,
  );
  assert.equal(
    getApplicationDecisionFailure(
      ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
      ApplicationStatus.APPROVED_BY_OFFICER,
      verifiedRequiredDocuments(),
    ),
    "invalid_transition",
  );
});

test("application decisions follow explicit transitions and cannot skip verification", () => {
  const verified = verifiedRequiredDocuments();
  assert.deepEqual(
    getAllowedApplicationDecisionTransitions(ApplicationStatus.SUBMITTED, verified),
    [
      ApplicationStatus.PENDING_VERIFICATION,
      ApplicationStatus.FLAGGED_FOR_MANUAL_REVIEW,
      ApplicationStatus.REJECTED_BY_OFFICER,
    ],
  );
  assert.equal(
    getApplicationDecisionFailure(
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.RECOMMENDED_FOR_APPROVAL,
      verified,
    ),
    "invalid_transition",
  );
  assert.equal(
    getApplicationDecisionFailure(
      ApplicationStatus.APPROVED_BY_OFFICER,
      ApplicationStatus.REJECTED_BY_OFFICER,
      verified,
    ),
    "invalid_transition",
  );
});

test("document verification has explicit transitions and stale conflicts are detectable", () => {
  assert.deepEqual(
    getAllowedDocumentVerificationTransitions(VerificationStatus.PENDING),
    [
      VerificationStatus.VERIFIED,
      VerificationStatus.FLAGGED,
      VerificationStatus.REJECTED,
    ],
  );
  assert.equal(
    getAllowedDocumentVerificationTransitions(VerificationStatus.VERIFIED).includes(
      VerificationStatus.PENDING,
    ),
    false,
  );
  assert.equal(isSerializableAdminWorkflowConflict({ code: "P2034" }), true);
  assert.equal(isSerializableAdminWorkflowConflict({ code: "P2002" }), false);
});

test("Admin document verification is protected, application-scoped, and blocks drafts", () => {
  const route = readFileSync(
    join(
      process.cwd(),
      "app/api/admin/applications/[applicationNumber]/documents/[documentId]/route.ts",
    ),
    "utf8",
  );
  assert.match(route, /export async function PATCH/);
  assert.match(route, /requireAdmin\(\)/);
  assert.match(route, /applicationNumber/);
  assert.match(route, /applicationId:\s*application\.id/);
  assert.match(route, /ApplicationStatus\.DRAFT/);
  assert.match(route, /expectedStatus/);
  assert.match(route, /TransactionIsolationLevel\.Serializable/);
});

test("Admin document downloads are authenticated, application-scoped, and short-lived", () => {
  const route = readFileSync(
    join(
      process.cwd(),
      "app/api/admin/applications/[applicationNumber]/documents/[documentId]/route.ts",
    ),
    "utf8",
  );
  assert.match(route, /export async function GET/);
  assert.match(route, /const auth = await requireAdmin\(\)/);
  assert.match(route, /where: \{ id: documentId, applicationId: application\.id \}/);
  assert.match(route, /createSignedUrl\(document\.storagePath,\s*60/);
  assert.match(route, /NextResponse\.redirect\(data\.signedUrl,\s*302\)/);
  assert.doesNotMatch(route, /NextResponse\.json\(\s*\{\s*storagePath:/);
});

test("application decisions persist officer history and guard transitions transactionally", () => {
  const route = readFileSync(
    join(
      process.cwd(),
      "app/api/admin/applications/[applicationNumber]/decision/route.ts",
    ),
    "utf8",
  );
  assert.match(route, /requireAdmin\(\)/);
  assert.match(route, /getApplicationDecisionFailure/);
  assert.match(route, /applicationDecision\.create/);
  assert.match(route, /officerId:\s*user\.id/);
  assert.match(route, /TransactionIsolationLevel\.Serializable/);
  assert.match(route, /P2034/);
});

test("student application detail remains owner-scoped and exposes persisted document status only", () => {
  const page = readFileSync(
    join(process.cwd(), "app/student/applications/[applicationId]/page.tsx"),
    "utf8",
  );
  assert.match(page, /getOwnedApplicationScope\(applicationId,\s*user\.student\.id\)/);
  assert.match(page, /verificationStatus:\s*true/);
  assert.match(page, /supportingDocuments/);
  assert.match(page, /documentStatusLabel\(document\.verificationStatus\)/);
  assert.doesNotMatch(page, /verificationRemarks:\s*true/);
});
