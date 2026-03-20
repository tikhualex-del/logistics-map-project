import { NextResponse } from "next/server";
import { retailCrmGet } from "@/server/integrations/retailcrm-client.service";
import { importBatchOrdersForCompany } from "@/server/orders/order-import.service";
import { prisma } from "@/lib/prisma";

const INTEGRATION_ID = "cmmxwyhfd00020ww6qz0yfgw9";

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

        const debugIntegrations = await prisma.integration.findMany({
            where: {
                companyId: "cmmwlt5dv0009rgw61xxx4fdm",
            },
            select: {
                id: true,
                companyId: true,
                provider: true,
                isActive: true,
                name: true,
            },
        });

        console.log("CRON_DEBUG_INTEGRATIONS", {
            targetIntegrationId: INTEGRATION_ID,
            targetCompanyId: "cmmwlt5dv0009rgw61xxx4fdm",
            integrations: debugIntegrations,
        });

        // 1. загрузка заказов
        const result = await retailCrmGet({
            companyId: "cmmwlt5dv0009rgw61xxx4fdm", // из твоего скрина
            integrationId: INTEGRATION_ID,
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

        // 2. маппинг
        const mapped = orders.map((order: any) => ({
            externalId: String(order.id),
            title: `Заказ #${order.number}`,
            status: order.status || "",
            deliveryType: order.delivery?.code || "",
            address: order.delivery?.address?.text || "",
            latitude: order.delivery?.address?.geo?.latitude || null,
            longitude: order.delivery?.address?.geo?.longitude || null,
        }));

        // 3. импорт
        const importResult = await importBatchOrdersForCompany({
            companyId: "cmmwlt5dv0009rgw61xxx4fdm",
            integrationId: INTEGRATION_ID,
            orders: mapped,
        });

        return NextResponse.json({
            success: true,
            totalFetched: orders.length,
            summary: importResult.summary,
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