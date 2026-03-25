-- CreateTable
CREATE TABLE "AddressDictionary" (
    "id" TEXT NOT NULL,
    "country" TEXT DEFAULT 'RU',
    "region" TEXT,
    "city" TEXT,
    "streetNormalized" TEXT NOT NULL,
    "streetOriginal" TEXT,
    "house" TEXT NOT NULL,
    "housing" TEXT,
    "building" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddressDictionary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AddressDictionary_city_idx" ON "AddressDictionary"("city");

-- CreateIndex
CREATE INDEX "AddressDictionary_streetNormalized_idx" ON "AddressDictionary"("streetNormalized");

-- CreateIndex
CREATE INDEX "AddressDictionary_city_streetNormalized_house_housing_build_idx" ON "AddressDictionary"("city", "streetNormalized", "house", "housing", "building");
