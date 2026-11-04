import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { getSafeAuthRedirectPath } from "../lib/auth/safeAuthRedirect";
import {
  getDraftLookupScope,
  getDraftLockFailure,
  shouldCleanupUploadedObject,
} from "../lib/applicationConcurrency";
import {
  getSubmissionFailureStatus,
  getSubmissionValidationFailure,
  SubmissionTransactionAbort,
} from "../lib/applicationSubmission";
import { demoApplicationData } from "../lib/applicationDraft";
import {
  getExistingUserRecoveryAction,
  getProvisioningUniqueConflictCode,
} from "../lib/auth/provisioningRecovery";
import {
  getStudentAccessFailure,
  hasStudentProfile,
} from "../lib/auth/studentAccessPolicy";
import { requireEnvironmentVariable } from "../lib/env";
import { getSupabasePublicConfig } from "../lib/supabase/config";
import { validateStudentProfileUpdate } from "../lib/studentProfileValidation";

test("auth redirects accept internal paths and preserve query parameters", () => {
  assert.equal(getSafeAuthRedirectPath("/student"), "/student");
  assert.equal(
    getSafeAuthRedirectPath("/student/applications?tab=active"),
    "/student/applications?tab=active",
  );
  assert.equal(
    getSafeAuthRedirectPath("/student?search=financial%20aid"),
    "/student?search=financial%20aid",
  );
  assert.equal(getSafeAuthRedirectPath("/admin"), "/admin");
});

test("auth redirects reject external, ambiguous, and encoded destinations", () => {
  const unsafeDestinations = [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%5cevil.example",
    "/%2f%2fevil.example",
    "/%252f%252fevil.example",
    "/..//evil.example",
    "/%2e%2e//evil.example",
    "/%",
    "javascript:alert(1)",
    "data:text/html,test",
  ];

  for (const destination of unsafeDestinations) {
    assert.equal(
      getSafeAuthRedirectPath(destination),
      "/student",
      `expected ${destination} to use the safe fallback`,
    );
  }
});

test("auth redirect uses the fallback when the destination is missing", () => {
  assert.equal(getSafeAuthRedirectPath(null), "/student");
  assert.equal(getSafeAuthRedirectPath(""), "/student");
});

test("student API access policy distinguishes unauthenticated, wrong-role, and incomplete users", () => {
  assert.deepEqual(getStudentAccessFailure(null, false), {
    status: 401,
    message: "Authentication required.",
  });
  assert.deepEqual(getStudentAccessFailure("ADMIN", true), {
    status: 403,
    message: "Student access required.",
  });
  assert.equal(getStudentAccessFailure("STUDENT", false)?.status, 409);
  assert.equal(getStudentAccessFailure("STUDENT", true), null);
  assert.equal(hasStudentProfile({ role: "STUDENT", student: { id: "s1" } }), true);
  assert.equal(hasStudentProfile({ role: "ADMIN", student: { id: "s1" } }), false);
});

test("required environment variables reject missing and whitespace-only values without exposing values", () => {
  assert.equal(
    requireEnvironmentVariable("DATABASE_URL", "postgresql://db.invalid"),
    "postgresql://db.invalid",
  );

  for (const value of [undefined, "", "   "]) {
    assert.throws(
      () => requireEnvironmentVariable("DATABASE_URL", value),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /DATABASE_URL/);
        assert.doesNotMatch(error.message, /postgresql|secret|password/i);
        return true;
      },
    );
  }
});

test("Supabase browser configuration validates public variables without disclosing their values", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    assert.deepEqual(getSupabasePublicConfig(), {
      url: "https://project.supabase.co",
      publishableKey: "test-publishable-key",
    });

    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "   ";
    assert.throws(
      () => getSupabasePublicConfig(),
      (error: unknown) =>
        error instanceof Error &&
        error.message.includes("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") &&
        !error.message.includes("test-publishable-key"),
    );

    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    assert.throws(
      () => getSupabasePublicConfig(),
      /must be a valid HTTP or HTTPS URL/,
    );
  } finally {
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    }

    if (previousKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
    }
  }
});

