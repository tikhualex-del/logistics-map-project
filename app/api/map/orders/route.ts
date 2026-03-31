import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/server/lib/crypto";
import { fetchRetailCrmOrders } from "@/server/integrations/providers/retailcrm.client";
import { geocodeAddressWithNominatim } from "@/server/geocoding/nominatim";

const geocodeCache = new Map<string, [number, number] | null>();

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

function normalizeAddressKey(input: string) {
  return input
    .toLowerCase()
    .replace(/улица/g, "ул")
    .replace(/проспект/g, "пр-т")
    .replace(/проезд/g, "пр-д")
    .replace(/переулок/g, "пер")
    .replace(/дом/g, "д")
    .replace(/корпус/g, "корп")
    .replace(/подъезд/g, "под")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapRetailCrmOrderToMapOrder(
  order: RetailCrmOrder,
  coordinates: [number, number] | null
) {
  const title = order.number?.trim()
    ? `Заказ #${order.number}`
    : order.id
      ? `Заказ #${order.id}`
      : "Заказ без номера";

  const textAddress =
    order.delivery?.address?.text?.trim() ||
    order.customer?.address?.text?.trim() ||
    null;

  const deliveryTypeCode =
    order.delivery?.code ||
    order.customFields?.recommended_delivery_method ||
    "unknown";

  let deliveryTypeName = "Не указан";

  if (deliveryTypeCode === "courier") {
    deliveryTypeName = "Курьер";
  } else if (deliveryTypeCode === "pedestrian") {
    deliveryTypeName = "Пеший курьер";
  } else if (
    deliveryTypeCode === "pickup" ||
    deliveryTypeCode === "self-delivery"
  ) {
    deliveryTypeName = "Самовывоз";
  } else if (deliveryTypeCode === "express-delivery") {
    deliveryTypeName = "Срочная доставка";
  } else if (deliveryTypeCode === "unknown") {
    deliveryTypeName = "Не указан";
  } else {
    deliveryTypeName = deliveryTypeCode;
  }

  return {
    id: order.id || 0,
    title,
    status: order.status || "unknown",
    textAddress,
    deliveryTypeCode,
    deliveryTypeName,
    deliveryFrom: order.delivery?.time?.from || null,
    deliveryTo: order.delivery?.time?.to || null,
    courierId: null,
    courierName: null,
    coordinates,
    capacityPoints: 0,
    createdAt: order.createdAt || null,
    deliveryDate: order.delivery?.date || null,
  };
}

function buildFullGeocodingQueryAddress(order: RetailCrmOrder) {
  const address = order.delivery?.address;

  if (!address) {
    return "";
  }

  const streetPart =
    address.streetType && address.street
      ? `${address.streetType} ${address.street}`
      : address.street || null;

  const buildingPart = address.building ? `д. ${address.building}` : null;
  const housingPart = address.housing ? `корп. ${address.housing}` : null;

  const entrancePart =
    typeof address.block === "number"
      ? `под. ${address.block}`
      : address.block?.trim()
        ? `под. ${address.block.trim()}`
        : null;

  return [
    "Россия",
    address.city?.trim() || "Москва",
    streetPart?.trim() || null,
    buildingPart,
    housingPart,
    entrancePart,
    address.text?.trim() || null,
  ]
    .filter(Boolean)
    .join(", ");
}

function buildEntranceFocusedGeocodingQueryAddress(order: RetailCrmOrder) {
  const address = order.delivery?.address;

  if (!address) {
    return "";
  }

  const streetPart =
    address.streetType && address.street
      ? `${address.streetType} ${address.street}`
      : address.street || null;

  const buildingPart = address.building ? `д. ${address.building}` : null;
  const housingPart = address.housing ? `корп. ${address.housing}` : null;

  const entrancePart =
    typeof address.block === "number"
      ? `под. ${address.block}`
      : address.block?.trim()
        ? `под. ${address.block.trim()}`
        : null;

  return [
    "Россия",
    address.city?.trim() || "Москва",
    streetPart?.trim() || null,
    buildingPart,
    housingPart,
    entrancePart,
  ]
    .filter(Boolean)
    .join(", ");
}

function buildFallbackGeocodingQueryAddress(order: RetailCrmOrder) {
  const address = order.delivery?.address;

  const city = address?.city?.trim() || "";
  const streetType = address?.streetType?.trim() || "";
  const street = address?.street?.trim() || "";
  const building = address?.building?.trim() || "";
  const housing = address?.housing?.trim() || "";

  const structuredParts = [
    city || "Москва",
    [streetType, street].filter(Boolean).join(" ").trim(),
    building ? `д. ${building}` : "",
    housing ? `корп. ${housing}` : "",
  ].filter(Boolean);

  return structuredParts.join(", ");
}

export async function GET(request: NextRequest) {
  try {
    const requestStartedAt = Date.now();
    const session = await requireSession();

    const { searchParams } = new URL(request.url);
    const deliveryDate = searchParams.get("deliveryDate")?.trim() || null;

    const integration = await prisma.integration.findFirst({
      where: {
        companyId: session.companyId,
        isDefault: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        baseUrl: true,
        credentialsEncryptedJson: true,
        isDefault: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          message: "No active default integration found",
        },
        { status: 400 }
      );
    }

    if (integration.provider !== "retailcrm") {
      return NextResponse.json(
        {
          success: false,
          message: `Unsupported provider: ${integration.provider}`,
        },
        { status: 400 }
      );
    }

    if (!integration.baseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Integration baseUrl is empty",
        },
        { status: 400 }
      );
    }

    const credentialsRaw = decrypt(integration.credentialsEncryptedJson);
    const credentials = JSON.parse(credentialsRaw) as {
      apiKey?: string;
      site?: string;
    };

    const result = await fetchRetailCrmOrders({
      baseUrl: integration.baseUrl,
      credentials: {
        apiKey: credentials.apiKey || "",
        site: credentials.site,
      },
      page: 1,
      limit: 100,
      deliveryDateFrom: deliveryDate || undefined,
      deliveryDateTo: deliveryDate || undefined,
    });

    console.log("PERF retailOrders count:", result.orders.length);
    console.log("PERF retailOrders load ms:", Date.now() - requestStartedAt);

    const ordersToGeocodeLimit = result.orders.length;
    const mappingStartedAt = Date.now();

    let geocodeAttempts = 0;
    let geocodeSuccess = 0;

    const BATCH_SIZE = 5;
    const mappedOrders: ReturnType<typeof mapRetailCrmOrderToMapOrder>[] = [];

    for (let start = 0; start < result.orders.length; start += BATCH_SIZE) {
      const batch = result.orders.slice(start, start + BATCH_SIZE) as RetailCrmOrder[];

      const batchResults = await Promise.all(
        batch.map(async (order, batchIndex) => {
          const index = start + batchIndex;

          const textAddress =
            order.delivery?.address?.text?.trim() ||
            order.customer?.address?.text?.trim() ||
            "";

          let coordinates: [number, number] | null = null;

          if (textAddress && index < ordersToGeocodeLimit) {
            try {
              const fullAddress = buildFullGeocodingQueryAddress(order);
              const entranceFocusedAddress =
                buildEntranceFocusedGeocodingQueryAddress(order);
              const fallbackAddress = buildFallbackGeocodingQueryAddress(order);

              const rawKey = fallbackAddress || textAddress;
              const cacheKey = rawKey ? normalizeAddressKey(rawKey) : null;

              if (cacheKey) {
                const dbCache = await prisma.geocodeCache.findUnique({
                  where: {
                    addressKey: cacheKey,
                  },
                });

                if (dbCache) {
                  coordinates =
                    dbCache.lat !== null && dbCache.lon !== null
                      ? [dbCache.lat, dbCache.lon]
                      : null;

                  if (coordinates) {
                    geocodeSuccess += 1;
                  }

                  console.log("GEOCODING DB CACHE HIT:", {
                    orderId: order.id,
                    cacheKey,
                    coordinates,
                    kind: dbCache.kind,
                    precision: dbCache.precision,
                  });
                } else if (geocodeCache.has(cacheKey)) {
                  coordinates = geocodeCache.get(cacheKey) || null;

                  if (coordinates) {
                    geocodeSuccess += 1;
                  }

                  console.log("GEOCODING MEMORY CACHE HIT:", {
                    orderId: order.id,
                    cacheKey,
                    coordinates,
                  });
                } else {
                  geocodeAttempts += 1;

                  console.log("GEOCODING ORDER ID:", order.id);
                  console.log("GEOCODING FULL ADDRESS:", fullAddress);
                  console.log(
                    "GEOCODING ENTRANCE-FOCUSED ADDRESS:",
                    entranceFocusedAddress
                  );
                  console.log("GEOCODING FALLBACK ADDRESS:", fallbackAddress);

                  const geocodeResult = await geocodeAddressWithNominatim(
                    fullAddress,
                    entranceFocusedAddress,
                    fallbackAddress
                  );

                  console.log("GEOCODING RESULT:", geocodeResult);

                  if (order.id === 423401) {
                    console.log("TARGET ORDER 423401 RESULT:", {
                      orderId: order.id,
                      fullAddress,
                      entranceFocusedAddress,
                      fallbackAddress,
                      geocodeResult,
                    });
                  }

                  if (geocodeResult) {
                    coordinates = [geocodeResult.lat, geocodeResult.lon];
                    geocodeSuccess += 1;
                    geocodeCache.set(cacheKey, coordinates);

                    await prisma.geocodeCache.upsert({
                      where: {
                        addressKey: cacheKey,
                      },
                      update: {
                        lat: geocodeResult.lat,
                        lon: geocodeResult.lon,
                        displayName: geocodeResult.displayName,
                        kind: geocodeResult.kind,
                        precision: geocodeResult.precision,
                      },
                      create: {
                        addressKey: cacheKey,
                        lat: geocodeResult.lat,
                        lon: geocodeResult.lon,
                        displayName: geocodeResult.displayName,
                        kind: geocodeResult.kind,
                        precision: geocodeResult.precision,
                      },
                    });
                  } else {
                    geocodeCache.set(cacheKey, null);

                    await prisma.geocodeCache.upsert({
                      where: {
                        addressKey: cacheKey,
                      },
                      update: {
                        lat: null,
                        lon: null,
                        displayName: null,
                        kind: null,
                        precision: null,
                      },
                      create: {
                        addressKey: cacheKey,
                        lat: null,
                        lon: null,
                        displayName: null,
                        kind: null,
                        precision: null,
                      },
                    });
                  }
                }
              }
            } catch (error) {
              console.error("Geocoding failed for address:", textAddress, error);
            }
          }

          return mapRetailCrmOrderToMapOrder(order, coordinates);
        })
      );

      mappedOrders.push(...batchResults);
    }

    console.log("PERF mapping ms:", Date.now() - mappingStartedAt);
    console.log("PERF geocode attempts:", geocodeAttempts);
    console.log("PERF geocode success:", geocodeSuccess);
    console.log("PERF total request ms:", Date.now() - requestStartedAt);

    return NextResponse.json({
      success: true,
      orders: mappedOrders,
      meta: {
        integration: {
          id: integration.id,
          name: integration.name,
          provider: integration.provider,
          baseUrl: integration.baseUrl,
          isDefault: integration.isDefault,
        },
        count: mappedOrders.length,
        requestedDeliveryDate: deliveryDate,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Map orders error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to load map orders";

    const status = message === "Not authenticated" ? 401 : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}