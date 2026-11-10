ALTER TABLE "Student"
    ADD COLUMN "autoFillEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "SystemConfiguration" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultAutoFillEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfiguration_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SystemConfiguration" ("id", "defaultAutoFillEnabled", "updatedAt")
VALUES ('default', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
