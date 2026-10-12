
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { schemes } from "../lib/schemes";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  for (const scheme of schemes) {
    await prisma.scholarshipScheme.upsert({
      where: { id: scheme.id },
      update: {
        name: scheme.name,
        description: scheme.description,
        type: scheme.type === "Fellowship" ? "FELLOWSHIP" : "SCHOLARSHIP",
        isActive: scheme.status !== "Closed",
      },
      create: {
        id: scheme.id,
        name: scheme.name,
        description: scheme.description,
        type: scheme.type === "Fellowship" ? "FELLOWSHIP" : "SCHOLARSHIP",
        isActive: scheme.status !== "Closed",
      },
    });
  }

  const total = await prisma.scholarshipScheme.count();

  console.log(`Scheme seed complete. Total database schemes: ${total}`);
}

main()
  .catch((error) => {
    console.error("Scheme seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
