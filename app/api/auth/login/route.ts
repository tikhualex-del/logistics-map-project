import { cookies } from "next/headers";
import { z } from "zod";
import { loginUser } from "@/server/auth/auth.service";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  getClientIp,
  registerFailedLoginAttempt,
} from "@/lib/security/login-rate-limit";
import {
  createDurationLogger,
  logApiRequestFinished,
  logApiRequestStarted,
  logWarn,
  withContext,
} from "@/lib/observability/logger";
import { getTraceContextFromRequest } from "@/lib/observability/request-trace";
import { apiError, apiSuccess } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/api-error-handler";
import { isAuthError } from "@/server/auth/auth.errors";

const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().trim().min(1, "Password is required"),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const trace = getTraceContextFromRequest(request);
  const timer = createDurationLogger();
  let emailForRateLimit = "";

  logApiRequestStarted(
    withContext(
      {
        event: "auth.login.request.started",
        message: "Login request started",
        ip,
      },
      {
        ...trace,
        area: "auth",
        route: "/api/auth/login",
        method: "POST",
      }
    )
  );

  try {
    const body = await request.json();

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      logWarn(
        withContext(
          {
            event: "auth.login.invalid_payload",
            message: "Login request validation failed",
            ip,
            durationMs: timer.getDurationMs(),
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
          {
            ...trace,
            area: "auth",
            route: "/api/auth/login",
            method: "POST",
          }
        )
      );

      return apiError({
        status: 400,
        message: "Invalid request data",
        errors: parsed.error.flatten(),
        trace,
      });
    }

    const { email, password } = parsed.data;
    emailForRateLimit = email;

    const rateLimitState = await checkLoginRateLimit(ip, email);

    if (!rateLimitState.allowed) {
      logWarn(
        withContext(
          {
            event: "auth.login.rate_limited",
            message: "Login blocked by rate limiter",
            ip,
            email,
            retryAfterSeconds: rateLimitState.retryAfterSeconds,
            durationMs: timer.getDurationMs(),
          },
          {
            ...trace,
            area: "auth",
            route: "/api/auth/login",
            method: "POST",
          }
        )
      );

      return apiError({
        status: 429,
        message: "Too many login attempts. Please try again later.",
        trace,
        headers: {
          "Retry-After": String(rateLimitState.retryAfterSeconds),
        },
      });
    }

    const result = await loginUser(email, password);

    await clearLoginRateLimit(ip, email);

    const logPayload = withContext(
      {
        event: "auth.login.success",
        message: "User logged in successfully",
        ip,
        email,
        durationMs: timer.getDurationMs(),
      },
      {
        ...trace,
        area: "auth",
        route: "/api/auth/login",
        method: "POST",
        userId: result.user.id,
        companyId: result.company.id,
      }
    );

    logApiRequestFinished({
      ...logPayload,
      status: 200,
    });

    const cookieStore = await cookies();

    cookieStore.set("session_token", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return apiSuccess({
      message: "Login successful",
      trace,
    });
  } catch (error) {
    if (
      emailForRateLimit &&
      isAuthError(error) &&
      error.code === "INVALID_CREDENTIALS"
    ) {
      await registerFailedLoginAttempt(ip, emailForRateLimit);
    }

    return handleApiError({
      error,
      trace,
      event: "auth.login.error",
      meta: {
        ip,
        email: emailForRateLimit || null,
        durationMs: timer.getDurationMs(),
        area: "auth",
        route: "/api/auth/login",
        method: "POST",
      },
    });
  }
}