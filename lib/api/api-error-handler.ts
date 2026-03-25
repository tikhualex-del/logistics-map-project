import { apiError } from "@/lib/api/api-response";
import { isAuthError } from "@/server/auth/auth.errors";
import type { TraceContext } from "@/lib/observability/request-trace";
import { logError, logWarn, withTrace } from "@/lib/observability/logger";
import { reportApiError } from "@/lib/observability/monitoring";

type HandleApiErrorInput = {
  error: unknown;
  trace?: Partial<TraceContext>;
  event: string;
  defaultMessage?: string;
  meta?: Record<string, unknown>;
};

export async function handleApiError(input: HandleApiErrorInput) {
  const {
    error,
    trace,
    event,
    meta,
    defaultMessage = "Internal server error",
  } = input;

  if (isAuthError(error)) {
    const status = error.code === "NO_ACTIVE_COMPANY_ACCESS" ? 403 : 401;

    logWarn(
      withTrace(
        {
          event,
          message: "API request failed with known auth error",
          errorCode: error.code,
          errorMessage: error.message,
          status,
          ...meta,
        },
        trace
      )
    );

    return apiError({
      status,
      message: error.message,
      trace,
    });
  }

  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  logError(
    withTrace(
      {
        event,
        message: "API request failed with unexpected error",
        errorMessage,
        ...meta,
      },
      trace
    )
  );

  await reportApiError({
    event: `${event}.monitoring`,
    message: "Unexpected API error captured",
    trace,
    route: typeof meta?.route === "string" ? meta.route : undefined,
    method: typeof meta?.method === "string" ? meta.method : undefined,
    data: {
      originalEvent: event,
      errorMessage,
      ...meta,
    },
  });

  return apiError({
    status: 500,
    message: defaultMessage,
    trace,
  });
}