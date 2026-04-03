import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUserBySessionToken } from "@/server/auth/auth.service";
import { isAdminEmail } from "@/server/admin/admin-access";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const current = await getCurrentUserBySessionToken(sessionToken);

    if (!isAdminEmail(current.user.email)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const integrations = await prisma.integration.findMany({
      where: {
        provider: "retailcrm",
      },
      include: {
        company: true,
        orders: {
          select: {
            id: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = integrations.map((integration) => {
      const ordersCount = integration.orders.length;
      const lastOrderUpdateAt =
        ordersCount > 0 ? integration.orders[0].updatedAt : null;

      return {
        id: integration.id,
        integrationName: integration.name,
        provider: integration.provider,
        companyId: integration.companyId,
        companyName: integration.company.name,
        isActive: integration.isActive,
        isDefault: integration.isDefault,
        createdAt: integration.createdAt,
        ordersCount,
        hasImportedOrders: ordersCount > 0,
        lastOrderUpdateAt,
      };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Admin import monitoring error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load import monitoring",
      },
      { status: 500 }
    );
  }
}