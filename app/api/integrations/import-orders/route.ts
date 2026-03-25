import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/server/lib/crypto";

export async function POST() {
  try {
    const session = await requireSession();

    // 1. Получаем default integration
    const integration = await prisma.integration.findFirst({
      where: {
        companyId: session.companyId,
        isDefault: true,
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { success: false, message: "Default integration not found" },
        { status: 400 }
      );
    }

    // 2. Достаём credentials
    const credentialsRaw = decrypt(integration.credentialsEncryptedJson);
    const credentials = JSON.parse(credentialsRaw);

    const apiKey = credentials.apiKey;

    // 3. Запрос во внешний API (пример — под себя адаптируешь)
    const response = await fetch(`${integration.baseUrl}/orders`, {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
      },
    });

    const data = await response.json();

    const orders = data.orders || [];

    // 4. Сохраняем в БД
    for (const o of orders) {
      await prisma.order.upsert({
        where: {
          companyId_integrationId_externalId: {
            companyId: session.companyId,
            integrationId: integration.id,
            externalId: String(o.id),
          },
        },
        update: {
          title: o.title || "Order",
          status: o.status || "new",
          deliveryType: o.deliveryType || "unknown",
          address: o.address || "",
          latitude: o.latitude || null,
          longitude: o.longitude || null,
          courierExternalId: o.courierId?.toString() || null,
          courierName: o.courierName || null,
          updatedAt: new Date(),
        },
        create: {
          companyId: session.companyId,
          integrationId: integration.id,
          externalId: String(o.id),
          title: o.title || "Order",
          status: o.status || "new",
          deliveryType: o.deliveryType || "unknown",
          address: o.address || "",
          latitude: o.latitude || null,
          longitude: o.longitude || null,
          courierExternalId: o.courierId?.toString() || null,
          courierName: o.courierName || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${orders.length} orders`,
    });
  } catch (error) {
    console.error("Import orders error:", error);

    return NextResponse.json(
      { success: false, message: "Import failed" },
      { status: 500 }
    );
  }
}