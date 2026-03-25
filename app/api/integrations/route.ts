import { z } from "zod";
import { requireSession } from "@/server/auth/require-session";
import {
  createIntegration,
  getIntegrationsByCompanyId,
} from "@/server/integrations/integrations.service";
import { requireMinRole } from "@/server/auth/require-role";
import { isIntegrationError } from "@/server/integrations/integrations.errors";
import { apiError, apiSuccess } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/api-error-handler";
import { getTraceContextFromRequest } from "@/lib/observability/request-trace";
import {
  createDurationLogger,
  logApiRequestFinished,
  logApiRequestStarted,
  logWarn,
  withContext,
} from "@/lib/observability/logger";

const createIntegrationSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  provider: z.string().trim().min(1, "provider is required"),
  baseUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => {
      if (!value) {
        return true;
      }

      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "baseUrl must be a valid URL"),
  credentialsJson: z.string().trim().min(1, "credentialsJson is required"),
});

export async function GET(request: Request) {
  const trace = getTraceContextFromRequest(request);
  const timer = createDurationLogger();

  logApiRequestStarted(
    withContext(
      {
        event: "integrations.list.request.started",
        message: "Get integrations request started",
      },
      {
        ...trace,
        area: "integrations",
        route: "/api/integrations",
        method: "GET",
      }
    )
  );

  try {
    const session = await requireSession();
    const integrations = await getIntegrationsByCompanyId(session.companyId);

    const getSuccessLogPayload = withContext(
      {
        event: "integrations.list.success",
        message: "Integrations loaded successfully",
        companyId: session.companyId,
        count: integrations.length,
        durationMs: timer.getDurationMs(),
      },
      {
        ...trace,
        area: "integrations",
        route: "/api/integrations",
        method: "GET",
        companyId: session.companyId,
        userId: session.userId,
      }
    );

    logApiRequestFinished({
      ...getSuccessLogPayload,
      status: 200,
    });

    return apiSuccess({
      message: "Integrations loaded successfully",
      data: integrations,
      trace,
    });
  } catch (error) {
    return handleApiError({
      error,
      trace,
      event: "integrations.list.error",
      meta: {
        area: "integrations",
        route: "/api/integrations",
        method: "GET",
        durationMs: timer.getDurationMs(),
      },
    });
  }
}

export async function POST(request: Request) {
  const trace = getTraceContextFromRequest(request);
  const timer = createDurationLogger();

  logApiRequestStarted(
    withContext(
      {
        event: "integrations.create.request.started",
        message: "Create integration request started",
      },
      {
        ...trace,
        area: "integrations",
        route: "/api/integrations",
        method: "POST",
      }
    )
  );

  try {
    const session = await requireSession();
    requireMinRole(session, "admin");

    const body = await request.json();

    const normalizedBody = {
      name: body?.name,
      provider: body?.provider,
      baseUrl: body?.baseUrl,
      credentialsJson:
        body?.credentialsJson ?? body?.credentialsEncryptedJson,
    };

    const parsed = createIntegrationSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      logWarn(
        withContext(
          {
            event: "integrations.create.invalid_payload",
            message: "Create integration validation failed",
            durationMs: timer.getDurationMs(),
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
          {
            ...trace,
            area: "integrations",
            route: "/api/integrations",
            method: "POST",
            companyId: session.companyId,
            userId: session.userId,
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

    const { name, provider, baseUrl, credentialsJson } = parsed.data;

    const integration = await createIntegration({
      companyId: session.companyId,
      name,
      provider,
      baseUrl: baseUrl || null,
      credentialsJson,
    });

    const createSuccessLogPayload = withContext(
      {
        event: "integrations.create.success",
        message: "Integration created successfully",
        companyId: session.companyId,
        userId: session.userId,
        integrationId: integration.id,
        provider: integration.provider,
        durationMs: timer.getDurationMs(),
      },
      {
        ...trace,
        area: "integrations",
        route: "/api/integrations",
        method: "POST",
        companyId: session.companyId,
        userId: session.userId,
        integrationId: integration.id,
        provider: integration.provider,
      }
    );

    logApiRequestFinished({
      ...createSuccessLogPayload,
      status: 200,
    });

    return apiSuccess({
      message: "Integration created successfully",
      data: integration,
      trace,
    });
  } catch (error) {
    if (isIntegrationError(error)) {
      const status =
        error.code === "INTEGRATION_ALREADY_EXISTS"
          ? 409
          : error.code === "INTEGRATION_NOT_FOUND"
            ? 404
            : 400;

      logWarn(
        withContext(
          {
            event: "integrations.create.business_error",
            message: error.message,
            status,
            durationMs: timer.getDurationMs(),
            errorCode: error.code,
          },
          {
            ...trace,
            area: "integrations",
            route: "/api/integrations",
            method: "POST",
          }
        )
      );

      return apiError({
        status,
        message: error.message,
        trace,
      });
    }

    return handleApiError({
      error,
      trace,
      event: "integrations.create.error",
      meta: {
        area: "integrations",
        route: "/api/integrations",
        method: "POST",
        durationMs: timer.getDurationMs(),
      },
    });
  }
}