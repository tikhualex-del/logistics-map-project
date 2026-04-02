/*
  Warnings:

  - A unique constraint covering the columns `[companyId,integrationId]` on the table `IntegrationMapping` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "IntegrationMapping_companyId_integrationId_key" ON "IntegrationMapping"("companyId", "integrationId");
