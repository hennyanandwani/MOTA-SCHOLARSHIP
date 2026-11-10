import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { getInitialStudentAutoFillEnabled } from "../lib/auth/studentAutoFill";
import { getExistingUserRecoveryAction } from "../lib/auth/provisioningRecovery";
import { validateStudentProfileUpdate } from "../lib/studentProfileValidation";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test("missing default configuration disables Auto Fill and configured defaults are copied", () => {
  assert.equal(getInitialStudentAutoFillEnabled(null), false);
  assert.equal(getInitialStudentAutoFillEnabled(undefined), false);
  assert.equal(getInitialStudentAutoFillEnabled({ defaultAutoFillEnabled: false }), false);
  assert.equal(getInitialStudentAutoFillEnabled({ defaultAutoFillEnabled: true }), true);

  const provisioning = read("lib/auth/provision-student-profile.ts");
  assert.match(provisioning, /tx\.systemConfiguration\.findUnique\(\s*\{\s*where:\s*\{\s*id:\s*"default"/);
  assert.match(provisioning, /data:\s*\{\s*userId:\s*existingUser\.id,\s*rollNumber,\s*autoFillEnabled,/);
  assert.match(provisioning, /create:\s*\{\s*rollNumber,\s*autoFillEnabled\s*\}/);
});

test("migration initializes the singleton safely and existing students default to disabled", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read(
    "prisma/migrations/20261110102000_add_student_auto_fill/migration.sql",
  );

  assert.match(schema, /autoFillEnabled\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /model SystemConfiguration\s*\{[\s\S]*?id\s+String\s+@id\s+@default\("default"\)[\s\S]*?defaultAutoFillEnabled\s+Boolean\s+@default\(false\)/);
  assert.match(migration, /ADD COLUMN "autoFillEnabled" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /INSERT INTO "SystemConfiguration"[\s\S]*?ON CONFLICT \("id"\) DO NOTHING/);
});

test("provisioning reuses existing student profiles without changing their preference", () => {
  const provisioning = read("lib/auth/provision-student-profile.ts");
  assert.equal(
    getExistingUserRecoveryAction({
      id: "existing-user",
      role: "STUDENT",
      student: { id: "existing-student", autoFillEnabled: true },
    }),
    "reuse",
  );
  assert.match(provisioning, /existingUserAction === "reuse" && existingUser\)\s*\{\s*return existingUser;/);
  assert.doesNotMatch(provisioning, /tx\.student\.update/);
});

test("student profile API validation accepts only boolean student preferences", () => {
  assert.deepEqual(validateStudentProfileUpdate({ autoFillEnabled: true }), {
    ok: true,
    value: { autoFillEnabled: true },
  });
  assert.deepEqual(validateStudentProfileUpdate({ autoFillEnabled: false }), {
    ok: true,
    value: { autoFillEnabled: false },
  });
  assert.deepEqual(validateStudentProfileUpdate({ autoFillEnabled: "true" }), {
    ok: false,
    errors: { autoFillEnabled: "Enter a valid boolean value." },
  });
  assert.deepEqual(validateStudentProfileUpdate({ defaultAutoFillEnabled: true }), {
    ok: false,
    errors: { defaultAutoFillEnabled: "This profile field cannot be changed." },
  });

  const route = read("app/api/student/profile/route.ts");
  assert.match(route, /await requireStudent\(\)/);
  assert.match(route, /autoFillEnabled:\s*student\.autoFillEnabled/);
  assert.match(route, /where:\s*\{\s*id:\s*auth\.user\.student\.id\s*\}/);
  assert.doesNotMatch(route, /systemConfiguration/);
});
