import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSessionWithCompany } from "@/server/auth/auth.service";
import {
  createWarehouse,
  getWarehousesByCompanyId,
} from "@/server/warehouses/warehouses.service";

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

    const warehouses = await getWarehousesByCompanyId(session.companyId);

    return NextResponse.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error("Get warehouses error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to load warehouses";

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

    const name = String(body.name || "").trim();
    const city = String(body.city || "").trim();
    const address = String(body.address || "").trim();

    const latitude =
      body.latitude === undefined || body.latitude === null || body.latitude === ""
        ? null
        : Number(body.latitude);

    const longitude =
      body.longitude === undefined || body.longitude === null || body.longitude === ""
        ? null
        : Number(body.longitude);

    if (!name || !city || !address) {
      return NextResponse.json(
        {
          success: false,
          message: "name, city and address are required",
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

    const warehouse = await createWarehouse({
      companyId: session.companyId,
      name,
      city,
      address,
      latitude,
      longitude,
    });

    return NextResponse.json({
      success: true,
      message: "Warehouse created successfully",
      data: warehouse,
    });
  } catch (error) {
    console.error("Create warehouse error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create warehouse";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    );
  }
}