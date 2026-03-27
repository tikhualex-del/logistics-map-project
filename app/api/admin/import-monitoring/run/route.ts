import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/prisma";
import { retailCrmGet } from "@/server/integrations/retailcrm-client.service";
import { importBatchOrdersForCompany } from "@/server/orders/order-import.service";
import { getCurrentUserBySessionToken } from "@/server/auth/auth.service";
import { isAdminEmail } from "@/server/admin/admin-access";

type RetailCrmOrdersResponse = {
  success?: boolean;
  errorMsg?: string;
  orders?: any[];
};

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const current = await getCurrentUserBySessionToken(sessionToken);

    if (!isAdminEmail(current.user.email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    const deliveryDate = new Date().toISOString().slice(0, 10);

    const integrations = await prisma.integration.findMany({
      where: {
        provider: "retailcrm",
        isActive: true,
      },
      select: {
        id: true,
        companyId: true,
        name: true,
      },
    });

    const results: Array<{
      integrationId: string;
      companyId: string;
      name: string;
      success: boolean;
      totalFetched?: number;
      summary?: unknown;
      error?: string;
    }> = [];

    for (const integration of integrations) {
      try {
        const result = await retailCrmGet({
          companyId: integration.companyId,
          integrationId: integration.id,
          path: "/api/v5/orders",
          searchParams: {
            limit: 50,
            "filter[deliveryDateFrom]": deliveryDate,
            "filter[deliveryDateTo]": deliveryDate,
          },
        });

        const data = result.data as RetailCrmOrdersResponse;

        if (!data?.success) {
          throw new Error(data?.errorMsg || "RetailCRM error");
        }

        const orders = data.orders || [];

        const mapped = orders.map((order: any) => ({
          externalId: String(order.id),
          title: `Заказ #${order.number}`,
          status: order.status || "",
          deliveryType: order.delivery?.code || "",
          address: order.delivery?.address?.text || "",
          latitude: order.delivery?.address?.geo?.latitude || null,
          longitude: order.delivery?.address?.geo?.longitude || null,
        }));

        const importResult = await importBatchOrdersForCompany({
          companyId: integration.companyId,
          integrationId: integration.id,
          orders: mapped,
        });

        results.push({
          integrationId: integration.id,
          companyId: integration.companyId,
          name: integration.name,
          success: true,
          totalFetched: orders.length,
          summary: importResult.summary,
        });
      } catch (error) {
        console.error("ADMIN_IMPORT_ERROR", error);

        results.push({
          integrationId: integration.id,
          companyId: integration.companyId,
          name: integration.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        continue;
      }
    }

    const successCount = results.filter((item) => item.success).length;
    const failedCount = results.filter((item) => !item.success).length;

    return NextResponse.json({
      success: true,
      completedWithErrors: failedCount > 0,
      totalIntegrations: integrations.length,
      successCount,
      failedCount,
      results,
    });
  } catch (error: any) {
    console.error("Admin manual import run error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Manual import run failed",
      },
      { status: 500 }
    );
  }
}