-- DropIndex
DROP INDEX "User_address_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "farcasterClientIdOnboardedFrom" TEXT;
