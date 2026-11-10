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
  getEffectiveRequiredDocumentTypes,
  getRequiredDocumentTypesFromPolicySnapshot,
  requiredApplicationDocumentTypes,
} from "../lib/applicationRequirements";
import { createEmptyApplicationDocuments } from "../lib/applicationDocuments";
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

test("Auto Fill OFF leaves all profile-derived application values blank", () => {
  const data = createApplicationProfilePrefill({
    autoFillEnabled: false,
    email: "student@example.test",
    firstName: "Ari",
    courseName: "Science",
    instituteName: "Example College",
    familyAnnualIncome: "120000.00",
    accountNumber: "0000123456",
  });

  assert.deepEqual(data, createEmptyApplicationData());
});

test("Auto Fill ON maps only exact structured profile fields and leaves ambiguous values blank", () => {
  const profile = {
    autoFillEnabled: true,
    email: "student@example.test",
    firstName: "Ari",
    middleName: "Example",
    lastName: "Student",
    dateOfBirth: "2005-08-12",
    gender: "Other",
    category: "Scheduled Tribe",
    stCertificateNumber: "ST-123",
    mobileNumber: "9876543210",
    address: "12 Example Road",
    villageTown: "Example Town",
    district: "Example District",
    state: "Gujarat",
    pinCode: "360001",
    academicLevel: "Undergraduate",
    courseName: "Science",
    specialization: "Physics",
    instituteName: "Example College",
    institutionType: "Government",
    universityBoard: "Example University",
    currentYearSemester: "Year 2",
    admissionYear: 2024,
    academicSession: "2026-27",
    previousQualification: "Class 12",
    previousResult: "81.5%",
    enrollmentNumber: "ENR-123",
    expectedGraduationYear: 2027,
    guardianName: "Parent Example",
    motherName: "Mother Example",
    familyAnnualIncome: { toString: () => "120000.00" },
    incomeCertificateNumber: "INC-123",
    guardianOccupation: "Teacher",
    familyMembers: 4,
    residentialStatus: "Rural",
    accountHolderName: "Ari Example",
    bankName: "Example Bank",
    accountNumber: "0000123456",
    ifscCode: "EXAM0001234",
    branchName: "Main Branch",
    annualIncome: "999999",
    academicPercentage: 99,
    subCaste: "Example Sub-caste",
    rollNumber: "ROLL-123",
  };
  const data = createApplicationProfilePrefill(profile);

  assert.deepEqual(
    [data.personal.firstName, data.personal.middleName, data.personal.lastName],
    ["Ari", "Example", "Student"],
  );
  assert.equal(data.personal.emailAddress, "student@example.test");
  assert.equal(data.personal.dateOfBirth, "2005-08-12");
  assert.equal(data.personal.identityNumber, "");
  assert.equal(data.academic.course, "Science");
  assert.equal(data.academic.institutionName, "Example College");
  assert.equal(data.academic.previousResult, "81.5%");
  assert.equal(data.family.annualIncome, "120000.00");
  assert.equal(data.bank.accountNumber, "0000123456");
  assert.equal(data.bank.confirmAccountNumber, "");
  assert.equal(data.family.annualIncome, "120000.00");
  assert.notEqual(data.family.annualIncome, profile.annualIncome);
});

