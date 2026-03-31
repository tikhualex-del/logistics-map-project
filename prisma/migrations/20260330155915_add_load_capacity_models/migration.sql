-- CreateTable
CREATE TABLE "CompanyLoadUnit" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "capacityPoints" INTEGER NOT NULL,
    "allowedCourierTypes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyLoadUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyCourierCapacityRule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "courierType" TEXT NOT NULL,
    "maxOrders" INTEGER NOT NULL,
    "maxCapacityPoints" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyCourierCapacityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationItemLoadMapping" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "externalFieldType" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "externalValue" TEXT NOT NULL,
    "loadUnitId" TEXT NOT NULL,
    "multiplier" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationItemLoadMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLoadItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "loadUnitId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sourceMatchType" TEXT NOT NULL,
    "sourceRawValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLoadItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLoadSnapshot" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "totalCapacityPoints" INTEGER NOT NULL DEFAULT 0,
    "walkAllowed" BOOLEAN,
    "bikeAllowed" BOOLEAN,
    "carAllowed" BOOLEAN,
    "recommendedCourierType" TEXT,
    "classificationStatus" TEXT NOT NULL,
    "summaryJson" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderLoadSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyLoadUnit_companyId_idx" ON "CompanyLoadUnit"("companyId");

-- CreateIndex
CREATE INDEX "CompanyLoadUnit_companyId_isActive_idx" ON "CompanyLoadUnit"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyLoadUnit_companyId_code_key" ON "CompanyLoadUnit"("companyId", "code");

-- CreateIndex
CREATE INDEX "CompanyCourierCapacityRule_companyId_idx" ON "CompanyCourierCapacityRule"("companyId");

-- CreateIndex
CREATE INDEX "CompanyCourierCapacityRule_companyId_isActive_idx" ON "CompanyCourierCapacityRule"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyCourierCapacityRule_companyId_courierType_key" ON "CompanyCourierCapacityRule"("companyId", "courierType");

-- CreateIndex
CREATE INDEX "IntegrationItemLoadMapping_companyId_idx" ON "IntegrationItemLoadMapping"("companyId");

-- CreateIndex
CREATE INDEX "IntegrationItemLoadMapping_integrationId_idx" ON "IntegrationItemLoadMapping"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationItemLoadMapping_loadUnitId_idx" ON "IntegrationItemLoadMapping"("loadUnitId");

-- CreateIndex
CREATE INDEX "IntegrationItemLoadMapping_companyId_integrationId_isActive_idx" ON "IntegrationItemLoadMapping"("companyId", "integrationId", "isActive");

-- CreateIndex
CREATE INDEX "IntegrationItemLoadMapping_companyId_integrationId_external_idx" ON "IntegrationItemLoadMapping"("companyId", "integrationId", "externalFieldType", "matchType");

-- CreateIndex
CREATE INDEX "OrderLoadItem_orderId_idx" ON "OrderLoadItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderLoadItem_loadUnitId_idx" ON "OrderLoadItem"("loadUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderLoadSnapshot_orderId_key" ON "OrderLoadSnapshot"("orderId");

-- CreateIndex
CREATE INDEX "OrderLoadSnapshot_classificationStatus_idx" ON "OrderLoadSnapshot"("classificationStatus");

-- AddForeignKey
ALTER TABLE "CompanyLoadUnit" ADD CONSTRAINT "CompanyLoadUnit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCourierCapacityRule" ADD CONSTRAINT "CompanyCourierCapacityRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationItemLoadMapping" ADD CONSTRAINT "IntegrationItemLoadMapping_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationItemLoadMapping" ADD CONSTRAINT "IntegrationItemLoadMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationItemLoadMapping" ADD CONSTRAINT "IntegrationItemLoadMapping_loadUnitId_fkey" FOREIGN KEY ("loadUnitId") REFERENCES "CompanyLoadUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLoadItem" ADD CONSTRAINT "OrderLoadItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLoadItem" ADD CONSTRAINT "OrderLoadItem_loadUnitId_fkey" FOREIGN KEY ("loadUnitId") REFERENCES "CompanyLoadUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLoadSnapshot" ADD CONSTRAINT "OrderLoadSnapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
