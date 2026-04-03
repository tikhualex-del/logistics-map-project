import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";

export async function GET() {
  try {
    const session = await requireSession();

    const couriers = await prisma.courier.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, couriers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Not authenticated" ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    requireMinRole(session, "dispatcher");

    const body = await req.json();

    const fullName = String(body.fullName || "").trim();
    if (!fullName) {
      return NextResponse.json(
        { success: false, message: "Имя курьера обязательно" },
        { status: 400 }
      );
    }

    const courierType = ["walk", "car", "bike"].includes(body.courierType)
      ? body.courierType
      : "walk";

    const courier = await prisma.courier.create({
      data: {
        companyId: session.companyId,
        fullName,
        phone: body.phone ? String(body.phone).trim() : null,
        courierType,
        maxCapacityPoints:
          body.maxCapacityPoints != null
            ? Number(body.maxCapacityPoints)
            : null,
        homeAddress: body.homeAddress ? String(body.homeAddress).trim() : null,
        homeLat: body.homeLat != null ? Number(body.homeLat) : null,
        homeLon: body.homeLon != null ? Number(body.homeLon) : null,
        scheduleJson: body.scheduleJson
          ? JSON.stringify(body.scheduleJson)
          : null,
      },
    });

    return NextResponse.json({ success: true, courier }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Not authenticated" ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