test("application wizard prioritizes supported drafts and blocks loading failures or unsupported drafts", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  const restoredDraft = wizard.indexOf("setApplication(restoredData)");
  const noDraftPrefill = wizard.indexOf("setApplication(initialData ?? createEmptyApplicationData())");

  assert.match(wizard, /useState<ApplicationData>\(\s*createEmptyApplicationData,/);
  assert.ok(restoredDraft >= 0 && noDraftPrefill > restoredDraft);
  assert.match(wizard, /if \(!restoredData\)\s*\{\s*setDraftLoadError/);
  assert.match(wizard, /setDraftLoadError\(\s*error instanceof Error/);
  assert.match(wizard, /if \(draftLoadError\)\s*\{\s*return/);
  assert.match(wizard, /if \(!hasLoadedDraft\)\s*\{\s*return/);
  assert.match(wizard, /setHasLoadedDraft\(true\)/);
  assert.doesNotMatch(wizard, /finally\s*\{\s*if \(active\) setHasLoadedDraft\(true\)/);
  assert.match(wizard, /if \(!hasLoadedDraft \|\| savingRef\.current\) return false/);
});

test("confirmed absence of a matching draft enables a new application with its selected prefill", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  assert.match(
    wizard,
    /if \(existingDraft\)\s*\{[\s\S]*?\}\s*else\s*\{\s*setApplication\(initialData \?\? createEmptyApplicationData\(\)\);\s*\}\s*setHasLoadedDraft\(true\)/,
  );
});

test("profile prefill does not consume ambiguous profile fields", () => {
  const source = readFileSync(
    join(process.cwd(), "lib/applicationDraft.ts"),
    "utf8",
  );
  const prefill = source.slice(
    source.indexOf("export function createApplicationProfilePrefill"),
    source.indexOf("function profileValue"),
  );

  assert.doesNotMatch(prefill, /profile\.(?:fullName|annualIncome|academicPercentage|subCaste|rollNumber|confirmAccountNumber)/);
});

test("prefilled application data remains editable through the existing application form", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  assert.match(wizard, /onChange=\{\(field, value\) => updateApplicationField\('personal', field, value\)\}/);
  assert.match(wizard, /onChange=\{\(field, value\) => updateApplicationField\('academic', field, value\)\}/);
  assert.match(wizard, /fieldset disabled=\{!hasLoadedDraft \|\| savingToServer\}/);
});

test("application page passes only the authenticated student's profile fields to prefill", () => {
  const page = readFileSync(
    join(process.cwd(), "app/student/schemes/[schemeId]/apply/page.tsx"),
    "utf8",
  );
  assert.match(page, /autoFillEnabled: user\.student\.autoFillEnabled/);
  assert.match(page, /firstName: user\.student\.firstName/);
  assert.match(page, /familyAnnualIncome: user\.student\.familyAnnualIncome/);
  assert.doesNotMatch(page, /fullName: user\.fullName|annualIncome: user\.student|academicPercentage: user\.student|rollNumber: user\.student/);
});

test("application prefill fixture retains identity and bank confirmation fields blank when absent", () => {
  const data = createApplicationProfilePrefill({
    autoFillEnabled: true,
    email: "student@example.test",
    firstName: "Ari",
  });
  assert.equal(data.personal.identityNumber, "");
  assert.equal(data.bank.confirmAccountNumber, "");
  assert.equal(data.personal.middleName, "");
  assert.equal(data.academic.course, "");
  assert.equal(data.family.annualIncome, "");
});

test("prefill values are application state only and do not write drafts during initialization", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  assert.match(wizard, /const \[application, setApplication\] = useState<ApplicationData>\(\s*createEmptyApplicationData,/);
  assert.match(wizard, /if \(!hasLoadedDraft \|\| savingRef\.current\) return false/);
});

test("form profile values remain present when Auto Fill is enabled", () => {
  const data = createApplicationProfilePrefill({
    autoFillEnabled: true,
    email: "student@example.test",
    firstName: "Ari",
    middleName: "Example",
    lastName: "Student",
    courseName: "Science",
    instituteName: "Example College",
    familyAnnualIncome: "120000",
  });
  assert.equal(data.personal.firstName, "Ari");
  assert.equal(data.academic.course, "Science");
  assert.equal(data.academic.institutionName, "Example College");
  assert.equal(data.family.annualIncome, "120000");
});

test("existing application restore helper remains the supported-draft source", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  assert.match(wizard, /const restoredData = restoreApplicationData\(existingDraft\.formData\)/);
  assert.match(wizard, /setApplication\(restoredData\)/);
});

test("draft-load failure does not enable draft operations", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  assert.match(wizard, /catch \(error\) \{\s*if \(active\) \{\s*setDraftLoadError/);
  assert.match(wizard, /if \(!hasLoadedDraft \|\| savingRef\.current\) return false/);
  assert.match(wizard, /disabled=\{!hasLoadedDraft \|\| savingToServer\}/);
});

test("unsupported drafts stop before assigning profile prefill", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  const unsupportedIndex = wizard.indexOf("if (!restoredData)");
  const profileAssignmentIndex = wizard.indexOf("setApplication(initialData ?? createEmptyApplicationData())");
  assert.ok(unsupportedIndex >= 0 && profileAssignmentIndex > unsupportedIndex);
  assert.match(wizard, /setDraftLoadError\('Your saved application has an unsupported format/);
  assert.match(wizard, /if \(draftLoadError\)\s*\{\s*return/);
});

test("Auto Fill is a boolean prefill gate", () => {
  const source = readFileSync(
    join(process.cwd(), "lib/applicationDraft.ts"),
    "utf8",
  );
  assert.match(source, /autoFillEnabled: boolean/);
  assert.match(source, /if \(!profile\.autoFillEnabled\) return data/);
});

test("application form keeps prefilled fields editable after safe draft initialization", () => {
  const form = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationStepForms.tsx"),
    "utf8",
  );
  assert.match(form, /onChange=\{onChange\}/);
  assert.match(form, /onFamilyChange/);
  assert.match(form, /onBankChange/);
});

test("no profile prefill is applied to an existing supported draft", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  const draftBranchStart = wizard.indexOf("if (existingDraft)");
  const noDraftBranch = wizard.indexOf("} else {", draftBranchStart);
  const restored = wizard.indexOf("setApplication(restoredData)", draftBranchStart);
  const prefill = wizard.indexOf("setApplication(initialData ?? createEmptyApplicationData())", noDraftBranch);
  assert.ok(draftBranchStart >= 0 && restored > draftBranchStart);
  assert.ok(noDraftBranch > restored && prefill > noDraftBranch);
});

test("new application starts from empty data until draft lookup confirms no existing draft", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  assert.match(wizard, /useState<ApplicationData>\(\s*createEmptyApplicationData,/);
  assert.match(wizard, /const applications = await fetchStudentApplications\(\)/);
  assert.match(wizard, /else\s*\{\s*setApplication\(initialData \?\? createEmptyApplicationData\(\)\)/);
});

test("draft failure state blocks application flow rather than exposing navigation controls", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  const failureGuard = wizard.indexOf("if (draftLoadError)");
  const normalNavigation = wizard.indexOf('<nav aria-label="Breadcrumb"', failureGuard);
  assert.ok(failureGuard >= 0);
  assert.ok(normalNavigation > failureGuard);
  assert.match(wizard.slice(failureGuard, normalNavigation), /role="alert"/);
  assert.doesNotMatch(wizard.slice(failureGuard, normalNavigation), /<Link|button/);
});

test("the prefill builder returns an empty application when Auto Fill is disabled", () => {
  const data = createApplicationProfilePrefill({
    autoFillEnabled: false,
    email: "student@example.test",
    firstName: "Ari",
    courseName: "Science",
  });
  assert.deepEqual(data, createEmptyApplicationData());
});

test("saved-draft loading errors leave hasLoadedDraft false", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  const catchBlock = wizard.slice(wizard.indexOf("} catch (error) {"), wizard.indexOf("\n      }\n    }", wizard.indexOf("} catch (error) {")));
  assert.match(catchBlock, /setDraftLoadError/);
  assert.doesNotMatch(catchBlock, /setHasLoadedDraft\(true\)/);
});

test("the saved draft selection is resolved before the new-application prefill branch", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  assert.ok(wizard.indexOf("const existingDraft = applications.find") < wizard.indexOf("setApplication(initialData ?? createEmptyApplicationData())"));
});

test("confirmed no-draft result is the only initialData assignment path", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  const initialDataWrites = [...wizard.matchAll(/setApplication\(initialData \?\? createEmptyApplicationData\(\)\)/g)];
  assert.equal(initialDataWrites.length, 1);
  assert.match(wizard, /if \(existingDraft\)[\s\S]*?else\s*\{\s*setApplication\(initialData \?\? createEmptyApplicationData\(\)\)/);
});

test("wizard prevents draft writes before successful draft lookup", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  assert.match(wizard, /async function saveDraft\(step: ApplicationStep\): Promise<boolean> \{\s*if \(!hasLoadedDraft \|\| savingRef\.current\) return false/);
});

test("Auto Fill gate is independent of the existing draft restore path", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  const draftFetch = wizard.indexOf("const applications = await fetchStudentApplications()");
  const autoFillBranch = wizard.indexOf("setApplication(initialData ?? createEmptyApplicationData())");
  assert.ok(draftFetch >= 0 && autoFillBranch > draftFetch);
});

