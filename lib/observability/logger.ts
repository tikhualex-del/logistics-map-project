import type { TraceContext } from "@/lib/observability/request-trace";

type LogLevel = "debug" | "info" | "warn" | "error";

export type LogPayload = {
  event: string;
  message: string;
  requestId?: string | null;
  correlationId?: string | null;
  durationMs?: number;
  [key: string]: unknown;
};

type OptionalMessageLogPayload = {
  event: string;
  message?: string;
  requestId?: string | null;
  correlationId?: string | null;
  durationMs?: number;
  [key: string]: unknown;
};

type LoggerContext = Partial<TraceContext> & {
  area?: string;
  route?: string;
  method?: string;
  companyId?: string | null;
  userId?: string | null;
  integrationId?: string | null;
  provider?: string | null;
};

const SERVICE_NAME = process.env.APP_NAME || "crm-app";
const ENVIRONMENT = process.env.NODE_ENV || "development";

function buildLog(level: LogLevel, payload: LogPayload) {
  return {
    level,
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    environment: ENVIRONMENT,
    ...payload,
  };
}

function writeLog(level: LogLevel, payload: LogPayload) {
  const line = JSON.stringify(buildLog(level, payload));

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function withTrace(payload: LogPayload, trace?: Partial<TraceContext>): LogPayload {
  if (!trace) {
    return payload;
  }

  return {
    ...payload,
    requestId: trace.requestId ?? payload.requestId ?? null,
    correlationId: trace.correlationId ?? payload.correlationId ?? null,
  };
}

export function withContext(payload: LogPayload, context?: LoggerContext): LogPayload {
  if (!context) {
    return payload;
  }

  return {
    ...payload,
    ...(context.area ? { area: context.area } : {}),
    ...(context.route ? { route: context.route } : {}),
    ...(context.method ? { method: context.method } : {}),
    ...(context.companyId !== undefined ? { companyId: context.companyId } : {}),
    ...(context.userId !== undefined ? { userId: context.userId } : {}),
    ...(context.integrationId !== undefined ? { integrationId: context.integrationId } : {}),
    ...(context.provider !== undefined ? { provider: context.provider } : {}),
    requestId: context.requestId ?? payload.requestId ?? null,
    correlationId: context.correlationId ?? payload.correlationId ?? null,
  };
}

export function logDebug(payload: LogPayload) {
  writeLog("debug", payload);
}

export function logInfo(payload: LogPayload) {
  writeLog("info", payload);
}

export function logWarn(payload: LogPayload) {
  writeLog("warn", payload);
}

export function logError(payload: LogPayload) {
  writeLog("error", payload);
}

export function createDurationLogger() {
  const startedAt = Date.now();

  return {
    getDurationMs() {
      return Date.now() - startedAt;
    },
  };
}

export function logApiRequestStarted(payload: OptionalMessageLogPayload) {
  logInfo({
    ...payload,
    message: payload.message ?? "API request started",
  });
}

export function logApiRequestFinished(
  payload: OptionalMessageLogPayload & {
    status: number;
  }
) {
  logInfo({
    ...payload,
    message: payload.message ?? "API request finished",
  });
}

export function logExternalApiCall(
  payload: OptionalMessageLogPayload & {
    target: string;
    status?: number;
    success: boolean;
  }
) {
  const logger = payload.success ? logInfo : logWarn;

  logger({
    ...payload,
    message: payload.message ?? "External API call completed",
  });
}

export function logCronEvent(
  payload: OptionalMessageLogPayload & {
    job: string;
  }
) {
  logInfo({
    ...payload,
    message: payload.message ?? "Cron job event",
  });
}