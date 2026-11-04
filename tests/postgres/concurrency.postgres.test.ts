import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  ApplicationStatus,
  DocumentType,
  VerificationStatus,
  type PrismaClient,
} from "../../lib/generated/prisma/client";
import { demoApplicationData } from "../../lib/applicationDraft";
import {
  getSubmissionFailureStatus,
  getSubmissionValidationFailure,
  SubmissionTransactionAbort,
} from "../../lib/applicationSubmission";
import { createTestPrismaClient } from "./client";
import { assertTestDatabaseIdentity, isPostgresTestOptedIn } from "./safety";

const enabled = isPostgresTestOptedIn();
const requiredDocumentTypes = [
  DocumentType.CASTE_CERTIFICATE,
  DocumentType.INCOME_CERTIFICATE,
  DocumentType.IDENTITY_PROOF,
  DocumentType.MARKSHEET,
  DocumentType.ADMISSION_PROOF,
  DocumentType.BANK_PROOF,
  DocumentType.PHOTOGRAPH,
];

type Fixture = {
  applicationId?: string;
  studentId?: string;
  userId?: string;
  schemeId?: string;
};

type Gate = {
  promise: Promise<void>;
  open: () => void;
};

let prisma: PrismaClient | undefined;
const fixtures: Fixture[] = [];

function gate(): Gate {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

function db(): PrismaClient {
  assert.ok(prisma, "PostgreSQL test client must be initialized.");
  return prisma;
}

function transactionLabel(prefix: string): string {
  const label = `fellowshift_${prefix}_${crypto.randomUUID().slice(0, 16)}`;
  assert.ok(label.length <= 63, "PostgreSQL application_name must fit its limit.");
  return label;
}

async function waitForLockWait(applicationName: string): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const waiting = await db().$queryRaw<Array<{ pid: number }>>`
      SELECT pid
      FROM pg_stat_activity
      WHERE application_name = ${applicationName}
        AND wait_event_type = 'Lock'
        AND state = 'active'
    `;
    if (waiting.length === 1) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
  }
  assert.fail(`Transaction ${applicationName} did not enter a PostgreSQL lock wait.`);
}

async function releaseAfterObservedWait(
  applicationName: string,
  release: Gate,
  ...operations: Promise<unknown>[]
): Promise<void> {
  let failed = false;
  let failure: unknown;
  try {
    await waitForLockWait(applicationName);
  } catch (error) {
    failed = true;
    failure = error;
  } finally {
    release.open();
  }
  if (failed) {
    await Promise.allSettled(operations);
    throw failure;
  }
}

function hasPostgresErrorCode(error: unknown, expectedCode: string): boolean {
  const pending: unknown[] = [error];
  const visited = new Set<object>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current !== "object" || current === null || visited.has(current)) {
      continue;
    }
    visited.add(current);
    const value = current as Record<string, unknown>;
    if (
      value.code === expectedCode ||
      value.originalCode === expectedCode ||
      value.sqlState === expectedCode
    ) {
      return true;
    }
    pending.push(value.cause, value.meta, value.driverAdapterError);
  }
  return false;
}

async function lockDraft(
  tx: Pick<PrismaClient, "scholarshipApplication">,
  applicationId: string,
  studentId: string,
) {
  return tx.scholarshipApplication.updateMany({
    where: {
      id: applicationId,
      studentId,
      status: ApplicationStatus.DRAFT,
    },
    data: { status: ApplicationStatus.DRAFT },
  });
}

async function cleanupFixture(fixture: Fixture): Promise<void> {
  if (!prisma) return;
  if (fixture.applicationId) {
    await prisma.scholarshipApplication.deleteMany({
      where: { id: fixture.applicationId },
    });
  }
  if (fixture.studentId) {
    await prisma.student.deleteMany({ where: { id: fixture.studentId } });
  }
  if (fixture.userId) {
    await prisma.user.deleteMany({ where: { id: fixture.userId } });
  }
  if (fixture.schemeId) {
    await prisma.scholarshipScheme.deleteMany({
      where: { id: fixture.schemeId },
    });
  }
}

