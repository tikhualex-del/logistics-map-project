-- CreateTable
CREATE TABLE "IntegrationMapping" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "orderStatusMapJson" TEXT NOT NULL,
    "deliveryTypeMapJson" TEXT NOT NULL,
    "warehouseMapJson" TEXT,
    "courierMapJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationMapping_companyId_idx" ON "IntegrationMapping"("companyId");

-- CreateIndex
CREATE INDEX "IntegrationMapping_integrationId_idx" ON "IntegrationMapping"("integrationId");

-- AddForeignKey
ALTER TABLE "IntegrationMapping" ADD CONSTRAINT "IntegrationMapping_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationMapping" ADD CONSTRAINT "IntegrationMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