test("document storage routes use the server-only Supabase secret", () => {
  const adminRoute = readFileSync(
    join(
      process.cwd(),
      "app/api/admin/applications/[applicationNumber]/documents/[documentId]/route.ts",
    ),
    "utf8",
  );
  const studentRoute = readFileSync(
    join(
      process.cwd(),
      "app/api/student/applications/[applicationId]/documents/route.ts",
    ),
    "utf8",
  );

  assert.match(adminRoute, /requireEnvironmentVariable\(\s*'SUPABASE_SECRET_KEY'/);
  assert.match(adminRoute, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.match(studentRoute, /requireEnvironmentVariable\(\s*"SUPABASE_SECRET_KEY"/);
  assert.match(studentRoute, /process\.env\.SUPABASE_SECRET_KEY/);
});

test("application code contains no public-prefixed Supabase secret reference", () => {
  const publicSecretVariable = ["NEXT_PUBLIC_", "SUPABASE_SECRET_KEY"].join("");
  const appRoot = join(process.cwd(), "app");

  function collectSourceFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(path);
      return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [path] : [];
    });
  }

  for (const file of collectSourceFiles(appRoot)) {
    assert.equal(
      readFileSync(file, "utf8").includes(publicSecretVariable),
      false,
      `${file} must not reference the public-prefixed secret`,
    );
  }
});

test("provisioning recovery reuses existing students and rejects ADMIN conversion", () => {
  const existingStudent = {
    id: "student-user",
    role: "STUDENT",
    student: { id: "student-profile" },
  };

  assert.equal(getExistingUserRecoveryAction(existingStudent), "reuse");
  assert.equal(getExistingUserRecoveryAction({ ...existingStudent, student: null }), "provision");
  assert.equal(
    getExistingUserRecoveryAction({ ...existingStudent, role: "ADMIN" }),
    "role_conflict",
  );
});

test("provisioning conflict recovery ignores the user's own email and reports duplicate roll numbers", () => {
  assert.equal(
    getProvisioningUniqueConflictCode("existing-user", "existing-user", null),
    null,
  );
  assert.equal(
    getProvisioningUniqueConflictCode("existing-user", "existing-user", "other-student"),
    "ROLL_NUMBER_ALREADY_REGISTERED",
  );
  assert.equal(
    getProvisioningUniqueConflictCode("existing-user", "other-user", null),
    "EMAIL_ALREADY_LINKED",
  );
});

test("draft write conflicts distinguish missing ownership from non-editable state", () => {
  assert.equal(getDraftLockFailure(null), "not_found");
  assert.equal(getDraftLockFailure("SUBMITTED"), "not_editable");
  assert.equal(getDraftLockFailure("DRAFT"), "not_editable");
});

test("draft lookup is scoped to the requested academic year", () => {
  assert.deepEqual(
    getDraftLookupScope("student-1", "scheme-1", "2025-2026"),
    {
      studentId: "student-1",
      schemeId: "scheme-1",
      academicYear: "2025-2026",
    },
  );
  assert.notDeepEqual(
    getDraftLookupScope("student-1", "scheme-1", "2025-2026"),
    getDraftLookupScope("student-1", "scheme-1", "2026-2027"),
  );

  const source = readFileSync(
    join(process.cwd(), "app/api/student/applications/route.ts"),
    "utf8",
  );
  assert.match(
    source,
    /getDraftLookupScope\(\s*user\.student\.id,\s*scheme\.id,\s*academicYear,\s*\)/,
  );
});

