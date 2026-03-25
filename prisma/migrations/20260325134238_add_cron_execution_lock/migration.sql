-- CreateTable
CREATE TABLE "CronExecutionLock" (
    "key" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CronExecutionLock_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "CronExecutionLock_lockedUntil_idx" ON "CronExecutionLock"("lockedUntil");
