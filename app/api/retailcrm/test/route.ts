import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { retailCrmGet } from "@/server/integrations/retailcrm-client.service";

export async function GET(request: Request) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(request.url);
    const integrationId = String(searchParams.get("integrationId") || "").trim();

    if (!integrationId) {
      return NextResponse.json(
        {
          success: false,
          error: "integrationId is required",
        },
        { status: 400 }
      );
    }

    const result = await retailCrmGet({
      companyId: session.companyId,
      integrationId,
      path: "/api/v5/orders",
      searchParams: {
        limit: 20,
      },
    });

    return NextResponse.json({
      success: true,
      status: result.status,
      integration: result.integration,
      retailcrmResponse: result.data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    const status =
      message === "Not authenticated"
        ? 401
        : message === "RetailCRM integration not found in current company"
          ? 404
          : message === "RetailCRM integration baseUrl is not set"
            ? 400
            : message === "Failed to decrypt integration credentials"
              ? 500
              : message === "Integration credentials are not valid JSON"
                ? 500
                : message === "RetailCRM apiKey is missing in integration credentials"
                  ? 400
                  : message === "RetailCRM returned non-JSON response"
                    ? 502
                    : message === "RetailCRM request timeout"
                      ? 504
                      : 500;

    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при запросе в RetailCRM",
        details: message,
      },
      { status }
    );
  }
}