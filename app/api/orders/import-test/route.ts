import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSessionWithCompany } from "@/server/auth/auth.service";
import { importSingleOrderForCompany } from "@/server/orders/order-import.service";

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

    if (!integrationId) {
      return NextResponse.json(
        {
          success: false,
          message: "integrationId is required",
        },
        { status: 400 }
      );
    }

    const result = await importSingleOrderForCompany({
      companyId: session.companyId,
      integrationId,
      rawOrder: {
        externalId: body.externalId,
        title: body.title,
        status: body.status,
        deliveryType: body.deliveryType,
        warehouseKey: body.warehouseKey,
        courierKey: body.courierKey,
        courierName: body.courierName,
        address: body.address,
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