import { prisma } from "@/lib/prisma";

type AcquireCronLockResult =
  | {
      acquired: true;
      lockKey: string;
      lockedUntil: Date;
    }
  | {
      acquired: false;
      lockKey: string;
      lockedUntil: Date;
    };

function addMilliseconds(date: Date, ms: number) {
  return new Date(date.getTime() + ms);
}

export async function acquireCronLock(
  lockKey: string,
  ttlMs: number
): Promise<AcquireCronLockResult> {
  const now = new Date();
  const nextLockedUntil = addMilliseconds(now, ttlMs);

  const existing = await prisma.cronExecutionLock.findUnique({
    where: { key: lockKey },
  });

  if (!existing) {
    try {
      await prisma.cronExecutionLock.create({
        data: {
          key: lockKey,
          lockedUntil: nextLockedUntil,
        },
      });

      return {
        acquired: true,
        lockKey,
        lockedUntil: nextLockedUntil,
      };
    } catch {
      const current = await prisma.cronExecutionLock.findUnique({
        where: { key: lockKey },
      });

      if (current) {
        return {
          acquired: current.lockedUntil <= now,
          lockKey,
          lockedUntil: current.lockedUntil,
        };
      }

      return {
        acquired: false,
        lockKey,
        lockedUntil: nextLockedUntil,
      };
    }
  }

  if (existing.lockedUntil > now) {
    return {
      acquired: false,
      lockKey,
      lockedUntil: existing.lockedUntil,
    };
  }

  const updateResult = await prisma.cronExecutionLock.updateMany({
    where: {
      key: lockKey,
      lockedUntil: {
        lte: now,
      },
    },
    data: {
      lockedUntil: nextLockedUntil,
    },
  });

  if (updateResult.count === 1) {
    return {
      acquired: true,
      lockKey,
      lockedUntil: nextLockedUntil,
    };
  }

  const current = await prisma.cronExecutionLock.findUnique({
    where: { key: lockKey },
  });

  return {
    acquired: false,
    lockKey,
    lockedUntil: current?.lockedUntil ?? nextLockedUntil,
  };
}

export async function releaseCronLock(lockKey: string): Promise<void> {
  await prisma.cronExecutionLock.updateMany({
    where: {
      key: lockKey,
    },
    data: {
      lockedUntil: new Date(0),
    },
  });
}