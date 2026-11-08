ALTER TABLE "ScholarshipVerificationPolicy"
    ADD COLUMN "isSynthetic" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AiVerificationJob"
    ADD COLUMN "isSynthetic" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "documentSnapshot" JSONB;
