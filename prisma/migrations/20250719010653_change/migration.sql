/*
  Warnings:

  - You are about to drop the column `hostFid` on the `Space` table. All the data in the column will be lost.
  - Added the required column `hostId` to the `Space` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Space" DROP CONSTRAINT "Space_hostFid_fkey";

-- DropIndex
DROP INDEX "Space_hostFid_idx";

-- AlterTable
ALTER TABLE "Space" DROP COLUMN "hostFid",
ADD COLUMN     "hostId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Space_hostId_idx" ON "Space"("hostId");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
