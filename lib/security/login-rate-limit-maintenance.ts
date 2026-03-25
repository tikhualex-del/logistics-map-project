import { prisma } from "@/lib/prisma";

const LOGIN_RATE_LIMIT_RETENTION_MS = 24 * 60 * 60 * 1000;

function getRetentionBorderDate() {
  return new Date(Date.now() - LOGIN_RATE_LIMIT_RETENTION_MS);
}

export async function cleanupExpiredLoginRateLimits() {
  const retentionBorder = getRetentionBorderDate();

  const result = await prisma.loginRateLimit.deleteMany({
    where: {
      updatedAt: {
        lt: retentionBorder,
      },
      OR: [
        {
          blockedUntil: null,
        },
        {
          blockedUntil: {
            lt: new Date(),
          },
        },
      ],
    },
  });

  return {
    deletedCount: result.count,
  };
}