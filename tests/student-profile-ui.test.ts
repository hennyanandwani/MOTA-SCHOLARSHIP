import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const client = readFileSync(
  join(process.cwd(), "components/student/profile/ProfilePageClient.tsx"),
  "utf8",
);
const header = readFileSync(
  join(process.cwd(), "components/student/profile/ProfileHeader.tsx"),
  "utf8",
);

test("profile UI renders five independently saved sections with the requested fields", () => {
  for (const section of [
    "Personal Information",
    "Contact & Address",
    "Academic Information",
    "Family & Income",
    "Bank Details",
  ]) {
    assert.ok(client.includes(`title: '${section}'`), `missing ${section}`);
  }
  for (const field of [
    "firstName",
    "middleName",
    "lastName",
    "dateOfBirth",
    "gender",
    "category",
    "subCaste",
    "stCertificateNumber",
    "mobileNumber",
    "address",
    "villageTown",
    "district",
    "state",
    "pinCode",
    "academicLevel",
    "courseName",
    "specialization",
    "instituteName",
    "institutionType",
    "universityBoard",
    "currentYearSemester",
    "admissionYear",
    "academicSession",
    "previousQualification",
    "previousResult",
    "enrollmentNumber",
    "expectedGraduationYear",
    "guardianName",
    "motherName",
    "familyAnnualIncome",
    "incomeCertificateNumber",
    "guardianOccupation",
    "familyMembers",
    "residentialStatus",
    "accountHolderName",
    "bankName",
    "accountNumber",
    "ifscCode",
    "branchName",
  ]) {
    assert.ok(client.includes(`key: '${field}'`), `missing profile field ${field}`);
  }
  assert.match(client, /body:\s*JSON\.stringify\(updates\)/);
  assert.match(client, /getSectionValues\(nextProfile, section\)/);
});

test("profile UI shows server email read-only, masks account number, and uses saved timestamps", () => {
  assert.match(client, /value=\{profile\.email\}\s*readOnly/);
  assert.match(client, /showAccountNumber \? 'text' : 'password'/);
  assert.match(client, /Show account number/);
  assert.match(client, /Hide account number/);
  assert.match(client, /profile\[section\.timestamp\]/);
  assert.match(client, /if \(!value\) return null/);
});

test("profile completion is derived from populated saved fields and Auto Fill remains server-backed", () => {
  assert.match(client, /populatedFieldCount\(profile\) \/ fieldKeys\.length/);
  assert.match(client, /PATCH/);
  assert.match(client, /JSON\.stringify\(\{ autoFillEnabled: enabled \}\)/);
  assert.match(client, /aria-checked=\{profile\.autoFillEnabled\}/);
  assert.match(client, /Completion does not affect scholarship applications/);
  assert.doesNotMatch(client, /api\/student\/applications|applicationDraft/);
  assert.match(header, /saved personal, contact, academic, family and bank information/);
});
