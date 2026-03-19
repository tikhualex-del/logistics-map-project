/*
  Warnings:

  - A unique constraint covering the columns `[companyId,integrationId,externalId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_companyId_integrationId_externalId_key" ON "Order"("companyId", "integrationId", "externalId");
