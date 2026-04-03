-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "zoneId" TEXT;

-- CreateIndex
CREATE INDEX "Order_zoneId_idx" ON "Order"("zoneId");
