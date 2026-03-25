-- CreateTable
CREATE TABLE "LoginRateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginRateLimit_key_key" ON "LoginRateLimit"("key");

-- CreateIndex
CREATE INDEX "LoginRateLimit_ip_idx" ON "LoginRateLimit"("ip");

-- CreateIndex
CREATE INDEX "LoginRateLimit_email_idx" ON "LoginRateLimit"("email");

-- CreateIndex
CREATE INDEX "LoginRateLimit_blockedUntil_idx" ON "LoginRateLimit"("blockedUntil");
