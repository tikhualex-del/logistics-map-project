import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { createOrder, getOrdersByCompanyId } from "@/server/orders/orders.service";
import { requireMinRole } from "@/server/auth/require-role";
import { z } from "zod";

const createOrderSchema = z.object({
  integrationId: z.string().nullable().optional(),
  warehouseId: z.string().nullable().optional(),

  externalId: z.string().min(1),
  title: z.string().min(1),
  status: z.string().min(1),
  deliveryType: z.string().min(1),
  address: z.string().min(1),

  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),

  deliveryWindowFrom: z.string().nullable().optional(),
  deliveryWindowTo: z.string().nullable().optional(),

  courierExternalId: z.string().nullable().optional(),
  courierName: z.string().nullable().optional(),

  rawPayloadJson: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const orders = await getOrdersByCompanyId(session.companyId);

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to load orders";

    const status = message === "Not authenticated" ? 401 : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireMinRole(session, "dispatcher");
    const body = await request.json();

    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const integrationId = data.integrationId || null;
    const warehouseId = data.warehouseId || null;

    const externalId = data.externalId;;
    const title = data.title;
    const status = data.status;
    const deliveryType = data.deliveryType;
    const address = data.address;

    const latitude = data.latitude ?? null;

    const longitude = data.longitude ?? null;

    const deliveryWindowFrom = data.deliveryWindowFrom || null;
    const deliveryWindowTo = data.deliveryWindowTo || null;
    const courierExternalId = data.courierExternalId || null;
    const courierName = data.courierName || null;
    const rawPayloadJson = data.rawPayloadJson || null;

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

    const status =
      message === "Not authenticated"
        ? 401
        : message === "Forbidden"
          ? 403
          : 400;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}