import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { retailCrmGet } from "@/server/integrations/retailcrm-client.service";

const geoCache = new Map<string, [number, number]>();

type RetailCrmOrderAddress = {
  countryIso?: string | null;
  region?: string | null;
  city?: string | null;
  district?: string | null;
  streetType?: string | null;
  street?: string | null;
  building?: string | null;
  house?: string | null;
  block?: string | null;
  housing?: string | null;
  flat?: string | null;
  floor?: string | null;
  geo?: {
    latitude?: number | string | null;
    longitude?: number | string | null;
  } | null;
};

type RetailCrmOrderDeliveryData = {
  courierId?: number | string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type RetailCrmOrderDelivery = {
  code?: string | null;
  deliveryType?: string | null;
  service?: {
    code?: string | null;
  } | null;
  time?: {
    from?: string | null;
    to?: string | null;
  } | null;
  address?: RetailCrmOrderAddress | null;
  data?: RetailCrmOrderDeliveryData | null;
};

type RetailCrmOrderItem = {
  id?: number | string | null;
  number?: number | string | null;
  status?: string | null;
  delivery?: RetailCrmOrderDelivery | null;
};

type RetailCrmOrdersResponse = {
  success?: boolean;
  errorMsg?: string;
  orders?: RetailCrmOrderItem[];
  pagination?: {
    totalPageCount?: number | string | null;
  } | null;
};

async function geocodeAddress(address: string): Promise<{
  coords: [number, number] | null;
  debug: unknown;
}> {
  if (!address) {
    return {
      coords: null,
      debug: { reason: "empty-address" },
    };
  }

  if (geoCache.has(address)) {
    return {
      coords: geoCache.get(address)!,
      debug: { reason: "from-cache" },
    };
  }

  try {
    const apiKey = process.env.YANDEX_GEOCODER_API_KEY;

    if (!apiKey) {
      return {
        coords: null,
        debug: { reason: "no-api-key" },
      };
    }

    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${encodeURIComponent(
      address
    )}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();

    const pos =
      data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point
        ?.pos;

    if (!pos) {
      return {
        coords: null,
        debug: {
          reason: "no-pos",
          url,
        },
      };
    }

    const [lng, lat] = pos.split(" ").map(Number);
    const coords: [number, number] = [lat, lng];

    geoCache.set(address, coords);

    return {
      coords,
      debug: {
        reason: "success",
        url,
        pos,
      },
    };
  } catch (error) {
    return {
      coords: null,
      debug: {
        reason: "fetch-error",
        message: error instanceof Error ? error.message : "unknown-error",
      },
    };
  }
}

async function loadAllOrdersFromRetailCRM(params: {
  companyId: string;
  integrationId: string;
  deliveryDate: string | null;
}) {
  const { companyId, integrationId, deliveryDate } = params;

  const allOrders: RetailCrmOrderItem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await retailCrmGet<RetailCrmOrdersResponse>({
      companyId,
      integrationId,
      path: "/api/v5/orders",
      searchParams: {
        limit: 100,
        page,
        "filter[deliveryDateFrom]": deliveryDate,
        "filter[deliveryDateTo]": deliveryDate,
      },
    });

    const data = result.data;

    if (!data?.success) {
      throw new Error(data?.errorMsg || "RetailCRM returned an error");
    }

    allOrders.push(...(Array.isArray(data.orders) ? data.orders : []));

    totalPages = Number(data.pagination?.totalPageCount || 1);
    page += 1;
  } while (page <= totalPages);

  return allOrders;
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(request.url);
    const deliveryDate = searchParams.get("deliveryDate");

    const integrationId =
      String(searchParams.get("integrationId") || "").trim() ||
      "cmmxwyhfd0002oww6qz0yfgw9";

    if (!deliveryDate) {
      return NextResponse.json({
        success: true,
        totalLoaded: 0,
        orders: [],
      });
    }

    const retailOrders = await loadAllOrdersFromRetailCRM({
      companyId: session.companyId,
      integrationId,
      deliveryDate,
    });

    const orders = await Promise.all(
      retailOrders.map(async (order) => {
        const lat = order.delivery?.address?.geo?.latitude;
        const lng = order.delivery?.address?.geo?.longitude;

        const rawAddress = order.delivery?.address || null;
        const rawGeo = order.delivery?.address?.geo || null;

        const deliveryType =
          order.delivery?.code ||
          order.delivery?.deliveryType ||
          order.delivery?.service?.code ||
          "";

        const isPickup =
          deliveryType === "self-delivery" ||
          deliveryType === "pickup" ||
          deliveryType === "selfpickup" ||
          deliveryType === "samovyvoz";

        if (isPickup) {
          return null;
        }

        const address = order.delivery?.address || null;

        const streetPart =
          address?.streetType && address?.street
            ? `${address.streetType} ${address.street}`
            : address?.street || null;

        const buildingPart = address?.building ? `д. ${address.building}` : null;
        const structurePart = address?.house ? `стр. ${address.house}` : null;
        const entrancePart = address?.block ? `под. ${address.block}` : null;
        const housingPart = address?.housing ? `корп. ${address.housing}` : null;
        const flatPart = address?.flat ? `кв. ${address.flat}` : null;
        const floorPart = address?.floor ? `эт. ${address.floor}` : null;

        const textAddress = [
          address?.countryIso === "RU" ? "Россия" : null,
          address?.region || null,
          address?.city || null,
          address?.district || null,
          streetPart,
          buildingPart,
          structurePart,
          housingPart,
          entrancePart,
          flatPart,
          floorPart,
        ]
          .filter(Boolean)
          .join(", ");

        let coordinates: [number, number] | null = null;
        let geocodeDebug: unknown = { reason: "no-coordinates" };

        if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
          coordinates = [Number(lat), Number(lng)];
          geocodeDebug = { reason: "from-retailcrm-geo" };
        } else if (textAddress) {
          const geoResult = await geocodeAddress(textAddress);
          geocodeDebug = geoResult.debug;

          if (geoResult.coords) {
            coordinates = geoResult.coords;
          }
        } else {
          geocodeDebug = { reason: "no-text-address" };
        }

        return {
          id: Number(order.id),
          title: `Заказ #${order.number ?? ""}`,
          status: order.status || "",
          rawStatus: order.status || null,
          deliveryTypeCode: order.delivery?.code || "",
          deliveryTypeName: order.delivery?.deliveryType || "",
          rawDelivery: order.delivery || null,
          textAddress,
          rawGeo,
          rawAddress,
          geocodeDebug,
          coordinates,
          deliveryFrom: order.delivery?.time?.from || null,
          deliveryTo: order.delivery?.time?.to || null,
          courierId: order.delivery?.data?.courierId || null,
          courierName:
            order.delivery?.data?.firstName && order.delivery?.data?.lastName
              ? `${order.delivery.data.firstName} ${order.delivery.data.lastName}`.trim()
              : order.delivery?.data?.firstName || order.delivery?.data?.lastName || null,
        };
      })
    );

    const filteredOrders = orders.filter(Boolean);

    return NextResponse.json({
      success: true,
      totalLoaded: filteredOrders.length,
      orders: filteredOrders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    const status =
      message === "Not authenticated"
        ? 401
        : message === "RetailCRM integration not found in current company"
          ? 404
          : message === "RetailCRM integration baseUrl is not set"
            ? 400
            : message === "Failed to decrypt integration credentials"
              ? 500
              : message === "Integration credentials are not valid JSON"
                ? 500
                : message === "RetailCRM apiKey is missing in integration credentials"
                  ? 400
                  : message === "RetailCRM returned non-JSON response"
                    ? 502
                    : message === "RetailCRM request timeout"
                      ? 504
                      : 500;

    return NextResponse.json(
      {
        success: false,
        error: "Ошибка запроса к RetailCRM",
        details: message,
      },
      { status }
    );
  }
}