import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";
import {
  createCourierCapacityRule,
  getCourierCapacityRulesByCompanyId,
} from "@/server/courier-capacity/courier-capacity.service";

export async function GET() {
  try {
    const session = await requireSession();

    const rules = await getCourierCapacityRulesByCompanyId(session.companyId);

    return NextResponse.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error("Get courier capacity rules error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to load courier capacity rules";

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

    const courierType = String(body?.courierType || "").trim().toLowerCase();
    const maxOrders = Number(body?.maxOrders);
    const maxCapacityPoints = Number(body?.maxCapacityPoints);

    if (!courierType || !Number.isFinite(maxOrders) || !Number.isFinite(maxCapacityPoints)) {
      return NextResponse.json(
        {
          success: false,
          message: "courierType, maxOrders and maxCapacityPoints are required",
        },
        { status: 400 }
      );
    }

    if (maxOrders <= 0 || maxCapacityPoints <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "maxOrders and maxCapacityPoints must be greater than 0",
        },
        { status: 400 }
      );
    }

    const rule = await createCourierCapacityRule({
      companyId: session.companyId,
      courierType,
      maxOrders,
      maxCapacityPoints,
    });

    return NextResponse.json({
      success: true,
      message: "Courier capacity rule created successfully",
      data: rule,
    });
  } catch (error) {
    console.error("Create courier capacity rule error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create courier capacity rule";

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