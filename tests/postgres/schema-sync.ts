import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { createTestPrismaClient } from "./client";
import {
  assertTestDatabaseIdentity,
  getTestDatabaseUrl,
} from "./safety";

async function main(): Promise<void> {
  getTestDatabaseUrl(process.env, { requireSchemaSyncApproval: true });

  const prisma = createTestPrismaClient();
  try {
    await assertTestDatabaseIdentity(prisma);
  } finally {
    await prisma.$disconnect();
  }

  const projectRoot = process.cwd();
  const childEnvironment = {
    PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    HOME: "/tmp",
    NODE_ENV: "test" as const,
    FELLOWSHIFT_RUN_POSTGRES_TESTS: "1",
    FELLOWSHIFT_TEST_DATABASE_URL: getTestDatabaseUrl(process.env, {
      requireSchemaSyncApproval: true,
    }),
    FELLOWSHIFT_ALLOW_TEST_SCHEMA_SYNC: "I_ACKNOWLEDGE_TEST_SCHEMA_SYNC",
  };
  const result = spawnSync(
    process.execPath,
    [
      join(projectRoot, "node_modules", "prisma", "build", "index.js"),
      "db",
      "push",
      "--config",
      join(projectRoot, "tests", "postgres", "prisma.config.ts"),
      "--schema",
      join(projectRoot, "prisma", "schema.prisma"),
    ],
    { stdio: "ignore", env: childEnvironment, cwd: projectRoot },
  );

  if (result.error || result.status !== 0) {
    throw new Error("Disposable test schema synchronization did not complete successfully.");
  }
}

void main().catch(() => {
  console.error("Disposable test schema synchronization failed.");
  process.exitCode = 1;
});
