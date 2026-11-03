import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { getSafeAuthRedirectPath } from "../lib/auth/safeAuthRedirect";
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
