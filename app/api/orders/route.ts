import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSessionWithCompany } from "@/server/auth/auth.service";
import { createOrder, getOrdersByCompanyId } from "@/server/orders/orders.service";

export async function GET() {
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
    const orders = await getOrdersByCompanyId(session.companyId);

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to load orders";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 401 }
    );
  }
}

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

    const integrationId = String(body.integrationId || "").trim() || null;
    const warehouseId = String(body.warehouseId || "").trim() || null;

    const externalId = String(body.externalId || "").trim();
    const title = String(body.title || "").trim();
    const status = String(body.status || "").trim();
    const deliveryType = String(body.deliveryType || "").trim();
    const address = String(body.address || "").trim();

    const latitude =
      body.latitude === undefined || body.latitude === null || body.latitude === ""
        ? null
        : Number(body.latitude);

    const longitude =
      body.longitude === undefined || body.longitude === null || body.longitude === ""
        ? null
        : Number(body.longitude);

    const deliveryWindowFrom =
      String(body.deliveryWindowFrom || "").trim() || null;
    const deliveryWindowTo =
      String(body.deliveryWindowTo || "").trim() || null;
    const courierExternalId =
      String(body.courierExternalId || "").trim() || null;
    const courierName = String(body.courierName || "").trim() || null;
    const rawPayloadJson =
      body.rawPayloadJson === undefined || body.rawPayloadJson === null
        ? null
        : String(body.rawPayloadJson);

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

    if (
      (latitude !== null && Number.isNaN(latitude)) ||
      (longitude !== null && Number.isNaN(longitude))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "latitude and longitude must be valid numbers",
        },
        { status: 400 }
      );
    }

    const order = await createOrder({
      companyId: session.companyId,
      integrationId,
      warehouseId,
      externalId,
      title,
      status,
      deliveryType,
      address,
      latitude,
      longitude,
      deliveryWindowFrom,
      deliveryWindowTo,
      courierExternalId,
      courierName,
      rawPayloadJson,
    });

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create order";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    );
  }
}