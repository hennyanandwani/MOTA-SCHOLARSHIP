import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { getTestDatabaseUrl } from "./safety";

export function createTestPrismaClient(): PrismaClient {
  const connectionString = getTestDatabaseUrl();
  const adapter = new PrismaPg({
    connectionString,
    max: 4,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 1000,
  });

  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: 5000,
      timeout: 15000,
    },
  });
}
