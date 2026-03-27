import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
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