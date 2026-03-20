import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { importSingleOrderForCompany } from "@/server/orders/order-import.service";
import { requireMinRole } from "@/server/auth/require-role";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireMinRole(session, "dispatcher");
    const body = await request.json();

    const integrationId = String(body.integrationId || "").trim();

    if (!integrationId) {
      return NextResponse.json(
        {
          success: false,
          message: "integrationId is required",
        },
        { status: 400 }
      );
    }

    const externalId = String(body.externalId || "").trim();
    const title = String(body.title || "").trim();
    const status = String(body.status || "").trim();
    const deliveryType = String(body.deliveryType || "").trim();
    const address = String(body.address || "").trim();

    if (!externalId || !title || !status || !deliveryType || !address) {
      return NextResponse.json(
        {
          success: false,
          message:
            "externalId, title, status, deliveryType and address are required",
        },
        { status: 400 }
      );
    }

    const result = await importSingleOrderForCompany({
      companyId: session.companyId,
      integrationId,
      rawOrder: {
        externalId,
        title,
        status,
        deliveryType,
        warehouseKey: body.warehouseKey,
        courierKey: body.courierKey,
        courierName: body.courierName,
        address,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Failed to import order",
          externalId: result.externalId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        result.action === "updated"
          ? "Order updated successfully"
          : "Order created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Import test order error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to import test order";

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