/*
  Warnings:

  - You are about to drop the column `fid` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `fromFid` on the `Tip` table. All the data in the column will be lost.
  - You are about to drop the column `toFid` on the `Tip` table. All the data in the column will be lost.
  - You are about to drop the column `farcasterClientIdOnboardedFrom` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fid` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[spaceId,address]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `Participant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromAddress` to the `Tip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toAddress` to the `Tip` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_fid_fkey";

-- DropForeignKey
ALTER TABLE "Tip" DROP CONSTRAINT "Tip_fromFid_fkey";

-- DropForeignKey
ALTER TABLE "Tip" DROP CONSTRAINT "Tip_toFid_fkey";

-- DropIndex
DROP INDEX "Participant_fid_idx";

-- DropIndex
DROP INDEX "Participant_spaceId_fid_key";

-- DropIndex
DROP INDEX "Tip_fromFid_idx";

-- DropIndex
DROP INDEX "Tip_toFid_idx";

-- DropIndex
DROP INDEX "User_fid_key";

-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "fid",
ADD COLUMN     "address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tip" DROP COLUMN "fromFid",
DROP COLUMN "toFid",
ADD COLUMN     "fromAddress" TEXT NOT NULL,
ADD COLUMN     "toAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "farcasterClientIdOnboardedFrom",
DROP COLUMN "fid",
ALTER COLUMN "address" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Participant_address_idx" ON "Participant"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_spaceId_address_key" ON "Participant"("spaceId", "address");

-- CreateIndex
CREATE INDEX "Tip_fromAddress_idx" ON "Tip"("fromAddress");

-- CreateIndex
CREATE INDEX "Tip_toAddress_idx" ON "Tip"("toAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_address_fkey" FOREIGN KEY ("address") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_fromAddress_fkey" FOREIGN KEY ("fromAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_toAddress_fkey" FOREIGN KEY ("toAddress") REFERENCES "User"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
