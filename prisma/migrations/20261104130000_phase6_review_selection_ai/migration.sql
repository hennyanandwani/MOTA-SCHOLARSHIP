-- Additive Phase 6 workflow fields. Existing applications retain their
-- historical status and receive NOT_REQUESTED / NOT_READY defaults.
ALTER TYPE "UserRole" ADD VALUE 'APPROVER';
ALTER TYPE "ApplicationStatus" ADD VALUE 'REJECTED_BY_AI';

CREATE TYPE "AiVerificationStatus" AS ENUM (
    'NOT_REQUESTED',
    'WAITING_FOR_CONFIGURATION',
    'QUEUED',
    'IN_PROGRESS',
    'ELIGIBLE',
    'INELIGIBLE',
    'FAILED',
    'NEEDS_ATTENTION'
);

CREATE TYPE "AiVerificationJobStatus" AS ENUM (
    'WAITING_FOR_CONFIGURATION',
    'QUEUED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'SUPERSEDED'
);

CREATE TYPE "ManualReviewStatus" AS ENUM (
    'NOT_READY',
    'PENDING',
    'IN_PROGRESS',
    'VERIFIED',
    'REJECTED',
    'NEEDS_ATTENTION'
);

CREATE TYPE "SelectionOutcome" AS ENUM (
    'SELECTED',
    'WAITLISTED',
    'NOT_RECOMMENDED'
);

CREATE TYPE "ApprovalStatus" AS ENUM (
    'PENDING_APPROVAL',
    'APPROVED',
    'RETURNED_FOR_REVIEW'
);

CREATE TYPE "DocumentVerificationActorType" AS ENUM (
    'ADMIN',
    'AI_SYSTEM'
);

CREATE TYPE "ApplicationApprovalActorType" AS ENUM (
    'SYSTEM',
    'APPROVER'
);

ALTER TABLE "ScholarshipApplication"
    ADD COLUMN "aiVerificationStatus" "AiVerificationStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    ADD COLUMN "aiEligibility" BOOLEAN,
    ADD COLUMN "aiExplanation" TEXT,
    ADD COLUMN "studentAiReason" TEXT,
    ADD COLUMN "aiModelVersion" TEXT,
    ADD COLUMN "aiCompletedAt" TIMESTAMP(3),
    ADD COLUMN "aiAttemptCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "aiInputVersion" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "manualReviewStatus" "ManualReviewStatus" NOT NULL DEFAULT 'NOT_READY';

CREATE INDEX "ScholarshipApplication_aiVerificationStatus_manualReviewStatus_idx"
    ON "ScholarshipApplication"("aiVerificationStatus", "manualReviewStatus");
CREATE INDEX "ScholarshipApplication_status_submittedAt_idx"
    ON "ScholarshipApplication"("status", "submittedAt");

CREATE TABLE "AiVerificationJob" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "requestedById" TEXT,
    "requestReason" TEXT,
    "inputVersion" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "AiVerificationJobStatus" NOT NULL DEFAULT 'WAITING_FOR_CONFIGURATION',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "outcome" "AiVerificationStatus",
    "eligibility" BOOLEAN,
    "explanation" TEXT,
    "studentReason" TEXT,
    "modelVersion" TEXT,
    "confidence" DECIMAL(5,2),
    "documentResults" JSONB,
    "callbackDigest" TEXT,
    "lastErrorCode" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiVerificationJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiVerificationJob_idempotencyKey_key"
    ON "AiVerificationJob"("idempotencyKey");
CREATE UNIQUE INDEX "AiVerificationJob_applicationId_inputVersion_key"
    ON "AiVerificationJob"("applicationId", "inputVersion");
CREATE INDEX "AiVerificationJob_status_createdAt_idx"
    ON "AiVerificationJob"("status", "createdAt");
CREATE INDEX "AiVerificationJob_requestedById_idx"
    ON "AiVerificationJob"("requestedById");

CREATE TABLE "ApplicationDocumentVerificationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "actorType" "DocumentVerificationActorType" NOT NULL,
    "reviewerId" TEXT,
    "previousStatus" "VerificationStatus" NOT NULL,
    "newStatus" "VerificationStatus" NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationDocumentVerificationEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationDocumentVerificationEvent_applicationId_createdAt_idx"
    ON "ApplicationDocumentVerificationEvent"("applicationId", "createdAt");
CREATE INDEX "ApplicationDocumentVerificationEvent_documentId_createdAt_idx"
    ON "ApplicationDocumentVerificationEvent"("documentId", "createdAt");

CREATE TABLE "ApplicationSelectionDecision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "outcome" "SelectionOutcome" NOT NULL,
    "priority" INTEGER,
    "remarks" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationSelectionDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationSelectionDecision_applicationId_createdAt_idx"
    ON "ApplicationSelectionDecision"("applicationId", "createdAt");
CREATE INDEX "ApplicationSelectionDecision_outcome_priority_idx"
    ON "ApplicationSelectionDecision"("outcome", "priority");

CREATE TABLE "ApplicationApprovalDecision" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "remarks" TEXT NOT NULL,
    "actorType" "ApplicationApprovalActorType" NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationApprovalDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationApprovalDecision_applicationId_createdAt_idx"
    ON "ApplicationApprovalDecision"("applicationId", "createdAt");
CREATE INDEX "ApplicationApprovalDecision_status_createdAt_idx"
    ON "ApplicationApprovalDecision"("status", "createdAt");
CREATE INDEX "ApplicationApprovalDecision_actorId_idx"
    ON "ApplicationApprovalDecision"("actorId");

ALTER TABLE "AiVerificationJob"
    ADD CONSTRAINT "AiVerificationJob_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "ScholarshipApplication"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "AiVerificationJob_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ApplicationDocumentVerificationEvent"
    ADD CONSTRAINT "ApplicationDocumentVerificationEvent_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "ScholarshipApplication"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ApplicationDocumentVerificationEvent_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "ApplicationDocument"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ApplicationDocumentVerificationEvent_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ApplicationSelectionDecision"
    ADD CONSTRAINT "ApplicationSelectionDecision_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "ScholarshipApplication"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ApplicationSelectionDecision_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ApplicationApprovalDecision"
    ADD CONSTRAINT "ApplicationApprovalDecision_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "ScholarshipApplication"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "ApplicationApprovalDecision_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION "prevent_phase6_audit_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Phase 6 audit records are append-only';
END;
$$;

CREATE TRIGGER "ApplicationDocumentVerificationEvent_append_only"
    BEFORE UPDATE OR DELETE ON "ApplicationDocumentVerificationEvent"
    FOR EACH ROW EXECUTE FUNCTION "prevent_phase6_audit_mutation"();

CREATE TRIGGER "ApplicationSelectionDecision_append_only"
    BEFORE UPDATE OR DELETE ON "ApplicationSelectionDecision"
    FOR EACH ROW EXECUTE FUNCTION "prevent_phase6_audit_mutation"();

CREATE TRIGGER "ApplicationApprovalDecision_append_only"
    BEFORE UPDATE OR DELETE ON "ApplicationApprovalDecision"
    FOR EACH ROW EXECUTE FUNCTION "prevent_phase6_audit_mutation"();
