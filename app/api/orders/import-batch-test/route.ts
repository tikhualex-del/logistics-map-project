import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import {
  ExternalImportOrderInput,
  importBatchOrdersForCompany,
} from "@/server/orders/order-import.service";
import { requireMinRole } from "@/server/auth/require-role";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireMinRole(session, "dispatcher");
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

    const hasInvalidOrder = orders.some((order) => {
      if (!order || typeof order !== "object") {
        return true;
      }

      const externalId = String((order as any).externalId || "").trim();
      const title = String((order as any).title || "").trim();
      const status = String((order as any).status || "").trim();
      const deliveryType = String((order as any).deliveryType || "").trim();
      const address = String((order as any).address || "").trim();

      return !externalId || !title || !status || !deliveryType || !address;
    });

    if (hasInvalidOrder) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Each order must contain externalId, title, status, deliveryType and address",
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
      message === "Not authenticated"
        ? 401
        : message === "Forbidden"
          ? 403
          : message === "Integration not found in current company" ||
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