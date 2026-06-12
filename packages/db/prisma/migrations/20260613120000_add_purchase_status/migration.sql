-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "status" "PurchaseStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Purchase" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Purchase" ADD COLUMN "cancelledByUserId" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "cancellationReason" TEXT;

-- CreateIndex
CREATE INDEX "Purchase_status_idx" ON "Purchase"("status");
