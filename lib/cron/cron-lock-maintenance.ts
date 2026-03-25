import { prisma } from "@/lib/prisma";

export async function cleanupExpiredCronLocks() {
  const now = new Date();

  const result = await prisma.cronExecutionLock.deleteMany({
    where: {
      lockedUntil: {
        lt: now,
      },
    },
  });

  return {
    deletedCount: result.count,
  };
}