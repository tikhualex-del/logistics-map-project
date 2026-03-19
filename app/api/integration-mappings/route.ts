import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSessionWithCompany } from "@/server/auth/auth.service";
import {
  createIntegrationMapping,
  getIntegrationMappingsByCompanyId,
} from "@/server/integration-mappings/integration-mappings.service";

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
    const mappings = await getIntegrationMappingsByCompanyId(session.companyId);

    return NextResponse.json({
      success: true,
      data: mappings,
    });
  } catch (error) {
    console.error("Get integration mappings error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to load integration mappings";

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

    const integrationId = String(body.integrationId || "").trim();
    const orderStatusMapJson = String(body.orderStatusMapJson || "").trim();
    const deliveryTypeMapJson = String(body.deliveryTypeMapJson || "").trim();

    const warehouseMapJson = String(body.warehouseMapJson || "").trim();
    const courierMapJson = String(body.courierMapJson || "").trim();

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

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    );
  }
}