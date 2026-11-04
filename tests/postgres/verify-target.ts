import { createTestPrismaClient } from "./client";
import { assertTestDatabaseIdentity } from "./safety";

async function main() {
  const client = createTestPrismaClient();
  try {
    await assertTestDatabaseIdentity(client);
    console.info("Verified dedicated local PostgreSQL test database identity.");
  } catch {
    throw new Error(
      "PostgreSQL test target verification failed; no test setup was performed.",
    );
  } finally {
    try {
      await client.$disconnect();
    } catch {
      throw new Error("PostgreSQL test client could not be disconnected safely.");
    }
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Test target verification failed.");
  process.exitCode = 1;
});
