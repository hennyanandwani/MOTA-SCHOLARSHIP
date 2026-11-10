import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  getStudentProfileSectionTimestampUpdates,
  validateStudentProfileUpdate,
} from "../lib/studentProfileValidation";

const route = readFileSync(
  join(process.cwd(), "app/api/student/profile/route.ts"),
  "utf8",
);

test("profile GET returns the authenticated user's profile, timestamps, Auto Fill, and bank fields", () => {
  assert.match(route, /export async function GET\(\)/);
  assert.match(route, /const auth = await requireStudent\(\);\s*if \(auth\.response\) return auth\.response;/);
  assert.match(route, /profile: toProfile\(auth\.user\)/);
  for (const field of [
    "autoFillEnabled",
    "firstName",
    "familyAnnualIncome",
    "accountNumber",
    "ifscCode",
    "personalInfoUpdatedAt",
    "contactInfoUpdatedAt",
    "academicInfoUpdatedAt",
    "familyInfoUpdatedAt",
    "bankInfoUpdatedAt",
  ]) {
    assert.match(route, new RegExp(`${field}: student\\.${field}`));
  }
  assert.match(route, /email: user\.email/);
});

test("both profile methods require student authentication and updates are scoped to that Student ID", () => {
  assert.equal((route.match(/await requireStudent\(\)/g) ?? []).length, 2);
  assert.match(route, /where:\s*\{\s*id:\s*auth\.user\.student\.id\s*\}/);
  assert.match(route, /where:\s*\{\s*id:\s*auth\.user\.id\s*\}/);
  assert.doesNotMatch(route, /where:\s*\{\s*id:\s*payload/);
});

test("valid partial personal and bank updates preserve strings and only accept supplied fields", () => {
  const result = validateStudentProfileUpdate({
    firstName: "Asha",
    dateOfBirth: "2004-02-29",
    mobileNumber: "+91 9876543210",
    accountNumber: "000123456789",
    ifscCode: "HDFC0000123",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    firstName: "Asha",
    dateOfBirth: new Date("2004-02-29T00:00:00.000Z"),
    mobileNumber: "+91 9876543210",
    accountNumber: "000123456789",
    ifscCode: "HDFC0000123",
  });
  assert.match(route, /data:\s*studentUpdate/);
});

test("validation rejects malformed payloads and invalid profile values", () => {
  for (const malformed of [null, [], "profile", 42]) {
    assert.equal(validateStudentProfileUpdate(malformed).ok, false);
  }

  const invalidUpdates: unknown[] = [
    { dateOfBirth: "2023-02-29" },
    { dateOfBirth: "2999-01-01" },
    { gender: "Unlisted option" },
    { category: "Other" },
    { mobileNumber: "1234567890" },
    { pinCode: "012345" },
    { familyAnnualIncome: -1 },
    { familyAnnualIncome: "12.345" },
    { familyMembers: 0 },
    { familyMembers: 1.5 },
    { admissionYear: 1800 },
    { admissionYear: new Date().getFullYear() + 2 },
    { expectedGraduationYear: new Date().getFullYear() + 16 },
    { ifscCode: "INVALID" },
    { accountNumber: "0012-3456" },
    { accountNumber: 123456789 },
    { accountHolderName: "x".repeat(121) },
    { email: "cannot-change@example.test" },
    { defaultAutoFillEnabled: true },
  ];

  for (const update of invalidUpdates) {
    assert.equal(
      validateStudentProfileUpdate(update).ok,
      false,
      `expected this update to be rejected: ${JSON.stringify(update)}`,
    );
  }
});

test("updating one section does not imply updates to other sections", () => {
  const result = validateStudentProfileUpdate({ address: "12 Main Road" });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.value, { address: "12 Main Road" });
  assert.deepEqual(
    getStudentProfileSectionTimestampUpdates(
      result.value,
      new Date("2026-11-10T00:00:00.000Z"),
    ),
    { contactInfoUpdatedAt: new Date("2026-11-10T00:00:00.000Z") },
  );
  assert.match(route, /getStudentProfileSectionTimestampUpdates\(validation\.value/);
});

test("only changed profile sections get timestamps; Auto Fill and ambiguous legacy income do not", () => {
  const updatedAt = new Date("2026-11-10T00:00:00.000Z");
  assert.deepEqual(
    getStudentProfileSectionTimestampUpdates(
      {
        firstName: "Asha",
        familyMembers: 4,
        accountNumber: "001234567890",
      },
      updatedAt,
    ),
    {
      personalInfoUpdatedAt: updatedAt,
      familyInfoUpdatedAt: updatedAt,
      bankInfoUpdatedAt: updatedAt,
    },
  );
  assert.deepEqual(
    getStudentProfileSectionTimestampUpdates(
      { autoFillEnabled: true, annualIncome: "1000.00" },
      updatedAt,
    ),
    {},
  );
});

test("Auto Fill remains independently updateable and account email cannot be patched", () => {
  assert.deepEqual(validateStudentProfileUpdate({ autoFillEnabled: false }), {
    ok: true,
    value: { autoFillEnabled: false },
  });
  assert.equal(validateStudentProfileUpdate({ email: "new@example.test" }).ok, false);
  assert.match(route, /autoFillEnabled:\s*student\.autoFillEnabled/);
  assert.doesNotMatch(route, /systemConfiguration/);
});

test("profile route does not log request or sensitive field values", () => {
  assert.match(route, /console\.error\("Unable to load student profile\."\)/);
  assert.match(route, /console\.error\("Unable to update student profile\."\)/);
  assert.doesNotMatch(
    route,
    /console\.(?:log|error|warn)\([^)]*(?:payload|accountNumber|ifscCode|stCertificateNumber|incomeCertificateNumber)/,
  );
});
