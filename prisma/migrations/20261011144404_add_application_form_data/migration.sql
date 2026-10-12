/*
  Warnings:

  - Added the required column `updatedAt` to the `ApplicationDocument` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SchemeType" AS ENUM ('SCHOLARSHIP', 'FELLOWSHIP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'IDENTITY_PROOF';
ALTER TYPE "DocumentType" ADD VALUE 'ADMISSION_PROOF';
ALTER TYPE "DocumentType" ADD VALUE 'BANK_PROOF';
ALTER TYPE "DocumentType" ADD VALUE 'PHOTOGRAPH';

-- AlterTable
ALTER TABLE "ApplicationDocument" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ScholarshipApplication" ADD COLUMN     "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
ADD COLUMN     "currentStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "formData" JSONB,
ADD COLUMN     "informationConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationAcknowledged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ScholarshipScheme" ADD COLUMN     "type" "SchemeType" NOT NULL DEFAULT 'SCHOLARSHIP';

-- CreateIndex
CREATE INDEX "ScholarshipApplication_studentId_schemeId_idx" ON "ScholarshipApplication"("studentId", "schemeId");
