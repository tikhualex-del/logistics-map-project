import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSessionWithCompany } from "@/server/auth/auth.service";
import {
  ExternalImportOrderInput,
  importBatchOrdersForCompany,
} from "@/server/orders/order-import.service";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const session = await getCurrentSessionWithCompany(sessionToken);
    const body = await request.json();

    const integrationId = String(body.integrationId || "").trim();
    const orders = Array.isArray(body.orders) ? body.orders : [];

    if (!integrationId) {
      return NextResponse.json(
        {
          success: false,
          message: "integrationId is required",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "orders must be a non-empty array",
        },
        { status: 400 }
      );
    }

    const result = await importBatchOrdersForCompany({
      companyId: session.companyId,
      integrationId,
      orders: orders as ExternalImportOrderInput[],
    });

    return NextResponse.json({
      success: true,
      message: "Batch import finished",
      summary: result.summary,
      results: result.results,
    });
  } catch (error) {
    console.error("Import batch test error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to import batch orders";

    const status =
      message === "Integration not found in current company" ||
      message === "Integration mapping not found for current company"
        ? 404
        : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}