-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "status" "ProductionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledByUserId" TEXT,
ADD COLUMN     "cancellationReason" TEXT;

-- CreateIndex
CREATE INDEX "Production_status_idx" ON "Production"("status");
