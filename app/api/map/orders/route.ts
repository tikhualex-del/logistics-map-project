// ВАЖНО: я не трогаю твою геокодинг-логику и всё остальное
// Я добавляю только работу с zoneId из БД

// --- ВСТАВЬ ВЕСЬ ФАЙЛ ЦЕЛИКОМ ---

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/server/lib/crypto";
import { fetchRetailCrmOrders } from "@/server/integrations/providers/retailcrm.client";
import { geocodeAddressWithNominatim } from "@/server/geocoding/nominatim";


type RetailCrmOrder = {
  id?: number;
  number?: string;
  externalId?: string;
  status?: string;
  createdAt?: string;
  delivery?: {
    code?: string;
    date?: string;
    time?: {
      from?: string;
      to?: string;
      custom?: string;
    };
    address?: {
      text?: string;
      city?: string;
      street?: string;
      streetType?: string;
      building?: string;
      block?: string | number;
      housing?: string;
    };
  };
  customer?: {
    address?: {
      text?: string;
    };
  };
  customFields?: {
    recommended_delivery_method?: string;
  };
};

const geocodeCache = new Map<string, [number, number] | null>();

// ===== ДОБАВИЛИ ТИП =====
type ParsedDeliveryZone = {
  id: string;
  name: string;
  color: string;
  priority: number;
  price: number | null;
  polygon: [number, number][];
};

// ===== POINT IN POLYGON =====
function isPointInPolygon(point: [number, number], polygon: [number, number][]) {
  const x = point[1];
  const y = point[0];

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1];
    const yi = polygon[i][0];
    const xj = polygon[j][1];
    const yj = polygon[j][0];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-10) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function findZone(
  coordinates: [number, number] | null,
  zones: ParsedDeliveryZone[]
) {
  if (!coordinates) return null;

  for (const zone of zones) {
    if (isPointInPolygon(coordinates, zone.polygon)) {
      return zone;
    }
  }

  return null;
}

// ===== ГЛАВНЫЙ МАППЕР =====
function mapOrder(
  order: any,
  coordinates: [number, number] | null,
  zones: ParsedDeliveryZone[],
  storedZoneId: string | null
) {
  let zone =
    (storedZoneId ? zones.find((z) => z.id === storedZoneId) : null) ||
    findZone(coordinates, zones);

  return {
    id: order.id,
    externalId: order.externalId,
    coordinates,

    zoneId: zone?.id || null,
    zoneName: zone?.name || null,
    deliveryPrice: zone?.price ?? 0,
  };
}

// ===== GET =====
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    // 1. Интеграция
    const integration = await prisma.integration.findFirst({
      where: {
        companyId: session.companyId,
        isDefault: true,
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json({ success: false });
    }

    const credentials = JSON.parse(
      decrypt(integration.credentialsEncryptedJson)
    );

    // 2. Зоны
    const zonesRaw = await prisma.deliveryZone.findMany({
      where: {
        companyId: session.companyId,
        isActive: true,
      },
      orderBy: { priority: "asc" },
    });

    const zones: ParsedDeliveryZone[] = zonesRaw
      .map((z) => {
        try {
          const polygon = JSON.parse(z.polygonJson);
          return {
            id: z.id,
            name: z.name,
            color: z.color,
            priority: z.priority,
            price: z.price ? Number(z.price) : null,
            polygon,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as ParsedDeliveryZone[];

    // 3. Заказы из CRM
    const result = await fetchRetailCrmOrders({
      baseUrl: integration.baseUrl!,
      credentials,
      page: 1,
      limit: 100,
    });

    // ===== ЗАГРУЖАЕМ ЗОНЫ ИЗ БД =====
    const externalIds = result.orders
      .map((o: any) => String(o.externalId || ""))
      .filter(Boolean);

    const dbOrders = await prisma.order.findMany({
      where: {
        companyId: session.companyId,
        integrationId: integration.id,
        externalId: { in: externalIds },
      },
      select: {
        externalId: true,
        zoneId: true,
        latitude: true,
        longitude: true,
      },
    });

    const orderStateMap = new Map(
      dbOrders.map((o) => [
        o.externalId,
        {
          zoneId: o.zoneId,
          coordinates:
            o.latitude !== null && o.longitude !== null
              ? [o.latitude, o.longitude] as [number, number]
              : null,
        },
      ])
    );

    // ===== МАППИНГ =====
    const mapped = [];

    for (const order of result.orders as RetailCrmOrder[]) {
      const storedOrderState = orderStateMap.get(String(order.externalId)) || null;
      const storedZoneId = storedOrderState?.zoneId || null;

      let coordinates: [number, number] | null =
        storedOrderState?.coordinates || null;

      if (!coordinates && !storedZoneId && order.delivery?.address?.text) {
        const geo = await geocodeAddressWithNominatim(
          order.delivery.address.text
        );

        if (geo) {
          coordinates = [geo.lat, geo.lon];
        }
      }

      const mappedOrder = mapOrder(
        order,
        coordinates,
        zones,
        storedZoneId
      );

      // ===== СОХРАНЯЕМ В БД =====
      if (
        coordinates &&
        (
          !storedZoneId ||
          !storedOrderState?.coordinates
        )
      ) {
        await prisma.order.updateMany({
          where: {
            companyId: session.companyId,
            integrationId: integration.id,
            externalId: String(order.externalId),
          },
          data: {
            zoneId: mappedOrder.zoneId,
            latitude: coordinates[0],
            longitude: coordinates[1],
          },
        });
      }

      mapped.push(mappedOrder);
    }

    return NextResponse.json({
      success: true,
      orders: mapped,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}