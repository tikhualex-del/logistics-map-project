import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.RETAILCRM_BASE_URL;
    const apiKey = process.env.RETAILCRM_API_KEY;

    if (!baseUrl || !apiKey) {
      return NextResponse.json({
        success: false,
        error: "RetailCRM env variables not set",
      });
    }

    const url = `${baseUrl}/api/v5/reference/couriers?apiKey=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json({
        success: false,
        error: data.errorMsg || "RetailCRM returned an error",
        raw: data,
      });
    }

    const rawCouriers = Array.isArray(data.couriers) ? data.couriers : [];

    const couriers = rawCouriers
      .map((courier: any) => {
        const id = courier?.id ?? courier?.courierId ?? null;
        const firstName = courier?.firstName ?? "";
        const lastName = courier?.lastName ?? "";
        const fullName = `${firstName} ${lastName}`.trim() || courier?.name || "Без имени";

        return {
          id,
          firstName,
          lastName,
          fullName,
          active: courier?.active ?? true,
        };
      })
      .filter((courier: any) => courier.id !== null);

    return NextResponse.json({
      success: true,
      couriers,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Ошибка запроса к справочнику курьеров RetailCRM",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}