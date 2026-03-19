import { NextResponse } from "next/server";

const geoCache = new Map<string, [number, number]>();

async function geocodeAddress(address: string): Promise<{
  coords: [number, number] | null;
  debug: any;
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

async function loadAllOrdersFromRetailCRM(
  baseUrl: string,
  apiKey: string,
  deliveryDate: string | null
) {
  const allOrders: any[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    let url = `${baseUrl}/api/v5/orders?apiKey=${apiKey}&limit=100&page=${page}`;

    if (deliveryDate) {
      url += `&filter[deliveryDateFrom]=${deliveryDate}&filter[deliveryDateTo]=${deliveryDate}`;
    }

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.errorMsg || "RetailCRM returned an error");
    }

    allOrders.push(...(data.orders || []));

    totalPages = Number(data.pagination?.totalPageCount || 1);
    page += 1;
  } while (page <= totalPages);

  return allOrders;
}

export async function GET(request: Request) {
  try {
    const baseUrl = process.env.RETAILCRM_BASE_URL;
    const apiKey = process.env.RETAILCRM_API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json({
        success: false,
        error: "RetailCRM env variables not set",
      });
    }

    const { searchParams } = new URL(request.url);
    const deliveryDate = searchParams.get("deliveryDate");
    if (!deliveryDate) {
      return NextResponse.json({
        success: true,
        totalLoaded: 0,
        orders: [],
      });
    }

    const retailOrders = await loadAllOrdersFromRetailCRM(
      baseUrl,
      apiKey,
      deliveryDate
    );

    const orders = await Promise.all(
      retailOrders.map(async (order: any) => {
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

        // В твоём RetailCRM строение приходит в поле house
        const structurePart =
          address?.house ? `стр. ${address.house}` : null;

        // В твоём RetailCRM подъезд приходит в поле block
        const entrancePart =
          address?.block ? `под. ${address.block}` : null;

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
        let geocodeDebug: any = { reason: "no-coordinates" };

        if (lat && lng) {
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
          title: `Заказ #${order.number}`,
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
    return NextResponse.json({
      success: false,
      error: "Ошибка запроса к RetailCRM",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}