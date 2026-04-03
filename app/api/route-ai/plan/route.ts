import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAuth } from "@/server/auth/requireAuth";

type IncomingOrder = {
  id: number;
  title: string;
  status: string;
  textAddress?: string | null;
  deliveryTypeCode?: string;
  deliveryFrom?: string;
  deliveryTo?: string;
  courierId?: number | string | null;
  courierName?: string | null;
  coordinates?: [number, number] | null;
};

type IncomingCourierContext = {
  id: string;
  name: string;
  type: "walk" | "car";
  shiftStart: string;
  shiftEnd: string;
  maxOrders: number;
};

type AiPlannerPlan = {
  routeCount: number;
  excludeDeliveryTypes: string[];
  optimizationMode: "sla" | "geo" | "cost";
  maxOrdersPerRoute: number;
  prioritizeEarlySlots: boolean;
  notes: string[];
};

function cleanEnv(value?: string) {
  return (value || "").trim().replace(/^['"]|['"]$/g, "");
}

function normalizePlan(parsed: any): AiPlannerPlan {
  return {
    routeCount: Math.min(10, Math.max(1, Number(parsed?.routeCount || 1))),
    excludeDeliveryTypes: Array.isArray(parsed?.excludeDeliveryTypes)
      ? parsed.excludeDeliveryTypes.map(String)
      : [],
    optimizationMode:
      parsed?.optimizationMode === "geo" || parsed?.optimizationMode === "cost"
        ? parsed.optimizationMode
        : "sla",
    maxOrdersPerRoute: Math.min(
      20,
      Math.max(1, Number(parsed?.maxOrdersPerRoute || 10))
    ),
    prioritizeEarlySlots: Boolean(parsed?.prioritizeEarlySlots),
    notes: Array.isArray(parsed?.notes)
      ? parsed.notes.map(String).slice(0, 5)
      : [],
  };
}

async function getGigaChatAccessToken() {
  const authKey = cleanEnv(process.env.GIGACHAT_AUTH_KEY);
  const scope = cleanEnv(process.env.GIGACHAT_SCOPE) || "GIGACHAT_API_PERS";

  if (!authKey) {
    throw new Error("GIGACHAT_AUTH_KEY не задан в .env.local");
  }

  const rqUid = crypto.randomUUID();

  const response = await fetch(
    "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        RqUID: rqUid,
        Authorization: `Basic ${authKey}`,
      },
      body: new URLSearchParams({
        scope,
      }).toString(),
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || !data?.access_token) {
    throw new Error(
      `Не удалось получить access token GigaChat: ${JSON.stringify(data)}`
    );
  }

  return data.access_token as string;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "route-ai plan endpoint works with GigaChat",
  });
}

export async function POST(req: NextRequest) {
  try {
    let session;

    try {
      session = await requireAuth();
    } catch {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const prompt = String(body?.prompt || "").trim();
    const orders: IncomingOrder[] = Array.isArray(body?.orders) ? body.orders : [];
    const couriers: IncomingCourierContext[] = Array.isArray(body?.couriers)
      ? body.couriers
      : [];
    const businessRules: string[] = Array.isArray(body?.businessRules)
      ? body.businessRules.map(String)
      : [];
    const deliveryDate = body?.deliveryDate ? String(body.deliveryDate) : null;
    const warehouse = body?.warehouse ?? null;

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          plan: null,
          error: "Пустой prompt",
        },
        { status: 400 }
      );
    }

    const compactOrders = orders.map((order) => ({
      id: order.id,
      title: order.title,
      status: order.status,
      deliveryTypeCode: order.deliveryTypeCode ?? null,
      deliveryFrom: order.deliveryFrom ?? null,
      deliveryTo: order.deliveryTo ?? null,
      textAddress: order.textAddress ?? null,
      coordinates: order.coordinates ?? null,
    }));

    const compactCouriers = couriers.map((courier) => ({
      id: courier.id,
      name: courier.name,
      type: courier.type,
      shiftStart: courier.shiftStart,
      shiftEnd: courier.shiftEnd,
      maxOrders: courier.maxOrders,
    }));

    const accessToken = await getGigaChatAccessToken();

    const systemPrompt = `
Ты AI Planner для логиста доставки.

Твоя задача:
преобразовать текстовую инструкцию логиста в СТРОГО JSON-план.

Верни только JSON.
Без markdown.
Без пояснений вне JSON.
Без блока \`\`\`json.

Формат ответа:

{
  "routeCount": number,
  "excludeDeliveryTypes": string[],
  "optimizationMode": "sla" | "geo" | "cost",
  "maxOrdersPerRoute": number,
  "prioritizeEarlySlots": boolean,
  "notes": string[]
}

Правила:
- routeCount: от 1 до 10
- maxOrdersPerRoute: от 1 до 20
- если логист пишет "без срочных" или "срочные не трогай" → excludeDeliveryTypes = ["express-delivery"]
- если логист пишет "по районам", "компактно", "рядом" → optimizationMode = "geo"
- если логист пишет "минимум стоимости", "дешевле", "минимум маршрутов" → optimizationMode = "cost"
- иначе optimizationMode = "sla"
- если логист пишет "ранние слоты", "утренние", "сначала ранние" → prioritizeEarlySlots = true
- если routeCount не указан → выбери разумное количество маршрутов, опираясь на число заказов и доступных курьеров
- если maxOrdersPerRoute не указан → выбери разумный лимит, опираясь на типы курьеров и их maxOrders
- notes: короткие пояснения, максимум 5 строк

Контекст обязателен к учёту:
- учитывай начало и конец смены курьеров
- не предлагай стратегию, которая конфликтует с ранними слотами и поздним стартом смены
- учитывай тип курьера: walk или car
- учитывай maxOrders у курьера как ограничение ёмкости
- учитывай businessRules
- если доступных курьеров мало, не завышай число маршрутов
- если есть ранние окна доставки, это усиливает выбор режима sla

Ничего не выдумывай сверх запроса логиста и переданного контекста.
    `.trim();

    const completionResponse = await fetch(
      "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          model: "GigaChat-2-Pro",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: JSON.stringify(
                {
                  deliveryDate,
                  prompt,
                  warehouse,
                  couriers: compactCouriers,
                  businessRules,
                  orders: compactOrders,
                },
                null,
                2
              ),
            },
          ],
          n: 1,
          stream: false,
          max_tokens: 512,
          repetition_penalty: 1,
          update_interval: 0,
        }),
        cache: "no-store",
      }
    );

    const completionData = await completionResponse.json();

    if (!completionResponse.ok) {
      throw new Error(
        `Ошибка GigaChat chat/completions: ${JSON.stringify(completionData)}`
      );
    }

    const rawText =
      completionData?.choices?.[0]?.message?.content?.trim?.() || "";

    if (!rawText) {
      return NextResponse.json(
        {
          success: false,
          plan: null,
          error: "GigaChat вернул пустой ответ",
        },
        { status: 502 }
      );
    }

    const cleanText = rawText.replace(/```json|```/gi, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          plan: null,
          error: "GigaChat вернул невалидный JSON",
          raw: cleanText,
        },
        { status: 502 }
      );
    }

    const normalizedPlan = normalizePlan(parsed);

    return NextResponse.json({
      success: true,
      plan: normalizedPlan,
    });
  } catch (error: any) {
    console.error("GigaChat route-ai error:", error);

    return NextResponse.json(
      {
        success: false,
        plan: null,
        error: error?.message || "Ошибка запроса к GigaChat",
      },
      { status: 500 }
    );
  }
}