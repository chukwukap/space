/*
  Warnings:

  - You are about to drop the column `userId` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `hostId` on the `Space` table. All the data in the column will be lost.
  - You are about to drop the column `fromId` on the `Tip` table. All the data in the column will be lost.
  - You are about to drop the column `toId` on the `Tip` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[spaceId,fid]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[livekitName]` on the table `Space` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fid` to the `Participant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostAddress` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hostFid` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `livekitName` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromFid` to the `Tip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toFid` to the `Tip` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_userId_fkey";

-- DropForeignKey
ALTER TABLE "Space" DROP CONSTRAINT "Space_hostId_fkey";

-- DropForeignKey
ALTER TABLE "Tip" DROP CONSTRAINT "Tip_fromId_fkey";

-- DropForeignKey
ALTER TABLE "Tip" DROP CONSTRAINT "Tip_toId_fkey";

-- DropIndex
DROP INDEX "Participant_spaceId_userId_key";

-- DropIndex
DROP INDEX "Participant_userId_idx";

-- DropIndex
DROP INDEX "Space_hostId_idx";

-- DropIndex
DROP INDEX "Tip_fromId_idx";

-- DropIndex
DROP INDEX "Tip_toId_idx";

-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "userId",
ADD COLUMN     "fid" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Space" DROP COLUMN "hostId",
ADD COLUMN     "hostAddress" TEXT NOT NULL,
ADD COLUMN     "hostFid" INTEGER NOT NULL,
ADD COLUMN     "livekitName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tip" DROP COLUMN "fromId",
DROP COLUMN "toId",
ADD COLUMN     "fromFid" INTEGER NOT NULL,
ADD COLUMN     "toFid" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "spendPerm" JSONB;

-- CreateIndex
CREATE INDEX "Participant_fid_idx" ON "Participant"("fid");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_spaceId_fid_key" ON "Participant"("spaceId", "fid");

-- CreateIndex
CREATE UNIQUE INDEX "Space_livekitName_key" ON "Space"("livekitName");

-- CreateIndex
CREATE INDEX "Space_hostFid_idx" ON "Space"("hostFid");

-- CreateIndex
CREATE INDEX "Tip_fromFid_idx" ON "Tip"("fromFid");

-- CreateIndex
CREATE INDEX "Tip_toFid_idx" ON "Tip"("toFid");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_hostFid_fkey" FOREIGN KEY ("hostFid") REFERENCES "User"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_fid_fkey" FOREIGN KEY ("fid") REFERENCES "User"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_fromFid_fkey" FOREIGN KEY ("fromFid") REFERENCES "User"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tip" ADD CONSTRAINT "Tip_toFid_fkey" FOREIGN KEY ("toFid") REFERENCES "User"("fid") ON DELETE RESTRICT ON UPDATE CASCADE;
