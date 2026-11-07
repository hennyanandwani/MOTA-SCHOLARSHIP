
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { requireEnvironmentVariable } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function assertDatabaseUrlConfigured(): string {
  return requireEnvironmentVariable("DATABASE_URL", process.env.DATABASE_URL);
}

const createPrismaClient = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });

  return new PrismaClient({ adapter });
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
