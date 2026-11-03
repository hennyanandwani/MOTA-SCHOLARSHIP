
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { requireEnvironmentVariable } from "../lib/env";

async function main() {
  const adapter = new PrismaPg({
    connectionString: requireEnvironmentVariable(
      "DATABASE_URL",
      process.env.DATABASE_URL,
    ),
  });

  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Supabase database connection successful!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Database connection failed:", error);
  process.exitCode = 1;
});
