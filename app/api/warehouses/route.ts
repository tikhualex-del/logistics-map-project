import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import {
  createWarehouse,
  getWarehousesByCompanyId,
} from "@/server/warehouses/warehouses.service";
import { requireMinRole } from "@/server/auth/require-role";

export async function GET() {
  try {
    const session = await requireSession();
    const warehouses = await getWarehousesByCompanyId(session.companyId);

    return NextResponse.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error("Get warehouses error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to load warehouses";

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