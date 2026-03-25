import { logError, logInfo, logWarn, withContext } from "@/lib/observability/logger";
import type { TraceContext } from "@/lib/observability/request-trace";

type MonitoringSeverity = "info" | "warn" | "error";

type MonitoringEventInput = {
  event: string;
  message: string;
  severity: MonitoringSeverity;
  trace?: Partial<TraceContext>;
  context?: {
    area?: string;
    route?: string;
    method?: string;
    companyId?: string | null;
    userId?: string | null;
    integrationId?: string | null;
    provider?: string | null;
  };
  data?: Record<string, unknown>;
};

function buildMonitoringPayload(input: MonitoringEventInput) {
  return withContext(
    {
      event: input.event,
      message: input.message,
      ...input.data,
    },
    {
      ...input.trace,
      ...input.context,
    }
  );
}

export async function reportMonitoringEvent(input: MonitoringEventInput) {
  const payload = buildMonitoringPayload(input);

  if (input.severity === "error") {
    logError(payload);
    return;
  }

  if (input.severity === "warn") {
    logWarn(payload);
    return;
  }

  logInfo(payload);
}

export async function reportApiError(params: {
  event: string;
  message: string;
  trace?: Partial<TraceContext>;
  route?: string;
  method?: string;
  data?: Record<string, unknown>;
}) {
  await reportMonitoringEvent({
    event: params.event,
    message: params.message,
    severity: "error",
    trace: params.trace,
    context: {
      area: "api",
      route: params.route,
      method: params.method,
    },
    data: params.data,
  });
}

export async function reportExternalApiIssue(params: {
  event: string;
  message: string;
  trace?: Partial<TraceContext>;
  provider?: string | null;
  integrationId?: string | null;
  data?: Record<string, unknown>;
  severity?: MonitoringSeverity;
}) {
  await reportMonitoringEvent({
    event: params.event,
    message: params.message,
    severity: params.severity ?? "warn",
    trace: params.trace,
    context: {
      area: "external_api",
      provider: params.provider,
      integrationId: params.integrationId,
    },
    data: params.data,
  });
}

export async function reportCronIssue(params: {
  event: string;
  message: string;
  data?: Record<string, unknown>;
  severity?: MonitoringSeverity;
}) {
  await reportMonitoringEvent({
    event: params.event,
    message: params.message,
    severity: params.severity ?? "error",
    context: {
      area: "cron",
    },
    data: params.data,
  });
}