import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.RETAILCRM_BASE_URL;
    const apiKey = process.env.RETAILCRM_API_KEY;

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: "Не задан RETAILCRM_BASE_URL" },
        { status: 500 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Не задан RETAILCRM_API_KEY" },
        { status: 500 }
      );
    }

    const url = `${baseUrl}/api/v5/orders?apiKey=${apiKey}&limit=20`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      status: response.status,
      retailcrmResponse: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при запросе в RetailCRM",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}