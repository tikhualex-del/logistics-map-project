import { NextResponse } from "next/server";
import type { TraceContext } from "@/lib/observability/request-trace";
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
} from "@/lib/observability/request-trace";

type ApiSuccessInput = {
  message: string;
  data?: unknown;
  status?: number;
  trace?: Partial<TraceContext>;
  headers?: HeadersInit;
};

type ApiErrorInput = {
  message: string;
  errors?: unknown;
  status: number;
  trace?: Partial<TraceContext>;
  headers?: HeadersInit;
};

function applyTraceHeaders(
  response: NextResponse,
  trace?: Partial<TraceContext>
): NextResponse {
  if (trace?.requestId) {
    response.headers.set(REQUEST_ID_HEADER, trace.requestId);
  }

  if (trace?.correlationId) {
    response.headers.set(CORRELATION_ID_HEADER, trace.correlationId);
  }

  return response;
}

export function apiSuccess(input: ApiSuccessInput) {
  const response = NextResponse.json(
    {
      success: true,
      message: input.message,
      ...(input.data !== undefined ? { data: input.data } : {}),
    },
    {
      status: input.status ?? 200,
      headers: input.headers,
    }
  );

  return applyTraceHeaders(response, input.trace);
}

export function apiError(input: ApiErrorInput) {
  const response = NextResponse.json(
    {
      success: false,
      message: input.message,
      ...(input.errors !== undefined ? { errors: input.errors } : {}),
    },
    {
      status: input.status,
      headers: input.headers,
    }
  );

  return applyTraceHeaders(response, input.trace);
}