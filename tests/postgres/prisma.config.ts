import { defineConfig } from "prisma/config";
import { getTestDatabaseUrl } from "./safety";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getTestDatabaseUrl(process.env, {
      requireSchemaSyncApproval: true,
    }),
  },
});
