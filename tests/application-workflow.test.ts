import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  assessEligibility,
} from "../lib/eligibilityReview";
import {
  createApplicationProfilePrefill,
  createEmptyApplicationData,
  getApplicationStepValidationErrors,
} from "../lib/applicationDraft";
import {
  getDocumentUploadValidationError,
  MAX_APPLICATION_DOCUMENT_SIZE,
} from "../lib/applicationDocumentValidation";
import {
  getOwnedApplicationScope,
  isSerializableTransactionConflict,
} from "../lib/applicationConcurrency";

test("eligibility remains undetermined without scheme criteria and reports missing profile fields", () => {
  const assessment = assessEligibility({
    subCaste: "Provided",
    annualIncome: null,
    academicPercentage: 80,
    courseName: "",
    instituteName: "Provided",
  });

  assert.equal(assessment.status, "cannot_determine");
  assert.deepEqual(assessment.confirmedCriteria, []);
  assert.deepEqual(assessment.missingProfileFields, ["Annual income", "Course"]);
});

test("new application prefill uses persisted profile values and leaves unsupported data blank", () => {
  const data = createApplicationProfilePrefill({
    fullName: "Ari Example Student",
    email: "student@example.test",
    courseName: "Science",
    instituteName: "Example College",
    annualIncome: { toString: () => "120000.00" },
    academicPercentage: 81.5,
  });

  assert.deepEqual(
    [data.personal.firstName, data.personal.middleName, data.personal.lastName],
    ["Ari", "Example", "Student"],
  );
  assert.equal(data.personal.emailAddress, "student@example.test");
  assert.equal(data.academic.course, "Science");
  assert.equal(data.academic.institutionName, "Example College");
  assert.equal(data.academic.previousResult, "81.5");
  assert.equal(data.family.annualIncome, "120000.00");
  assert.equal(data.personal.identityNumber, "");
  assert.equal(data.bank.accountNumber, "");
});

test("server-side step validation rejects missing fields before the next step", () => {
  const data = createEmptyApplicationData();
  const stepOneErrors = getApplicationStepValidationErrors(data, 1);
  const stepTwoErrors = getApplicationStepValidationErrors(data, 2);

  assert.ok(stepOneErrors.some((error) => error === "First name is required."));
  assert.ok(stepOneErrors.every((error) => !error.startsWith("Course or program")));
  assert.ok(stepTwoErrors.some((error) => error === "Course or program is required."));
});

test("document validation enforces content signatures, declared MIME, and size", () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

  assert.equal(
    getDocumentUploadValidationError({
      size: pdf.length,
      declaredMimeType: "application/pdf",
      bytes: pdf,
    }),
    null,
  );
  assert.equal(
    getDocumentUploadValidationError({
      size: pdf.length,
      declaredMimeType: "image/png",
      bytes: pdf,
    }),
    "File content does not match its declared type",
  );
  assert.equal(
    getDocumentUploadValidationError({
      size: 0,
      declaredMimeType: "application/pdf",
      bytes: pdf,
    }),
    "File must be between 1 byte and 5 MB",
  );
  assert.equal(
    getDocumentUploadValidationError({
      size: MAX_APPLICATION_DOCUMENT_SIZE + 1,
      declaredMimeType: "application/pdf",
      bytes: pdf,
    }),
    "File must be between 1 byte and 5 MB",
  );
  assert.equal(
    getDocumentUploadValidationError({
      size: 10,
      declaredMimeType: "application/pdf",
      bytes: new Uint8Array([0, 1, 2]),
    }),
    "Only valid PDF, JPEG and PNG files are accepted",
  );
});

test("application record lookup is constrained to its owner", () => {
  assert.deepEqual(
    getOwnedApplicationScope("application-1", "student-1"),
    { id: "application-1", studentId: "student-1" },
  );

  const source = readFileSync(
    join(process.cwd(), "app/student/applications/[applicationId]/page.tsx"),
    "utf8",
  );
  assert.match(source, /where:\s*getOwnedApplicationScope\(applicationId,\s*user\.student\.id\)/);
});

test("draft creation handles serializable conflicts without retrying as success", () => {
  assert.equal(isSerializableTransactionConflict({ code: "P2034" }), true);
  assert.equal(isSerializableTransactionConflict({ code: "P2002" }), false);
  assert.equal(isSerializableTransactionConflict(null), false);

  const source = readFileSync(
    join(process.cwd(), "app/api/student/applications/route.ts"),
    "utf8",
  );
  assert.match(source, /TransactionIsolationLevel\.Serializable/);
  assert.match(source, /status:\s*409/);
});

test("submitted applications remain immutable through draft and document APIs", () => {
  const draftRoute = readFileSync(
    join(process.cwd(), "app/api/student/applications/route.ts"),
    "utf8",
  );
  const documentRoute = readFileSync(
    join(process.cwd(), "app/api/student/applications/[applicationId]/documents/route.ts"),
    "utf8",
  );
  const submissionRoute = readFileSync(
    join(process.cwd(), "app/api/student/applications/[applicationId]/submit/route.ts"),
    "utf8",
  );

  assert.match(draftRoute, /existingDraft\.status !== ApplicationStatus\.DRAFT/);
  assert.match(documentRoute, /status:\s*ApplicationStatus\.DRAFT/);
  assert.match(submissionRoute, /status:\s*ApplicationStatus\.DRAFT/);
});

