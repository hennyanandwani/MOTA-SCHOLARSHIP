/*
  Warnings:

  - A unique constraint covering the columns `[supabaseAuthId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supabaseAuthId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "supabaseAuthId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "User"("supabaseAuthId");
