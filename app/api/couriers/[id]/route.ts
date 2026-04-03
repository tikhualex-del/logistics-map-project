import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    requireMinRole(session, "dispatcher");

    const { id } = await params;

    const existing = await prisma.courier.findFirst({
      where: { id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Курьер не найден" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const data: Record<string, unknown> = {};

    if (body.fullName !== undefined) {
      const fullName = String(body.fullName).trim();
      if (!fullName) {
        return NextResponse.json(
          { success: false, message: "Имя курьера не может быть пустым" },
          { status: 400 }
        );
      }
      data.fullName = fullName;
    }

    if (body.phone !== undefined)
      data.phone = body.phone ? String(body.phone).trim() : null;
    if (body.courierType !== undefined && ["walk", "car", "bike"].includes(body.courierType))
      data.courierType = body.courierType;
    if (body.maxCapacityPoints !== undefined)
      data.maxCapacityPoints = body.maxCapacityPoints != null ? Number(body.maxCapacityPoints) : null;
    if (body.homeAddress !== undefined)
      data.homeAddress = body.homeAddress ? String(body.homeAddress).trim() : null;
    if (body.homeLat !== undefined)
      data.homeLat = body.homeLat != null ? Number(body.homeLat) : null;
    if (body.homeLon !== undefined)
      data.homeLon = body.homeLon != null ? Number(body.homeLon) : null;
    if (body.scheduleJson !== undefined)
      data.scheduleJson = body.scheduleJson ? JSON.stringify(body.scheduleJson) : null;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const courier = await prisma.courier.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, courier });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Not authenticated" ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    requireMinRole(session, "admin");

    const { id } = await params;

    const existing = await prisma.courier.findFirst({
      where: { id, companyId: session.companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Курьер не найден" },
        { status: 404 }
      );
    }

    await prisma.courier.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Not authenticated" ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
