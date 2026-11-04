import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  isSchemeUniqueConflict,
  validateSchemeCreateInput,
  validateSchemeUpdateInput,
} from "../lib/scholarshipSchemeValidation";

const root = process.cwd();

test("scheme creation normalizes supported fields and defaults to active", () => {
  assert.deepEqual(
    validateSchemeCreateInput({
      name: "  STEM Fellowship ",
      type: "FELLOWSHIP",
      description: "  Support for study  ",
    }),
    {
      success: true,
      value: {
        name: "STEM Fellowship",
        type: "FELLOWSHIP",
        description: "Support for study",
        isActive: true,
      },
    },
  );
});

test("scheme validation rejects unsupported fields and invalid values", () => {
  assert.equal(
    validateSchemeCreateInput({
      name: "Scheme",
      type: "SCHOLARSHIP",
      monetaryBenefit: 10000,
    }).success,
    false,
  );
  assert.equal(
    validateSchemeCreateInput({ name: "  ", type: "SCHOLARSHIP" }).success,
    false,
  );
  assert.equal(
    validateSchemeCreateInput({ name: "Scheme", type: "OTHER" }).success,
    false,
  );
  assert.equal(
    validateSchemeCreateInput({
      name: "Scheme",
      type: "SCHOLARSHIP",
      description: "x".repeat(4001),
    }).success,
    false,
  );
});

test("scheme edits accept partial changes but reject empty or malformed updates", () => {
  assert.deepEqual(validateSchemeUpdateInput({ isActive: false }), {
    success: true,
    value: { isActive: false },
  });
  assert.deepEqual(validateSchemeUpdateInput({ description: "" }), {
    success: true,
    value: { description: null },
  });
  assert.equal(validateSchemeUpdateInput({}).success, false);
  assert.equal(validateSchemeUpdateInput({ isActive: "false" }).success, false);
});

test("scheme write conflicts are recognized without exposing database errors", () => {
  assert.equal(isSchemeUniqueConflict({ code: "P2002" }), true);
  assert.equal(isSchemeUniqueConflict({ code: "P2025" }), false);
  assert.equal(isSchemeUniqueConflict(new Error("failure")), false);
});

test("scheme write APIs require admin authorization and student listing filters inactive schemes", () => {
  const adminCollection = readFileSync(join(root, "app/api/admin/schemes/route.ts"), "utf8");
  const adminItem = readFileSync(join(root, "app/api/admin/schemes/[schemeId]/route.ts"), "utf8");
  const studentList = readFileSync(join(root, "app/api/student/schemes/route.ts"), "utf8");
  const studentDashboard = readFileSync(join(root, "app/student/page.tsx"), "utf8");
  const adminClient = readFileSync(join(root, "components/admin/schemes/DatabaseSchemeManagement.tsx"), "utf8");

  assert.match(adminCollection, /requireAdmin\(\)/);
  assert.match(adminItem, /requireAdmin\(\)/);
  assert.match(adminCollection, /validateSchemeCreateInput/);
  assert.match(adminItem, /validateSchemeUpdateInput/);
  assert.match(studentList, /requireStudent\(\)/);
  assert.match(studentList, /where:\s*\{\s*isActive:\s*true\s*\}/);
  assert.match(studentDashboard, /where:\s*\{\s*isActive:\s*true\s*\}/);
  assert.doesNotMatch(studentDashboard, /schemeCatalog/);
  assert.match(adminClient, /editingId !== "__new__"/);
  assert.match(adminClient, /method:\s*schemeId\s*\?\s*"PATCH"\s*:\s*"POST"/);
});
