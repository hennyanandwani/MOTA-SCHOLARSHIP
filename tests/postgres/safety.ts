const TEST_DATABASE_NAME = "fellowshift_concurrency_test";
const TEST_DATABASE_USER = "fellowshift_concurrency_test";
const TEST_DATABASE_HOST = "postgres";
const TEST_DATABASE_PORT = "5432";
const SCHEMA_SYNC_ACK = "I_ACKNOWLEDGE_TEST_SCHEMA_SYNC";

type TestEnvironment = Record<string, string | undefined>;

export function getTestDatabaseUrl(
  env: TestEnvironment = process.env,
  options: { requireSchemaSyncApproval?: boolean } = {},
): string {
  if (env.FELLOWSHIFT_RUN_POSTGRES_TESTS !== "1") {
    throw new Error("PostgreSQL test opt-in is required.");
  }
  if (
    options.requireSchemaSyncApproval &&
    env.FELLOWSHIFT_ALLOW_TEST_SCHEMA_SYNC !== SCHEMA_SYNC_ACK
  ) {
    throw new Error("Explicit disposable test schema-sync approval is required.");
  }

  const rawUrl = env.FELLOWSHIFT_TEST_DATABASE_URL;
  if (!rawUrl || rawUrl.trim() !== rawUrl) {
    throw new Error("FELLOWSHIFT_TEST_DATABASE_URL must be set explicitly.");
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("The PostgreSQL test target is not a valid URL.");
  }

  let databaseName: string;
  let username: string;
  let password: string;
  try {
    databaseName = decodeURIComponent(url.pathname.slice(1));
    username = decodeURIComponent(url.username);
    password = decodeURIComponent(url.password);
  } catch {
    throw new Error("The PostgreSQL test target contains invalid URL encoding.");
  }

  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.hostname !== TEST_DATABASE_HOST ||
    url.port !== TEST_DATABASE_PORT ||
    databaseName !== TEST_DATABASE_NAME ||
    username !== TEST_DATABASE_USER ||
    !/^[A-Za-z0-9_-]{32,}$/.test(password) ||
    url.search ||
    url.hash
  ) {
    throw new Error("The PostgreSQL target is not the approved local test database.");
  }

  return url.toString();
}

export function isPostgresTestOptedIn(env: TestEnvironment = process.env): boolean {
  return env.FELLOWSHIFT_RUN_POSTGRES_TESTS === "1";
}

export async function assertTestDatabaseIdentity(
  client: {
    $queryRaw(query: TemplateStringsArray): Promise<unknown>;
  },
): Promise<void> {
  const rows = await client.$queryRaw`
    SELECT
      current_database() AS database_name,
      current_user AS role_name,
      inet_server_addr()::text AS server_address,
      inet_server_port() AS server_port
  `;

  if (
    !Array.isArray(rows) ||
    rows.length !== 1 ||
    typeof rows[0] !== "object" ||
    rows[0] === null ||
    !("database_name" in rows[0]) ||
    !("role_name" in rows[0]) ||
    !("server_address" in rows[0]) ||
    !("server_port" in rows[0]) ||
    rows[0].database_name !== TEST_DATABASE_NAME ||
    rows[0].role_name !== TEST_DATABASE_USER ||
    typeof rows[0].server_address !== "string" ||
    rows[0].server_address.length === 0 ||
    rows[0].server_port !== Number(TEST_DATABASE_PORT)
  ) {
    throw new Error("Connected PostgreSQL identity does not match the test target.");
  }
}

export const testDatabaseIdentity = {
  databaseName: TEST_DATABASE_NAME,
  roleName: TEST_DATABASE_USER,
  host: TEST_DATABASE_HOST,
  port: TEST_DATABASE_PORT,
};