test("student profile updates validate supported stored fields and reject account-owned fields", () => {
  assert.deepEqual(
    validateStudentProfileUpdate({
      fullName: "  Mira Patel ",
      subCaste: "  Bhil ",
      annualIncome: "250000.50",
      academicPercentage: "82.5",
      courseName: " Computer Science ",
      instituteName: " Sample College ",
    }),
    {
      ok: true,
      value: {
        fullName: "Mira Patel",
        subCaste: "Bhil",
        annualIncome: "250000.50",
        academicPercentage: "82.5",
        courseName: "Computer Science",
        instituteName: "Sample College",
      },
    },
  );
  assert.deepEqual(
    validateStudentProfileUpdate({ annualIncome: "", subCaste: null }),
    { ok: true, value: { annualIncome: null, subCaste: null } },
  );
  assert.equal(validateStudentProfileUpdate({ email: "other@example.invalid" }).ok, false);
  assert.equal(validateStudentProfileUpdate({ rollNumber: "OTHER" }).ok, false);
  assert.equal(validateStudentProfileUpdate({ fullName: "  " }).ok, false);
  assert.equal(validateStudentProfileUpdate({ academicPercentage: "100.01" }).ok, false);
  assert.equal(validateStudentProfileUpdate({ annualIncome: "1e6" }).ok, false);
  assert.equal(validateStudentProfileUpdate({}).ok, false);
});

test("student profile API is student-guarded and updates only the authenticated profile", () => {
  const source = readFileSync(
    join(process.cwd(), "app/api/student/profile/route.ts"),
    "utf8",
  );
  assert.equal((source.match(/requireStudent\(\)/g) ?? []).length, 2);
  assert.match(source, /where:\s*\{\s*id:\s*auth\.user\.id\s*\}/);
  assert.match(source, /where:\s*\{\s*id:\s*auth\.user\.student\.id\s*\}/);
  assert.match(source, /validateStudentProfileUpdate\(payload\)/);
  assert.doesNotMatch(source, /scholarshipApplication/);
});

test("a newly uploaded object is eligible for cleanup only before metadata commits", () => {
  assert.equal(shouldCleanupUploadedObject(false), true);
  assert.equal(shouldCleanupUploadedObject(true), false);
  assert.equal(shouldCleanupUploadedObject(false, true), false);
});

