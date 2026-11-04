import assert from "node:assert/strict";
import test from "node:test";
import {
  assertTestDatabaseIdentity,
  getTestDatabaseUrl,
  testDatabaseIdentity,
} from "./safety";

const validTarget =
  "postgresql://fellowshift_concurrency_test:0123456789abcdefghijklmnopqrstuv@postgres:5432/fellowshift_concurrency_test";

function enabledEnvironment(
  overrides: Record<string, string | undefined> = {},
) {
  return {
    FELLOWSHIFT_RUN_POSTGRES_TESTS: "1",
    FELLOWSHIFT_TEST_DATABASE_URL: validTarget,
    ...overrides,
  };
}

test("test database guard requires explicit opt-in and never falls back to DATABASE_URL", () => {
  assert.throws(
    () =>
      getTestDatabaseUrl({
        DATABASE_URL: "postgresql://remote.example/production",
      }),
    /PostgreSQL test opt-in is required/,
  );
  assert.throws(
    () =>
      getTestDatabaseUrl(
        enabledEnvironment({
          FELLOWSHIFT_TEST_DATABASE_URL: undefined,
          DATABASE_URL: "postgresql://remote.example/production",
        }),
      ),
    /FELLOWSHIFT_TEST_DATABASE_URL must be set explicitly/,
  );
});

test("test database guard accepts only the internal Compose service target", () => {
  assert.equal(getTestDatabaseUrl(enabledEnvironment()), validTarget);

  for (const target of [
    "postgresql://fellowshift_concurrency_test:0123456789abcdefghijklmnopqrstuv@localhost:5432/fellowshift_concurrency_test",
    "postgresql://fellowshift_concurrency_test:0123456789abcdefghijklmnopqrstuv@127.0.0.1:5432/fellowshift_concurrency_test",
    "postgresql://fellowshift_concurrency_test:0123456789abcdefghijklmnopqrstuv@[::1]:5432/fellowshift_concurrency_test",
    "postgresql://fellowshift_concurrency_test:0123456789abcdefghijklmnopqrstuv@192.0.2.1:5432/fellowshift_concurrency_test",
    "postgresql://fellowshift_concurrency_test:0123456789abcdefghijklmnopqrstuv@project.supabase.co:5432/fellowshift_concurrency_test",
    "postgresql://other:0123456789abcdefghijklmnopqrstuv@postgres:5432/fellowshift_concurrency_test",
    "postgresql://fellowshift_concurrency_test:0123456789abcdefghijklmnopqrstuv@postgres:5433/fellowshift_concurrency_test",
    "postgresql://fellowshift_concurrency_test:0123456789abcdefghijklmnopqrstuv@postgres:5432/production",
    `${validTarget}?sslmode=require`,
    validTarget.replace("0123456789abcdefghijklmnopqrstuv", "abc%ZZ"),
    validTarget.replace("0123456789abcdefghijklmnopqrstuv", "short"),
  ]) {
    assert.throws(
      () =>
        getTestDatabaseUrl(
          enabledEnvironment({ FELLOWSHIFT_TEST_DATABASE_URL: target }),
        ),
      /not the approved local test database|invalid URL encoding/,
    );
  }
});

test("schema synchronization requires its own explicit acknowledgement", () => {
  assert.throws(
    () => getTestDatabaseUrl(enabledEnvironment(), { requireSchemaSyncApproval: true }),
    /Explicit disposable test schema-sync approval is required/,
  );
  assert.equal(
    getTestDatabaseUrl(
      enabledEnvironment({
        FELLOWSHIFT_ALLOW_TEST_SCHEMA_SYNC: "I_ACKNOWLEDGE_TEST_SCHEMA_SYNC",
      }),
      { requireSchemaSyncApproval: true },
    ),
    validTarget,
  );
});

test("database identity guard requires the dedicated server-reported identity", async () => {
  const matchingClient = {
    $queryRaw: async () => [
      {
        database_name: testDatabaseIdentity.databaseName,
        role_name: testDatabaseIdentity.roleName,
        server_address: "172.20.0.2",
        server_port: Number(testDatabaseIdentity.port),
      },
    ],
  };
  await assertTestDatabaseIdentity(matchingClient);

  await assert.rejects(
    assertTestDatabaseIdentity({
      $queryRaw: async () => [
        {
          database_name: "production",
          role_name: "production",
          server_address: "203.0.113.1",
          server_port: Number(testDatabaseIdentity.port),
        },
      ],
    }),
    /does not match the test target/,
  );
});
