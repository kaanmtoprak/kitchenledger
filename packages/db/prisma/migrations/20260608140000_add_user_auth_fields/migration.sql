-- AlterTable
ALTER TABLE "User" ADD COLUMN "refreshTokenHash" TEXT,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);
