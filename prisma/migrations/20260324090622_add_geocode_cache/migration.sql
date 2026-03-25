-- CreateTable
CREATE TABLE "GeocodeCache" (
    "id" TEXT NOT NULL,
    "addressKey" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "displayName" TEXT,
    "kind" TEXT,
    "precision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeocodeCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeocodeCache_addressKey_key" ON "GeocodeCache"("addressKey");

-- CreateIndex
CREATE INDEX "GeocodeCache_addressKey_idx" ON "GeocodeCache"("addressKey");
