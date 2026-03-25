import { acquireCronLock, releaseCronLock } from "@/lib/cron/cron-lock";
import { cleanupExpiredCronLocks } from "@/lib/cron/cron-lock-maintenance";
import { prisma } from "@/lib/prisma";
import { cleanupExpiredLoginRateLimits } from "@/lib/security/login-rate-limit-maintenance";
import { NextResponse } from "next/server";

const CRON_LOCK_KEY = "cron:cleanup-sessions";
const CRON_LOCK_TTL_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret");

  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const lock = await acquireCronLock(CRON_LOCK_KEY, CRON_LOCK_TTL_MS);

  if (!lock.acquired) {
    return NextResponse.json({
      success: true,
      message: "Cleanup sessions skipped: job is already running",
      skipped: true,
      lockKey: lock.lockKey,
      lockedUntil: lock.lockedUntil.toISOString(),
    });
  }

  try {
    const expiredSessionsResult = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    const loginRateLimitCleanupResult = await cleanupExpiredLoginRateLimits();
    const cronLockCleanupResult = await cleanupExpiredCronLocks();

    return NextResponse.json({
      success: true,
      message: "Expired sessions cleaned up",
      deletedCount: expiredSessionsResult.count,
      loginRateLimitDeletedCount: loginRateLimitCleanupResult.deletedCount,
      cronLockDeletedCount: cronLockCleanupResult.deletedCount,
      skipped: false,
    });
  } catch (error) {
    console.error("Cleanup sessions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to clean up expired sessions",
      },
      { status: 500 }
    );
  } finally {
    await releaseCronLock(CRON_LOCK_KEY);
  }
}