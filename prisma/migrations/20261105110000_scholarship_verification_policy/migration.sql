CREATE TYPE "ScholarshipVerificationPolicyStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "ScholarshipVerificationPolicy" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ScholarshipVerificationPolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "eligibilityCriteria" JSONB NOT NULL,
    "requiredDocumentTypes" "DocumentType"[] NOT NULL DEFAULT ARRAY[]::"DocumentType"[],
    "aiEligibleDocumentTypes" "DocumentType"[] NOT NULL DEFAULT ARRAY[]::"DocumentType"[],
    "officialGuidelineReference" TEXT,
    "guidelineRevision" TEXT,
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScholarshipVerificationPolicy_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ScholarshipVerificationPolicy_version_check" CHECK ("version" > 0),
    CONSTRAINT "ScholarshipVerificationPolicy_criteria_array_check" CHECK (
        jsonb_typeof("eligibilityCriteria") = 'array'
    ),
    CONSTRAINT "ScholarshipVerificationPolicy_ai_document_limit_check" CHECK (
        COALESCE(cardinality("aiEligibleDocumentTypes"), 0) <= 5
    ),
    CONSTRAINT "ScholarshipVerificationPolicy_publication_fields_check" CHECK (
        "status" = 'DRAFT' OR (
            NULLIF(btrim("officialGuidelineReference"), '') IS NOT NULL
            AND "publishedById" IS NOT NULL
            AND "publishedAt" IS NOT NULL
        )
    )
);

CREATE UNIQUE INDEX "ScholarshipVerificationPolicy_schemeId_version_key"
    ON "ScholarshipVerificationPolicy"("schemeId", "version");
CREATE INDEX "ScholarshipVerificationPolicy_schemeId_status_idx"
    ON "ScholarshipVerificationPolicy"("schemeId", "status");
CREATE INDEX "ScholarshipVerificationPolicy_publishedById_idx"
    ON "ScholarshipVerificationPolicy"("publishedById");

ALTER TABLE "ScholarshipVerificationPolicy"
    ADD CONSTRAINT "ScholarshipVerificationPolicy_schemeId_fkey"
    FOREIGN KEY ("schemeId") REFERENCES "ScholarshipScheme"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ScholarshipVerificationPolicy_publishedById_fkey"
    FOREIGN KEY ("publishedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AiVerificationJob"
    ADD COLUMN "policyId" TEXT,
    ADD COLUMN "policySnapshot" JSONB;

CREATE INDEX "AiVerificationJob_policyId_idx"
    ON "AiVerificationJob"("policyId");

ALTER TABLE "AiVerificationJob"
    ADD CONSTRAINT "AiVerificationJob_policyId_fkey"
    FOREIGN KEY ("policyId") REFERENCES "ScholarshipVerificationPolicy"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
