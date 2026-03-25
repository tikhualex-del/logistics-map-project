import { NextResponse } from "next/server";
import { retailCrmGet } from "@/server/integrations/retailcrm-client.service";
import { importBatchOrdersForCompany } from "@/server/orders/order-import.service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret");

  if (!cronSecret || providedSecret !== cronSecret) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const deliveryDate = new Date().toISOString().slice(0, 10);

    const integrations = await prisma.integration.findMany({
      where: {
        provider: "retailcrm",
        isActive: true,
      },
      select: {
        id: true,
        companyId: true,
        provider: true,
        isActive: true,
        name: true,
      },
    });

    console.log("CRON_ACTIVE_INTEGRATIONS", {
      total: integrations.length,
      integrations,
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
        console.log("CRON_PROCESSING_INTEGRATION", {
          integrationId: integration.id,
          companyId: integration.companyId,
          name: integration.name,
        });

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

        const data = result.data;

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
        console.error("CRON_IMPORT_FAILED", {
          integrationId: integration.id,
          companyId: integration.companyId,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        results.push({
          integrationId: integration.id,
          companyId: integration.companyId,
          name: integration.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((item) => item.success).length;
    const failedCount = results.filter((item) => !item.success).length;

    return NextResponse.json({
      success: failedCount === 0,
      totalIntegrations: integrations.length,
      successCount,
      failedCount,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Cron import failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}