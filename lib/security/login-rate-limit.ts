import { prisma } from "@/lib/prisma";

type RateLimitState = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const WINDOW_MS = 15 * 60 * 1000; // 15 минут
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000; // блокировка на 15 минут

function getKey(ip: string, email: string) {
  return `${ip}:${email.trim().toLowerCase()}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function addMilliseconds(date: Date, ms: number) {
  return new Date(date.getTime() + ms);
}

function getRetryAfterSeconds(blockedUntil: Date, now: Date) {
  return Math.max(0, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000));
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export async function checkLoginRateLimit(ip: string, email: string): Promise<RateLimitState> {
  const normalizedEmail = normalizeEmail(email);
  const key = getKey(ip, normalizedEmail);
  const now = new Date();

  const record = await prisma.loginRateLimit.findUnique({
    where: { key },
  });

  if (!record) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  const blockExpired = record.blockedUntil !== null && now >= record.blockedUntil;
  const windowExpired = now.getTime() - record.windowStartedAt.getTime() > WINDOW_MS;

  if (blockExpired || windowExpired) {
    await prisma.loginRateLimit.update({
      where: { key },
      data: {
        attempts: 0,
        windowStartedAt: now,
        blockedUntil: null,
      },
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (record.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      retryAfterSeconds: getRetryAfterSeconds(record.blockedUntil, now),
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export async function registerFailedLoginAttempt(ip: string, email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const key = getKey(ip, normalizedEmail);
  const now = new Date();

  const existing = await prisma.loginRateLimit.findUnique({
    where: { key },
  });

  if (!existing) {
    await prisma.loginRateLimit.create({
      data: {
        key,
        ip,
        email: normalizedEmail,
        attempts: 1,
        windowStartedAt: now,
        blockedUntil: null,
      },
    });
    return;
  }

  const blockExpired = existing.blockedUntil !== null && now >= existing.blockedUntil;
  const windowExpired = now.getTime() - existing.windowStartedAt.getTime() > WINDOW_MS;

  if (blockExpired || windowExpired) {
    await prisma.loginRateLimit.update({
      where: { key },
      data: {
        attempts: 1,
        windowStartedAt: now,
        blockedUntil: null,
      },
    });
    return;
  }

  const nextAttempts = existing.attempts + 1;
  const shouldBlock = nextAttempts >= MAX_ATTEMPTS;

  await prisma.loginRateLimit.update({
    where: { key },
    data: {
      attempts: nextAttempts,
      blockedUntil: shouldBlock ? addMilliseconds(now, BLOCK_MS) : existing.blockedUntil,
    },
  });
}

export async function clearLoginRateLimit(ip: string, email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const key = getKey(ip, normalizedEmail);

  await prisma.loginRateLimit.deleteMany({
    where: { key },
  });
}