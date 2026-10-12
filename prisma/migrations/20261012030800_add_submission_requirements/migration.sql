ALTER TABLE "ScholarshipApplication"
ADD COLUMN "eligibilityNotGuaranteed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "accountNumberConfirmed" BOOLEAN NOT NULL DEFAULT false;
