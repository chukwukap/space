/*
  Warnings:

  - You are about to drop the column `spendPerm` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "spendPerm";

-- CreateTable
CREATE TABLE "TippingPreferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heart" DECIMAL(18,6) NOT NULL,
    "laugh" DECIMAL(18,6) NOT NULL,
    "clap" DECIMAL(18,6) NOT NULL,
    "fire" DECIMAL(18,6) NOT NULL,
    "like" DECIMAL(18,6) NOT NULL,
    "enabledHeart" BOOLEAN NOT NULL DEFAULT true,
    "enabledLaugh" BOOLEAN NOT NULL DEFAULT true,
    "enabledClap" BOOLEAN NOT NULL DEFAULT true,
    "enabledFire" BOOLEAN NOT NULL DEFAULT true,
    "enabledLike" BOOLEAN NOT NULL DEFAULT true,
    "tippingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,

    CONSTRAINT "TippingPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TippingPreferences_userId_key" ON "TippingPreferences"("userId");

-- AddForeignKey
ALTER TABLE "TippingPreferences" ADD CONSTRAINT "TippingPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