async function createFixture(options: {
  includeRequiredDocuments?: boolean;
  validForSubmission?: boolean;
} = {}): Promise<Required<Fixture>> {
  const fixture: Fixture = {};
  const suffix = crypto.randomUUID();

  try {
    const user = await db().user.create({
      data: {
        supabaseAuthId: `test-auth-${suffix}`,
        email: `test-${suffix}@example.invalid`,
        fullName: "Synthetic Concurrency Test",
      },
      select: { id: true },
    });
    fixture.userId = user.id;

    const student = await db().student.create({
      data: {
        userId: user.id,
        rollNumber: `TEST-${suffix}`,
      },
      select: { id: true },
    });
    fixture.studentId = student.id;

    const scheme = await db().scholarshipScheme.create({
      data: { name: `Synthetic concurrency scheme ${suffix}` },
      select: { id: true },
    });
    fixture.schemeId = scheme.id;

    const application = await db().scholarshipApplication.create({
      data: {
        applicationNumber: `TEST-${suffix}`,
        studentId: student.id,
        schemeId: scheme.id,
        updatedAt: new Date("2000-01-01T00:00:00.000Z"),
        ...(options.validForSubmission
          ? { formData: demoApplicationData }
          : {}),
        currentStep: options.validForSubmission ? 4 : 1,
        informationConfirmed: options.validForSubmission ?? false,
        verificationAcknowledged: options.validForSubmission ?? false,
        eligibilityNotGuaranteed: options.validForSubmission ?? false,
        termsAccepted: options.validForSubmission ?? false,
        accountNumberConfirmed: options.validForSubmission ?? false,
      },
      select: { id: true },
    });
    fixture.applicationId = application.id;

    if (options.includeRequiredDocuments) {
      await db().applicationDocument.createMany({
        data: requiredDocumentTypes.map((type) => ({
          applicationId: application.id,
          type,
          storagePath: `synthetic/${suffix}/${type}`,
          originalName: `${type}.pdf`,
          mimeType: "application/pdf",
          sizeBytes: 16,
          verificationStatus: VerificationStatus.VERIFIED,
        })),
      });
    }

    fixtures.push(fixture);
    return fixture as Required<Fixture>;
  } catch (error) {
    await cleanupFixture(fixture);
    throw error;
  }
}

async function submitInTransaction(
  tx: Pick<PrismaClient, "scholarshipApplication">,
  fixture: Required<Fixture>,
): Promise<{ submitted: boolean; formData?: unknown }> {
  const lock = await lockDraft(tx, fixture.applicationId, fixture.studentId);
  if (lock.count !== 1) return { submitted: false };

  const application = await tx.scholarshipApplication.findFirst({
    where: {
      id: fixture.applicationId,
      studentId: fixture.studentId,
      status: ApplicationStatus.DRAFT,
    },
    select: {
      formData: true,
      currentStep: true,
      accountNumberConfirmed: true,
      informationConfirmed: true,
      verificationAcknowledged: true,
      eligibilityNotGuaranteed: true,
      termsAccepted: true,
      scheme: { select: { isActive: true } },
      documents: { select: { type: true, verificationStatus: true } },
    },
  });

  if (!application) return { submitted: false };
  const validation = getSubmissionValidationFailure({
    schemeIsActive: application.scheme.isActive,
    formData: application.formData,
    currentStep: application.currentStep,
    accountNumberConfirmed: application.accountNumberConfirmed,
    declarations: [
      application.informationConfirmed,
      application.verificationAcknowledged,
      application.eligibilityNotGuaranteed,
      application.termsAccepted,
    ],
    documents: application.documents,
    requiredDocumentTypes,
    documentLabels: {},
  });
  if (validation) return { submitted: false };

  const update = await tx.scholarshipApplication.updateMany({
    where: {
      id: fixture.applicationId,
      studentId: fixture.studentId,
      status: ApplicationStatus.DRAFT,
      scheme: { is: { isActive: true } },
    },
    data: {
      status: ApplicationStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });
  return { submitted: update.count === 1, formData: application.formData };
}

before(async () => {
  if (!enabled) return;
  prisma = createTestPrismaClient();
  await assertTestDatabaseIdentity(prisma);
});

after(async () => {
  if (!prisma) return;
  for (const fixture of fixtures.reverse()) {
    await cleanupFixture(fixture);
  }
  await prisma.$disconnect();
});

test("draft save locks before submission and submission validates the saved snapshot", {
  skip: !enabled,
}, async () => {
  const fixture = await createFixture({ includeRequiredDocuments: true, validForSubmission: true });
  const saveLocked = gate();
  const releaseSave = gate();
  const submissionName = transactionLabel("submit_waiting_on_save");

  const save = db().$transaction(async (tx) => {
    assert.equal((await lockDraft(tx, fixture.applicationId, fixture.studentId)).count, 1);
    const data = { ...demoApplicationData, personal: { ...demoApplicationData.personal, firstName: "Saved first" } };
    await tx.scholarshipApplication.update({
      where: { id: fixture.applicationId },
      data: { formData: data },
    });
    saveLocked.open();
    await releaseSave.promise;
  });

  await saveLocked.promise;
  const submit = db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('application_name', ${submissionName}, true)`;
    return submitInTransaction(tx, fixture);
  });
  await releaseAfterObservedWait(submissionName, releaseSave, save, submit);

  const [, result] = await Promise.all([save, submit]);
  assert.equal(result.submitted, true);
  assert.equal(
    (result.formData as typeof demoApplicationData).personal.firstName,
    "Saved first",
  );
});

test("submission locks first so a later draft save cannot mutate submitted data", {
  skip: !enabled,
}, async () => {
  const fixture = await createFixture({ includeRequiredDocuments: true, validForSubmission: true });
  const submissionLocked = gate();
  const releaseSubmission = gate();
  const saveName = transactionLabel("save_waiting_on_submit");

  const submit = db().$transaction(async (tx) => {
    assert.equal((await lockDraft(tx, fixture.applicationId, fixture.studentId)).count, 1);
    const update = await tx.scholarshipApplication.updateMany({
      where: { id: fixture.applicationId, studentId: fixture.studentId, status: ApplicationStatus.DRAFT },
      data: { status: ApplicationStatus.SUBMITTED, submittedAt: new Date() },
    });
    submissionLocked.open();
    await releaseSubmission.promise;
    return update.count === 1;
  });

  await submissionLocked.promise;
  const save = db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('application_name', ${saveName}, true)`;
    return lockDraft(tx, fixture.applicationId, fixture.studentId);
  });
  await releaseAfterObservedWait(saveName, releaseSubmission, submit, save);

  const [submitted, saveResult] = await Promise.all([submit, save]);
  assert.equal(submitted, true);
  assert.equal(saveResult.count, 0);
});

