-- CreateTable
CREATE TABLE "Courier" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "courierType" TEXT NOT NULL DEFAULT 'walk',
    "maxCapacityPoints" INTEGER,
    "homeAddress" TEXT,
    "homeLat" DOUBLE PRECISION,
    "homeLon" DOUBLE PRECISION,
    "scheduleJson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Courier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Courier_companyId_idx" ON "Courier"("companyId");

-- CreateIndex
CREATE INDEX "Courier_companyId_isActive_idx" ON "Courier"("companyId", "isActive");

-- AddForeignKey
ALTER TABLE "Courier" ADD CONSTRAINT "Courier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