test("draft saves require an owned DRAFT final write and supplied IDs cannot fall through to create", () => {
  const source = readFileSync(
    join(process.cwd(), "app/api/student/applications/route.ts"),
    "utf8",
  );
  assert.match(
    source,
    /updateMany\(\{[\s\S]*?where:\s*\{[\s\S]*?id:\s*existingDraft\.id,\s*studentId:\s*user\.student\.id,\s*status:\s*ApplicationStatus\.DRAFT/,
  );
  assert.match(source, /body\.applicationId !== undefined && !existingDraft/);
  assert.match(source, /if \(existingDraft\) \{/);
});

test("submission and document metadata writes lock the owned DRAFT application before reading or mutating", () => {
  const submitSource = readFileSync(
    join(
      process.cwd(),
      "app/api/student/applications/[applicationId]/submit/route.ts",
    ),
    "utf8",
  );
  const documentSource = readFileSync(
    join(
      process.cwd(),
      "app/api/student/applications/[applicationId]/documents/route.ts",
    ),
    "utf8",
  );
  const submitLockPosition = submitSource.indexOf("const draftLock =");
  const submitReadPosition = submitSource.indexOf(
    "const application = await tx.scholarshipApplication.findFirst",
  );
  const documentLockPosition = documentSource.indexOf("const draftLock =");
  const documentWritePosition = documentSource.indexOf(
    "await tx.applicationDocument.update",
  );

  assert.ok(submitLockPosition >= 0 && submitLockPosition < submitReadPosition);
  assert.ok(documentLockPosition >= 0 && documentLockPosition < documentWritePosition);
  assert.match(submitSource, /studentId,\s*status:\s*ApplicationStatus\.DRAFT/);
  assert.match(documentSource, /studentId:\s*user\.student\.id,\s*status:\s*ApplicationStatus\.DRAFT/);
});

test("document replacement removes the old object only after metadata persistence", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/api/student/applications/[applicationId]/documents/route.ts",
    ),
    "utf8",
  );
  const commitPosition = source.indexOf("metadataCommitted = true");
  const oldObjectCleanupPosition = source.indexOf(
    "remove([metadataResult.previousStoragePath])",
  );
  const cleanupGatePosition = source.indexOf(
    "shouldCleanupUploadedObject(",
  );

  assert.ok(commitPosition >= 0 && commitPosition < oldObjectCleanupPosition);
  assert.ok(cleanupGatePosition > oldObjectCleanupPosition);
});

function validSubmissionInput() {
  const requiredDocumentTypes = ["IDENTITY_PROOF", "MARKSHEET"];
  return {
    schemeIsActive: true,
    formData: demoApplicationData,
    currentStep: 4,
    accountNumberConfirmed: true,
    declarations: [true, true, true, true],
    documents: requiredDocumentTypes.map((type) => ({
      type,
      verificationStatus: "VERIFIED",
    })),
    requiredDocumentTypes,
    documentLabels: {
      IDENTITY_PROOF: "Identity Document",
      MARKSHEET: "Academic Marksheet",
    },
  };
}

test("submission validation rejects invalid application form data", () => {
  const failure = getSubmissionValidationFailure({
    ...validSubmissionInput(),
    formData: null,
  });

  assert.equal(failure?.kind, "invalid_application");
  if (failure?.kind === "invalid_application") {
    assert.deepEqual(failure.errors, [
      "The saved application data is incomplete or invalid.",
    ]);
  }
});

test("submission validation rejects missing required documents", () => {
  const failure = getSubmissionValidationFailure({
    ...validSubmissionInput(),
    documents: [],
  });

  assert.deepEqual(failure, {
    kind: "missing_documents",
    documents: ["Identity Document", "Academic Marksheet"],
  });
});

test("submission validation rejects failed step, account confirmation, and declarations", () => {
  const failure = getSubmissionValidationFailure({
    ...validSubmissionInput(),
    currentStep: 3,
    accountNumberConfirmed: false,
    declarations: [true, false, true, true],
  });

  assert.equal(failure?.kind, "invalid_application");
  if (failure?.kind === "invalid_application") {
    assert.deepEqual(failure.errors, [
      "Complete all application steps before submitting.",
      "Account numbers must match before submitting.",
      "Accept all required declarations before submitting.",
    ]);
  }
});

test("submission validation aborts are typed and preserve existing response status codes", () => {
  const validationFailure = getSubmissionValidationFailure({
    ...validSubmissionInput(),
    formData: null,
  });
  assert.ok(validationFailure);
  const abort = new SubmissionTransactionAbort(validationFailure);

  assert.ok(abort instanceof SubmissionTransactionAbort);
  assert.equal(abort.result.kind, "invalid_application");
  assert.equal(getSubmissionFailureStatus("not_found"), 404);
  assert.equal(getSubmissionFailureStatus("not_draft"), 409);
  assert.equal(getSubmissionFailureStatus("inactive_scheme"), 409);
  assert.equal(getSubmissionFailureStatus("invalid_application"), 422);
  assert.equal(getSubmissionFailureStatus("missing_documents"), 422);
});

test("valid submission remains eligible for the existing SUBMITTED transition", () => {
  assert.equal(getSubmissionValidationFailure(validSubmissionInput()), null);

  const source = readFileSync(
    join(
      process.cwd(),
      "app/api/student/applications/[applicationId]/submit/route.ts",
    ),
    "utf8",
  );
  assert.match(source, /status:\s*ApplicationStatus\.SUBMITTED/);
  assert.match(source, /return \{ kind: "submitted", application: submitted \}/);
});

test("submission handler catches only its typed transaction abort and rethrows other errors", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/api/student/applications/[applicationId]/submit/route.ts",
    ),
    "utf8",
  );

  assert.match(source, /throw new SubmissionTransactionAbort\(validationFailure\)/);
  assert.match(
    source,
    /catch \(error\) \{\s*if \(!\(error instanceof SubmissionTransactionAbort\)\) throw error;\s*result = error\.result;/,
  );
});
