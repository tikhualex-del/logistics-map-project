type GeocodeAddressResult = {
  lat: number;
  lon: number;
  displayName: string;
  kind: string | null;
  precision: string | null;
  sourceAddress: string;
} | null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAddress(address: string) {
  return address.trim().replace(/\s+/g, " ");
}

async function requestYandexGeocoder(
  address: string
): Promise<GeocodeAddressResult> {
  const apiKey = process.env.YANDEX_GEOCODER_API_KEY;

  if (!apiKey) {
    throw new Error("YANDEX_GEOCODER_API_KEY is not set");
  }

  const normalizedAddress = normalizeAddress(address);

  if (!normalizedAddress) {
    return null;
  }

  const url = new URL("https://geocode-maps.yandex.ru/v1/");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("geocode", normalizedAddress);
  url.searchParams.set("format", "json");
  url.searchParams.set("results", "5");
  url.searchParams.set("lang", "ru_RU");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Yandex geocoder request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  const members = data?.response?.GeoObjectCollection?.featureMember;

  if (!Array.isArray(members) || members.length === 0) {
    return null;
  }

  console.log(
    "YANDEX GEOCODER CANDIDATES:",
    members.map((item: any) => ({
      text: item?.GeoObject?.metaDataProperty?.GeocoderMetaData?.text || null,
      kind: item?.GeoObject?.metaDataProperty?.GeocoderMetaData?.kind || null,
      precision:
        item?.GeoObject?.metaDataProperty?.GeocoderMetaData?.precision || null,
      pos: item?.GeoObject?.Point?.pos || null,
    }))
  );

  const firstGeoObject = members[0]?.GeoObject;
  const pos = firstGeoObject?.Point?.pos;
  const displayName =
    firstGeoObject?.metaDataProperty?.GeocoderMetaData?.text ||
    normalizedAddress;
  const kind =
    firstGeoObject?.metaDataProperty?.GeocoderMetaData?.kind || null;
  const precision =
    firstGeoObject?.metaDataProperty?.GeocoderMetaData?.precision || null;

  if (!pos || typeof pos !== "string") {
    return null;
  }

  const [lonRaw, latRaw] = pos.split(" ");
  const lat = Number(latRaw);
  const lon = Number(lonRaw);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  await sleep(150);

  return {
    lat,
    lon,
    displayName,
    kind,
    precision,
    sourceAddress: normalizedAddress,
  };
}

function getResultScore(result: Exclude<GeocodeAddressResult, null>) {
  if (result.kind === "entrance" && result.precision === "exact") return 100;
  if (result.kind === "entrance") return 95;
  if (result.kind === "house" && result.precision === "exact") return 80;
  if (result.kind === "house" && result.precision === "number") return 70;
  if (result.kind === "street") return 40;
  return 10;
}

export async function geocodeAddressWithNominatim(
  ...addresses: Array<string | undefined>
): Promise<GeocodeAddressResult> {
  const uniqueAddresses = [...new Set(addresses.map((a) => (a || "").trim()).filter(Boolean))];

  if (uniqueAddresses.length === 0) {
    return null;
  }

  let bestResult: Exclude<GeocodeAddressResult, null> | null = null;

  for (const address of uniqueAddresses) {
    console.log("GEOCODER TRY ADDRESS:", address);

    const result = await requestYandexGeocoder(address);

    console.log("GEOCODER TRY RESULT:", result);

    if (!result) {
      continue;
    }

    if (!bestResult || getResultScore(result) > getResultScore(bestResult)) {
      bestResult = result;
    }

    if (result.kind === "entrance" && result.precision === "exact") {
      return result;
    }
  }

  return bestResult;
}