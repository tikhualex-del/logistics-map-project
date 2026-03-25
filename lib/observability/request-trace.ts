export const REQUEST_ID_HEADER = "x-request-id";
export const CORRELATION_ID_HEADER = "x-correlation-id";

export type TraceContext = {
  requestId: string | null;
  correlationId: string | null;
};

function normalizeHeaderValue(value: string | null | undefined) {
  if (!value) return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function generateRequestId() {
  return crypto.randomUUID();
}

export function getTraceContextFromHeaders(headers: Headers): TraceContext {
  return {
    requestId: normalizeHeaderValue(headers.get(REQUEST_ID_HEADER)),
    correlationId: normalizeHeaderValue(headers.get(CORRELATION_ID_HEADER)),
  };
}

export function getTraceContextFromRequest(request: Request): TraceContext {
  return getTraceContextFromHeaders(request.headers);
}

export function buildTraceHeaders(requestHeaders: Headers) {
  const headers = new Headers(requestHeaders);

  const requestId =
    normalizeHeaderValue(headers.get(REQUEST_ID_HEADER)) ?? generateRequestId();

  const correlationId =
    normalizeHeaderValue(headers.get(CORRELATION_ID_HEADER)) ?? requestId;

  headers.set(REQUEST_ID_HEADER, requestId);
  headers.set(CORRELATION_ID_HEADER, correlationId);

  return {
    headers,
    trace: {
      requestId,
      correlationId,
    },
  };
}