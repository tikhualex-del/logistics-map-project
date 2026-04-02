import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import {
  createIntegrationMapping,
  getIntegrationMappingsByCompanyId,
} from "@/server/integration-mappings/integration-mappings.service";
import { requireMinRole } from "@/server/auth/require-role";

export async function GET() {
  try {
    const session = await requireSession();
    const mappings = await getIntegrationMappingsByCompanyId(session.companyId);

    return NextResponse.json({
      success: true,
      data: mappings,
    });
  } catch (error) {
    console.error("Get integration mappings error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to load integration mappings";

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
    requireMinRole(session, "admin");
    const body = await request.json();

    const integrationId = String(body.integrationId || "").trim();
    const orderStatusMapJson = String(body.orderStatusMapJson || "").trim();
    const deliveryTypeMapJson = String(body.deliveryTypeMapJson || "").trim();

    const warehouseMapJson = String(body.warehouseMapJson || "").trim();
    const courierMapJson = String(body.courierMapJson || "").trim();
    const mapStatusConfigJson = String(body.mapStatusConfigJson || "").trim();

    if (!integrationId || !orderStatusMapJson || !deliveryTypeMapJson) {
      return NextResponse.json(
        {
          success: false,
          message:
            "integrationId, orderStatusMapJson and deliveryTypeMapJson are required",
        },
        { status: 400 }
      );
    }

    const mapping = await createIntegrationMapping({
      companyId: session.companyId,
      integrationId,
      orderStatusMapJson,
      deliveryTypeMapJson,
      warehouseMapJson: warehouseMapJson || null,
      courierMapJson: courierMapJson || null,
      mapStatusConfigJson: mapStatusConfigJson || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Integration mapping created successfully",
      data: mapping,
    });
  } catch (error) {
    console.error("Create integration mapping error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create integration mapping";

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