test("unsupported saved draft never reaches navigation or save controls", () => {
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  const unsupportedBranch = wizard.indexOf("setDraftLoadError('Your saved application has an unsupported format");
  const blockingReturn = wizard.indexOf("if (draftLoadError)");
  assert.ok(unsupportedBranch >= 0 && blockingReturn > unsupportedBranch);
  assert.match(wizard, /if \(draftLoadError\)\s*\{\s*return/);
});

test("Auto Fill does not derive name fields from full name", () => {
  const source = readFileSync(
    join(process.cwd(), "lib/applicationDraft.ts"),
    "utf8",
  );
  const prefill = source.slice(source.indexOf("export function createApplicationProfilePrefill"), source.indexOf("function profileValue"));
  assert.doesNotMatch(prefill, /nameParts|fullName\.trim/);
});

test("scheme-specific required documents drive student UI while legacy schemes keep all seven", () => {
  const schemeTypes = [
    "INCOME_CERTIFICATE",
    "MARKSHEET",
    "CASTE_CERTIFICATE",
  ];
  assert.deepEqual(getEffectiveRequiredDocumentTypes(schemeTypes), schemeTypes);
  assert.deepEqual(
    createEmptyApplicationDocuments(schemeTypes).map((document) => document.id),
    ["st-certificate", "income-certificate", "previous-marksheet"],
  );
  assert.deepEqual(
    getEffectiveRequiredDocumentTypes(null),
    requiredApplicationDocumentTypes,
  );
  assert.deepEqual(
    getRequiredDocumentTypesFromPolicySnapshot({
      schemaVersion: 1,
      requiredDocumentTypes: schemeTypes,
    }),
    schemeTypes,
  );
  assert.deepEqual(getRequiredDocumentTypesFromPolicySnapshot(null), requiredApplicationDocumentTypes);

  const workflowPage = readFileSync(
    join(process.cwd(), "app/student/schemes/[schemeId]/apply/documents/page.tsx"),
    "utf8",
  );
  const reviewPage = readFileSync(
    join(process.cwd(), "app/student/schemes/[schemeId]/apply/review/page.tsx"),
    "utf8",
  );
  const wizard = readFileSync(
    join(process.cwd(), "components/student/application/ApplicationWizard.tsx"),
    "utf8",
  );
  assert.match(workflowPage, /requiredDocumentTypes=\{scheme\.requiredDocumentTypes\}/);
  assert.match(reviewPage, /requiredDocumentTypes=\{scheme\.requiredDocumentTypes\}/);
  assert.match(wizard, /Required documents:/);
});

test("published policy document requirements are read before submission validation", () => {
  const submissionRoute = readFileSync(
    join(
      process.cwd(),
      "app/api/student/applications/[applicationId]/submit/route.ts",
    ),
    "utf8",
  );
  const policyRead = submissionRoute.indexOf(
    'tx.scholarshipVerificationPolicy.findFirst',
  );
  const validation = submissionRoute.indexOf(
    'getSubmissionValidationFailure({',
  );
  assert.ok(policyRead >= 0 && policyRead < validation);
  assert.match(submissionRoute, /requiredDocumentTypes,\s*documentLabels:/);
  assert.match(submissionRoute, /buildDocumentVersionSnapshot\(\s*application\.documents/);
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