test("document metadata committed before submission is visible to validation", {
  skip: !enabled,
}, async () => {
  const fixture = await createFixture({ includeRequiredDocuments: true, validForSubmission: true });
  const metadataLocked = gate();
  const releaseMetadata = gate();
  const submissionName = transactionLabel("submit_waiting_on_metadata");
  const newPath = `synthetic/replaced/${crypto.randomUUID()}`;

  const metadata = db().$transaction(async (tx) => {
    assert.equal((await lockDraft(tx, fixture.applicationId, fixture.studentId)).count, 1);
    await tx.applicationDocument.updateMany({
      where: { applicationId: fixture.applicationId, type: DocumentType.IDENTITY_PROOF },
      data: { storagePath: newPath },
    });
    metadataLocked.open();
    await releaseMetadata.promise;
  });

  await metadataLocked.promise;
  const submit = db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('application_name', ${submissionName}, true)`;
    return submitInTransaction(tx, fixture);
  });
  await releaseAfterObservedWait(submissionName, releaseMetadata, metadata, submit);

  const [, result] = await Promise.all([metadata, submit]);
  assert.equal(result.submitted, true);
  assert.equal(
    await db().applicationDocument.count({
      where: { applicationId: fixture.applicationId, storagePath: newPath },
    }),
    1,
  );
});

test("submission committed before document metadata blocks the metadata write", {
  skip: !enabled,
}, async () => {
  const fixture = await createFixture({ includeRequiredDocuments: true, validForSubmission: true });
  const submissionLocked = gate();
  const releaseSubmission = gate();
  const metadataName = transactionLabel("metadata_waiting_on_submit");
  const newPath = `synthetic/late/${crypto.randomUUID()}`;

  const submit = db().$transaction(async (tx) => {
    assert.equal((await lockDraft(tx, fixture.applicationId, fixture.studentId)).count, 1);
    await tx.scholarshipApplication.update({
      where: { id: fixture.applicationId },
      data: { status: ApplicationStatus.SUBMITTED, submittedAt: new Date() },
    });
    submissionLocked.open();
    await releaseSubmission.promise;
  });

  await submissionLocked.promise;
  const metadata = db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('application_name', ${metadataName}, true)`;
    return lockDraft(tx, fixture.applicationId, fixture.studentId);
  });
  await releaseAfterObservedWait(metadataName, releaseSubmission, submit, metadata);

  const [, result] = await Promise.all([submit, metadata]);
  assert.equal(result.count, 0);
  assert.equal(
    await db().applicationDocument.count({
      where: { applicationId: fixture.applicationId, storagePath: newPath },
    }),
    0,
  );
});

