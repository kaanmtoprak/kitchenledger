/*
  Warnings:

  - Added the required column `totalAmount` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalAmount" DECIMAL(18,6) NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "totalPrice" DECIMAL(18,6) NOT NULL;

-- CreateIndex
CREATE INDEX "Order_orderedAt_idx" ON "Order"("orderedAt");
