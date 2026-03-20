import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { retailCrmGet } from "@/server/integrations/retailcrm-client.service";
import { importBatchOrdersForCompany } from "@/server/orders/order-import.service";

async function loadOrders(params: {
  companyId: string;
  integrationId: string;
  deliveryDate: string;
}) {
  const { companyId, integrationId, deliveryDate } = params;

  const result = await retailCrmGet({
    companyId,
    integrationId,
    path: "/api/v5/orders",
    searchParams: {
      limit: 50,
      "filter[deliveryDateFrom]": deliveryDate,
      "filter[deliveryDateTo]": deliveryDate,
    },
  });

  const data = result.data;

  if (!data?.success) {
    throw new Error(data?.errorMsg || "RetailCRM returned an error");
  }

  return data.orders || [];
}

function mapOrder(order: any) {
  return {
    externalId: String(order.id),
    title: `Заказ #${order.number}`,
    status: order.status || "",
    deliveryType:
      order.delivery?.code ||
      order.delivery?.deliveryType ||
      "",
    warehouseKey: order.delivery?.address?.externalId || "",
    courierKey: order.delivery?.data?.courierId || "",
    courierName:
      order.delivery?.data?.firstName && order.delivery?.data?.lastName
        ? `${order.delivery.data.firstName} ${order.delivery.data.lastName}`
        : "",
    address: order.delivery?.address?.text || "",
    latitude: order.delivery?.address?.geo?.latitude || null,
    longitude: order.delivery?.address?.geo?.longitude || null,
  };
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();

    const body = await request.json();

    const integrationId = String(body.integrationId || "").trim();
    const deliveryDate = String(body.deliveryDate || "").trim();
    const dryRun = Boolean(body.dryRun);

    if (!integrationId || !deliveryDate) {
      return NextResponse.json(
        {
          success: false,
          message: "integrationId and deliveryDate are required",
        },
        { status: 400 }
      );
    }

    // 1. Загружаем из CRM
    const retailOrders = await loadOrders({
      companyId: session.companyId,
      integrationId,
      deliveryDate,
    });

    // 2. Маппинг
    const mappedOrders = retailOrders.map(mapOrder);

    // DRY RUN — только показываем
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        totalFetched: retailOrders.length,
        preview: mappedOrders.slice(0, 5), // первые 5
      });
    }

    // 3. Реальный импорт
    const result = await importBatchOrdersForCompany({
      companyId: session.companyId,
      integrationId,
      orders: mappedOrders,
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      summary: result.summary,
      results: result.results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "Import orders failed",
        details: message,
      },
      { status: 500 }
    );
  }
}