test("serialized concurrent replacements preserve the final referenced path", {
  skip: !enabled,
}, async () => {
  const fixture = await createFixture({ includeRequiredDocuments: true });
  const firstLocked = gate();
  const releaseFirst = gate();
  const secondName = transactionLabel("replacement_waiting_on_replacement");
  const paths = [
    `synthetic/replacement/${crypto.randomUUID()}`,
    `synthetic/replacement/${crypto.randomUUID()}`,
  ];

  const first = db().$transaction(async (tx) => {
    assert.equal((await lockDraft(tx, fixture.applicationId, fixture.studentId)).count, 1);
    const existing = await tx.applicationDocument.findFirstOrThrow({
      where: { applicationId: fixture.applicationId, type: DocumentType.IDENTITY_PROOF },
      select: { storagePath: true, id: true },
    });
    await tx.applicationDocument.update({
      where: { id: existing.id },
      data: { storagePath: paths[0] },
    });
    firstLocked.open();
    await releaseFirst.promise;
    return existing.storagePath;
  });

  await firstLocked.promise;
  const second = db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('application_name', ${secondName}, true)`;
    assert.equal((await lockDraft(tx, fixture.applicationId, fixture.studentId)).count, 1);
    const existing = await tx.applicationDocument.findFirstOrThrow({
      where: { applicationId: fixture.applicationId, type: DocumentType.IDENTITY_PROOF },
      select: { storagePath: true, id: true },
    });
    await tx.applicationDocument.update({
      where: { id: existing.id },
      data: { storagePath: paths[1] },
    });
    return existing.storagePath;
  });
  await releaseAfterObservedWait(secondName, releaseFirst, first, second);

  const [firstOldPath, secondOldPath] = await Promise.all([first, second]);
  const current = await db().applicationDocument.findFirstOrThrow({
    where: { applicationId: fixture.applicationId, type: DocumentType.IDENTITY_PROOF },
    select: { storagePath: true },
  });
  assert.equal(current.storagePath, paths[1]);
  assert.notEqual(firstOldPath, paths[1]);
  assert.equal(secondOldPath, paths[0]);
});

test("failed validation rolls back the lock update and preserves updatedAt", {
  skip: !enabled,
}, async () => {
  const fixture = await createFixture();
  const before = await db().scholarshipApplication.findUniqueOrThrow({
    where: { id: fixture.applicationId },
    select: { updatedAt: true },
  });

  await assert.rejects(
    db().$transaction(async (tx) => {
      assert.equal((await lockDraft(tx, fixture.applicationId, fixture.studentId)).count, 1);
      const failure = getSubmissionValidationFailure({
        schemeIsActive: true,
        formData: null,
        currentStep: 1,
        accountNumberConfirmed: false,
        declarations: [false, false, false, false],
        documents: [],
        requiredDocumentTypes,
        documentLabels: {},
      });
      assert.ok(failure);
      assert.equal(failure.kind, "invalid_application");
      assert.equal(getSubmissionFailureStatus(failure.kind), 422);
      if (failure.kind !== "invalid_application") {
        throw new Error("Expected invalid application data.");
      }
      throw new SubmissionTransactionAbort(failure);
    }),
    (error: unknown) =>
      error instanceof SubmissionTransactionAbort &&
      getSubmissionFailureStatus(error.result.kind) === 422,
  );

  const after = await db().scholarshipApplication.findUniqueOrThrow({
    where: { id: fixture.applicationId },
    select: { updatedAt: true },
  });
  assert.equal(after.updatedAt.getTime(), before.updatedAt.getTime());
});

test("metadata replacement rollback preserves old database metadata", {
  skip: !enabled,
}, async () => {
  const fixture = await createFixture({ includeRequiredDocuments: true });
  const existing = await db().applicationDocument.findFirstOrThrow({
    where: { applicationId: fixture.applicationId, type: DocumentType.IDENTITY_PROOF },
    select: { id: true, storagePath: true },
  });
  const newPath = `synthetic/rolled-back/${crypto.randomUUID()}`;

  await assert.rejects(
    db().$transaction(async (tx) => {
      assert.equal((await lockDraft(tx, fixture.applicationId, fixture.studentId)).count, 1);
      await tx.applicationDocument.update({
        where: { id: existing.id },
        data: { storagePath: newPath },
      });
      throw new Error("Expected metadata rollback.");
    }),
    /Expected metadata rollback/,
  );

  const after = await db().applicationDocument.findUniqueOrThrow({
    where: { id: existing.id },
    select: { storagePath: true },
  });
  assert.equal(after.storagePath, existing.storagePath);
});

test("a PostgreSQL lock timeout rejects the waiting transaction", {
  skip: !enabled,
}, async () => {
  const fixture = await createFixture();
  const firstLocked = gate();
  const releaseFirst = gate();

  const first = db().$transaction(async (tx) => {
    assert.equal((await lockDraft(tx, fixture.applicationId, fixture.studentId)).count, 1);
    firstLocked.open();
    await releaseFirst.promise;
  });

  await firstLocked.promise;
  try {
    await assert.rejects(
      db().$transaction(async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '100ms'`;
        await lockDraft(tx, fixture.applicationId, fixture.studentId);
      }),
      (error: unknown) => hasPostgresErrorCode(error, "55P03"),
    );
  } finally {
    releaseFirst.open();
    await first;
  }
});
