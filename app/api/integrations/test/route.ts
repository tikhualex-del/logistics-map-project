import { z } from "zod";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";
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
import { fetchRetailCrmOrders } from "@/server/integrations/providers/retailcrm.client";

const testIntegrationSchema = z.object({
    provider: z.string().trim().min(1, "provider is required"),
    baseUrl: z
        .string()
        .trim()
        .min(1, "baseUrl is required")
        .refine((value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }, "baseUrl must be a valid URL"),
    credentials: z.object({
        apiKey: z.string().trim().min(1, "apiKey is required"),
        site: z.string().trim().optional(),
    }),
});

function getHumanErrorMessage(error: unknown) {
    if (!(error instanceof Error)) {
        return "Не удалось проверить подключение";
    }

    const message = error.message.toLowerCase();

    if (message.includes("apiKey".toLowerCase())) {
        return "Проверь API key: он пустой или не подходит.";
    }

    if (message.includes("timed out")) {
        return "Сервис долго не отвечает. Проверь base URL, доступность RetailCRM и попробуй ещё раз.";
    }

    if (message.includes("temporarily unavailable")) {
        return "RetailCRM временно недоступен. Попробуй ещё раз позже.";
    }

    if (message.includes("status 401") || message.includes("status 403")) {
        return "Доступ отклонён. Проверь API key и права доступа.";
    }

    if (message.includes("status 404")) {
        return "Проверь base URL. Похоже, адрес RetailCRM указан неверно.";
    }

    if (message.includes("status 5")) {
        return "RetailCRM сейчас отвечает с ошибкой. Попробуй позже.";
    }

    return error.message;
}

export async function POST(request: Request) {
    const trace = getTraceContextFromRequest(request);
    const timer = createDurationLogger();

    logApiRequestStarted(
        withContext(
            {
                event: "integrations.test.request.started",
                message: "Integration test request started",
            },
            {
                ...trace,
                area: "integrations",
                route: "/api/integrations/test",
                method: "POST",
            }
        )
    );

    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const body = await request.json();

        const parsed = testIntegrationSchema.safeParse({
            provider: body?.provider,
            baseUrl: body?.baseUrl,
            credentials: {
                apiKey: body?.credentials?.apiKey,
                site: body?.credentials?.site,
            },
        });

        if (!parsed.success) {
            logWarn(
                withContext(
                    {
                        event: "integrations.test.invalid_payload",
                        message: "Integration test validation failed",
                        durationMs: timer.getDurationMs(),
                        issues: parsed.error.issues.map((issue) => ({
                            path: issue.path.join("."),
                            message: issue.message,
                        })),
                    },
                    {
                        ...trace,
                        area: "integrations",
                        route: "/api/integrations/test",
                        method: "POST",
                        companyId: session.companyId,
                        userId: session.userId,
                    }
                )
            );

            return apiError({
                status: 400,
                message: "Заполни обязательные поля и проверь формат данных",
                errors: parsed.error.flatten(),
                trace,
            });
        }

        const { provider, baseUrl, credentials } = parsed.data;

        if (provider !== "retailcrm") {
            return apiError({
                status: 400,
                message: "Сейчас тест подключения поддерживается только для provider retailcrm",
                trace,
            });
        }

        const result = await fetchRetailCrmOrders({
            baseUrl,
            credentials: {
                apiKey: credentials.apiKey,
                site: credentials.site?.trim() || undefined,
            },
            page: 1,
            limit: 1,
        });

        logApiRequestFinished({
            event: "integrations.test.success",
            message: "Integration test completed successfully",
            status: 200,
            durationMs: timer.getDurationMs(),
            provider,
            ordersFetched: result.orders.length,
            requestId: trace.requestId ?? null,
            correlationId: trace.correlationId ?? null,
            area: "integrations",
            route: "/api/integrations/test",
            method: "POST",
            companyId: session.companyId,
            userId: session.userId,
        });

        return apiSuccess({
            message: "Подключение успешно проверено",
            data: {
                provider,
                connectionOk: true,
                ordersFetched: result.orders.length,
                currentPage: result.pagination.currentPage,
                totalCount: result.pagination.totalCount,
                totalPageCount: result.pagination.totalPageCount,
            },
            trace,
        });
    } catch (error) {
        const humanMessage = getHumanErrorMessage(error);

        if (error instanceof Error) {
            logWarn(
                withContext(
                    {
                        event: "integrations.test.business_error",
                        message: humanMessage,
                        originalError: error.message,
                        durationMs: timer.getDurationMs(),
                    },
                    {
                        ...trace,
                        area: "integrations",
                        route: "/api/integrations/test",
                        method: "POST",
                    }
                )
            );

            return apiError({
                status: 400,
                message: humanMessage,
                trace,
            });
        }

        return handleApiError({
            error,
            trace,
            event: "integrations.test.error",
            meta: {
                area: "integrations",
                route: "/api/integrations/test",
                method: "POST",
                durationMs: timer.getDurationMs(),
            },
        });
    }
}