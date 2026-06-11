-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN "productionId" TEXT;

-- CreateIndex
CREATE INDEX "StockMovement_productionId_idx" ON "StockMovement"("productionId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE SET NULL ON UPDATE CASCADE;
