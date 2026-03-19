"use client";

import { useEffect, useMemo, useRef } from "react";

type OrderStatus =
  | "new"
  | "manager-processing"
  | "need-contract"
  | "call-later"
  | "no-product"
  | "send-to-cashboard"
  | "client-confirmed"
  | "special-confirmation"
  | "send-to-assembling"
  | "assembling-complete"
  | "delivering"
  | "delivered"
  | "returned-to-zero"
  | "courier-assigned"
  | "complete"
  | "complete-electro-certificate"
  | "cancel-client"
  | "cancel-operator"
  | "doubling"
  | "test"
  | string;

type MapOrder = {
  id: number;
  title: string;
  status: OrderStatus;
  textAddress?: string | null;
  coordinates: [number, number];
  deliveryFrom?: string;
  deliveryTo?: string;
  courierName?: string | null;
  deliveryTypeCode?: string;
};

type MapRouteGroup = {
  id: string;
  name: string;
  color: string;
  orders: MapOrder[];
};


type YandexMapProps = {
  orders: MapOrder[];
  routeOrders?: MapOrder[];
  routeGroups?: MapRouteGroup[];
  activeRouteGroupId?: string | "all";
  selectedOrderIds?: number[];
  warehouse?: {
    name: string;
    coordinates: [number, number];
  };
  returnToWarehouse?: boolean;
  onOrderCtrlClick?: (orderId: number) => void;
};

function getStatusColor(status: string) {
  switch (status) {
    case "client-confirmed":
      return "red";
    case "special-confirmation":
      return "red";
    case "need-contract":
      return "orange";
    case "send-to-assembling":
      return "orange";
    case "assembling-complete":
      return "gray";
    case "courier-assigned":
      return "blue";
    case "delivering":
      return "blue";
    case "complete":
      return "green";
    default:
      return "gray";
  }
}

function getStatusIconSvg(
  status: string,
  isSelected: boolean,
  deliveryTypeCode?: string
) {
  const selectedStroke = isSelected ? "#22c55e" : "transparent";
  const selectedStrokeWidth = isSelected ? 3 : 0;

  if (deliveryTypeCode === "express-delivery") {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      ${isSelected
        ? `<rect
              x="5"
              y="5"
              width="30"
              height="30"
              rx="10"
              fill="none"
              stroke="#22c55e"
              stroke-width="3"
            />`
        : ""
      }
      <rect
        x="8"
        y="8"
        width="24"
        height="24"
        rx="8"
        fill="#c81e1e"
        stroke="white"
        stroke-width="2.5"
      />
      <rect x="18.4" y="13" width="3.2" height="10" rx="1.6" fill="white"/>
      <circle cx="20" cy="27" r="2" fill="white"/>
    </svg>
  `;
  }

  switch (status) {
    // Ожидание оплаты
    case "need-contract":
      return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <filter id="needContractShadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.18"/>
        </filter>
      </defs>

      ${isSelected
          ? `<rect
              x="4"
              y="4"
              width="32"
              height="32"
              rx="10"
              fill="none"
              stroke="#22c55e"
              stroke-width="3"
            />`
          : ""
        }

      <g filter="url(#needContractShadow)">
        <rect
          x="6"
          y="6"
          width="28"
          height="28"
          rx="9"
          fill="#f0a51f"
          stroke="white"
          stroke-width="2.8"
        />
      </g>

      <rect x="12" y="14" width="16" height="10.5" rx="1.8" fill="white"/>
      <circle cx="20" cy="19.25" r="2.3" fill="#f0a51f"/>
      <circle cx="14.8" cy="16.6" r="0.9" fill="#f0a51f"/>
      <circle cx="25.2" cy="16.6" r="0.9" fill="#f0a51f"/>
      <circle cx="14.8" cy="21.9" r="0.9" fill="#f0a51f"/>
      <circle cx="25.2" cy="21.9" r="0.9" fill="#f0a51f"/>
      <path
        d="M11.2 26.8h10"
        stroke="white"
        stroke-width="2.4"
        stroke-linecap="round"
      />
    </svg>
  `;

    // Согласовано с клиентом
    case "client-confirmed":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#f59e0b" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <circle cx="20" cy="20" r="8" fill="none" stroke="white" stroke-width="2.5"/>
          <path d="M20 20V15" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M20 20L24 22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      `;

    // Специальное согласование
    case "special-confirmation":
      return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <filter id="specialConfirmationShadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.18"/>
        </filter>
      </defs>

      ${isSelected
          ? `<rect
              x="4"
              y="4"
              width="32"
              height="32"
              rx="10"
              fill="none"
              stroke="#22c55e"
              stroke-width="3"
            />`
          : ""
        }

      <g filter="url(#specialConfirmationShadow)">
        <rect
          x="6"
          y="6"
          width="28"
          height="28"
          rx="9"
          fill="#f08a24"
          stroke="white"
          stroke-width="2.8"
        />
      </g>

      <circle
        cx="20"
        cy="20"
        r="7.2"
        fill="none"
        stroke="white"
        stroke-width="2.4"
        stroke-dasharray="2.2 2.2"
      />
      <path
        d="M20 20v-4.2"
        stroke="white"
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <path
        d="M20 20l3.1 2.5"
        stroke="white"
        stroke-width="2.4"
        stroke-linecap="round"
      />
    </svg>
  `;

    // Передано в комплектацию
    case "send-to-assembling":
      return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <filter id="sendToAssemblingShadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.18"/>
        </filter>
      </defs>

      ${isSelected
          ? `<rect
              x="4"
              y="4"
              width="32"
              height="32"
              rx="10"
              fill="none"
              stroke="#22c55e"
              stroke-width="3"
            />`
          : ""
        }

      <g filter="url(#sendToAssemblingShadow)">
        <rect
          x="6"
          y="6"
          width="28"
          height="28"
          rx="9"
          fill="#8b5cf6"
          stroke="white"
          stroke-width="2.8"
        />
      </g>

      <path
        d="M14.2 15.2v10.2h6.2"
        stroke="white"
        stroke-width="2.3"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <path
        d="M14.2 15.2h11.1v6"
        stroke="white"
        stroke-width="2.3"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <rect
        x="17.4"
        y="12.3"
        width="4.8"
        height="3"
        rx="0.9"
        fill="white"
      />
      <path
        d="M21.5 22.1l2.1 2.2 4.3-4.6"
        stroke="white"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
    </svg>
  `;

    // Укомплектован
    case "assembling-complete":
      return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <filter id="assemblingCompleteShadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.18"/>
        </filter>
      </defs>

      ${isSelected
          ? `<rect
              x="4"
              y="4"
              width="32"
              height="32"
              rx="10"
              fill="none"
              stroke="#22c55e"
              stroke-width="3"
            />`
          : ""
        }

      <g filter="url(#assemblingCompleteShadow)">
        <rect
          x="6"
          y="6"
          width="28"
          height="28"
          rx="9"
          fill="#1d4ed8"
          stroke="white"
          stroke-width="2.8"
        />
      </g>

      <rect x="12" y="12.5" width="16" height="15" rx="2.2" fill="white"/>
      <rect x="13.8" y="15" width="12.4" height="3.2" rx="0.9" fill="#1d4ed8"/>
      <rect x="17" y="21.2" width="6" height="2.2" rx="0.8" fill="#1d4ed8"/>
    </svg>
  `;

    // Курьер назначен
    case "courier-assigned":
      return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <filter id="courierAssignedShadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.18"/>
        </filter>
      </defs>

      ${isSelected
          ? `<rect
              x="4"
              y="4"
              width="32"
              height="32"
              rx="10"
              fill="none"
              stroke="#22c55e"
              stroke-width="3"
            />`
          : ""
        }

      <g filter="url(#courierAssignedShadow)">
        <rect
          x="6"
          y="6"
          width="28"
          height="28"
          rx="9"
          fill="#60a5fa"
          stroke="white"
          stroke-width="2.8"
        />
      </g>

      <circle cx="22.4" cy="15.2" r="3.1" fill="none" stroke="white" stroke-width="2"/>
      <path
        d="M19.5 25.8v-5.3c0-1.9 1.3-3.4 3.1-3.4s3.1 1.5 3.1 3.4v5.3"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M18.5 19.8l4 3.2 4-3.2"
        fill="none"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <rect
        x="10.2"
        y="18.2"
        width="6.2"
        height="7.8"
        rx="1.1"
        fill="none"
        stroke="white"
        stroke-width="2"
      />
      <path
        d="M10.2 20.4h6.2"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M12.9 22.1v2.3"
        stroke="white"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
  `;

    // Доставляется
    case "delivering":
      return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <filter id="deliveringShadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000000" flood-opacity="0.18"/>
        </filter>
      </defs>

      ${isSelected
          ? `<rect
              x="4"
              y="4"
              width="32"
              height="32"
              rx="10"
              fill="none"
              stroke="#22c55e"
              stroke-width="3"
            />`
          : ""
        }

      <g filter="url(#deliveringShadow)">
        <rect
          x="6"
          y="6"
          width="28"
          height="28"
          rx="9"
          fill="#2563eb"
          stroke="white"
          stroke-width="2.8"
        />
      </g>

      <rect x="11.8" y="16.2" width="9.2" height="6.2" rx="1.1" fill="white"/>
      <path d="M21 16.2h4.3l3 3.1v3.1H21z" fill="white"/>
      <circle cx="15.2" cy="24.8" r="1.7" fill="#2563eb"/>
      <circle cx="24.8" cy="24.8" r="1.7" fill="#2563eb"/>
      <circle cx="15.2" cy="24.8" r="1" fill="white"/>
      <circle cx="24.8" cy="24.8" r="1" fill="white"/>
    </svg>
  `;

    // Выполнен
    case "complete":
      return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      ${isSelected
          ? `<rect
              x="5"
              y="5"
              width="30"
              height="30"
              rx="10"
              fill="none"
              stroke="#22c55e"
              stroke-width="3"
            />`
          : ""
        }
      <rect
        x="8"
        y="8"
        width="24"
        height="24"
        rx="8"
        fill="#2bbf8a"
        stroke="white"
        stroke-width="2.5"
      />
      <path
        d="M14.5 20.5l4.2 4.2 7.8-8.2"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
    </svg>
  `;

    // Выполнен: электронный сертификат
    case "complete-electro-certificate":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#059669" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <path d="M13 20l4 4 10-10" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M26 11l-2 4h3l-3 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      `;

    default:
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#6b7280" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <circle cx="20" cy="20" r="4" fill="white"/>
        </svg>
      `;

    // Новый
    case "new":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#f59e0b" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <path d="M20 13v14" stroke="white" stroke-width="3" stroke-linecap="round"/>
          <path d="M13 20h14" stroke="white" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `;

    // В работе
    case "manager-processing":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#6b7280" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <circle cx="20" cy="20" r="5" fill="none" stroke="white" stroke-width="2.4"/>
          <path d="M20 10v4M20 26v4M10 20h4M26 20h4M13 13l3 3M24 24l3 3M27 13l-3 3M13 27l3-3"
            stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;

    // Нет в наличии
    case "no-product":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#dc2626" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <rect x="11" y="13" width="12" height="10" rx="1.5" fill="white"/>
          <path d="M12 28l16-16" stroke="white" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `;

    // Перезвонить
    case "call-later":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#f97316" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <path d="M15 14c1 4 6 9 10 10" stroke="white" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M14 17l3-3M23 26l3-3" stroke="white" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="25" cy="15" r="4" fill="none" stroke="white" stroke-width="2"/>
          <path d="M25 15v-2M25 15l2 1" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;

    // Возврат с маршрута
    case "returned-to-zero":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#e11d48" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <path d="M26 20H14" stroke="white" stroke-width="2.8" stroke-linecap="round"/>
          <path d="M18 15l-5 5 5 5" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      `;

    // Отказ клиента
    case "cancel-client":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#ef4444" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <path d="M14 14l12 12M26 14L14 26" stroke="white" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `;

    // Отменён оператором
    case "cancel-operator":
      return `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#b91c1c" stroke="${selectedStroke}" stroke-width="${selectedStrokeWidth}" />
          <path d="M14 14l12 12M26 14L14 26" stroke="white" stroke-width="3.2" stroke-linecap="round"/>
          <circle cx="20" cy="20" r="10" fill="none" stroke="white" stroke-width="1.5" opacity="0.7"/>
        </svg>
      `;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "new":
      return "Новый";
    case "manager-processing":
      return "В работе";
    case "need-contract":
      return "Ожидание оплаты";
    case "call-later":
      return "Перезвонить";
    case "no-product":
      return "Нет в наличии";
    case "send-to-cashboard":
      return "Передано на кассу";
    case "client-confirmed":
      return "Согласовано с клиентом";
    case "special-confirmation":
      return "Специальное согласование";
    case "send-to-assembling":
      return "Передано в комплектацию";
    case "assembling-complete":
      return "Укомплектован";
    case "delivering":
      return "Доставляется";
    case "delivered":
      return "Доставлен";
    case "returned-to-zero":
      return "Возврат с маршрута";
    case "courier-assigned":
      return "Курьер назначен";
    case "complete":
      return "Выполнен";
    case "complete-electro-certificate":
      return "Выполнен: электронный сертификат";
    case "cancel-client":
      return "Отказ от заказа";
    case "cancel-operator":
      return "Отменен";
    case "doubling":
      return "Дублирующий";
    case "test":
      return "Тестовый";
    default:
      return status;
  }
}

function getRouteStopBadge(color: string, index: number) {
  return `
    <div style="
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: ${color};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(15,23,42,0.18);
      box-sizing: border-box;
    ">
      ${index + 1}
    </div>
  `;
}

export default function YandexMap({
  orders,
  routeOrders = [],
  routeGroups = [],
  activeRouteGroupId = "all",
  selectedOrderIds = [],
  warehouse,
  returnToWarehouse = false,
  onOrderCtrlClick,
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  const ordersKey = useMemo(() => {
    return JSON.stringify(
      orders.map((order) => ({
        id: order.id,
        status: order.status,
        coordinates: order.coordinates,
      }))
    );
  }, [orders]);

  const routeOrdersKey = useMemo(() => {
    return JSON.stringify(
      routeOrders.map((order) => ({
        id: order.id,
        coordinates: order.coordinates,
      }))
    );
  }, [routeOrders]);

  const routeGroupsKey = useMemo(() => {
    return JSON.stringify(
      routeGroups.map((group) => ({
        id: group.id,
        color: group.color,
        orders: group.orders.map((order) => ({
          id: order.id,
          coordinates: order.coordinates,
        })),
      }))
    );
  }, [routeGroups]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Не найден API key Яндекс Карт");
      return;
    }

    const renderOrdersOnMap = () => {
      const ymaps = (window as any).ymaps;

      if (!ymaps || !mapRef.current) return;

      ymaps.ready(() => {
        if (!mapRef.current) return;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new ymaps.Map(mapRef.current, {
            center: [55.751244, 37.618423],
            zoom: 10,
            controls: ["zoomControl", "fullscreenControl"],
          });
        }

        const map = mapInstanceRef.current;

        map.geoObjects.removeAll();

        orders.forEach((order) => {
          const isSelected = selectedOrderIds.includes(order.id);
          const placemark = new ymaps.Placemark(
            order.coordinates,
            {
              balloonContent: `
  <div style="max-width: 320px; line-height: 1.45; font-size: 14px;">
    <div style="font-weight: 700; margin-bottom: 6px;">
      ${order.title}
    </div>

    <div style="margin-bottom: 4px;">
      <span style="color:#666;">Статус:</span> ${getStatusLabel(order.status)}
    </div>

    ${order.courierName
                  ? `
    <div style="margin-bottom: 4px;">
      <span style="color:#666;">Курьер:</span> ${order.courierName
                    .split("|")[0]
                    .trim()}
    </div>
    `
                  : ""
                }

    <div style="margin-bottom: 4px;">
      <span style="color:#666;">Слот:</span> <strong>${order.deliveryFrom && order.deliveryTo
                  ? `${order.deliveryFrom} — ${order.deliveryTo}`
                  : "не указан"
                }</strong>
    </div>

    <div>
      <span style="color:#666;">Адрес:</span> ${order.textAddress || "не указан"}
    </div>
  </div>
`,

              hintContent: `${order.title
                } — ${getStatusLabel(order.status)}${order.deliveryFrom && order.deliveryTo
                  ? ` — ${order.deliveryFrom} — ${order.deliveryTo}`
                  : ""
                }`,
            },
            {
              iconLayout: "default#image",
              iconImageHref: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                getStatusIconSvg(order.status, isSelected, order.deliveryTypeCode)
              )}`,
              iconImageSize: isSelected ? [40, 40] : [36, 36],
              iconImageOffset: isSelected ? [-20, -20] : [-18, -18],
            }
          );

          placemark.events.add("click", (e: any) => {
            const originalEvent = e.get("domEvent")?.originalEvent;

            if (originalEvent?.ctrlKey && onOrderCtrlClick) {
              onOrderCtrlClick(order.id);
              e.preventDefault();
            }
          });

          map.geoObjects.add(placemark);
        });

        if (warehouse) {
          const warehouseSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
      <circle cx="21" cy="21" r="18" fill="#111827"/>
      <path d="M13 21.5L21 14l8 7.5" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 20.5V28h10v-7.5" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="19" y="23" width="4" height="5" fill="white" rx="0.8"/>
    </svg>
  `;

          const warehousePlacemark = new ymaps.Placemark(
            warehouse.coordinates,
            {
              balloonContent: `
        <div style="max-width: 240px; line-height: 1.4; font-size: 14px;">
          <div style="font-weight: 700; margin-bottom: 6px;">
            ${warehouse.name}
          </div>
          <div>Точка старта маршрута</div>
        </div>
      `,
              hintContent: warehouse.name,
            },
            {
              iconLayout: "default#image",
              iconImageHref: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(warehouseSvg)}`,
              iconImageSize: [42, 42],
              iconImageOffset: [-21, -21],
            }
          );

          map.geoObjects.add(warehousePlacemark);
        }
        if (routeGroups.length > 0) {
          const routeBounds: [number, number][] = [];

          routeGroups.forEach((group) => {
            if (group.orders.length === 0) return;

            const isActive =
              activeRouteGroupId === "all" || activeRouteGroupId === group.id;

            const isDimmed =
              activeRouteGroupId !== "all" && activeRouteGroupId !== group.id;

            const points = [
              ...(warehouse ? [warehouse.coordinates] : []),
              ...group.orders.map((order) => order.coordinates),
            ];

            group.orders.forEach((order, index) => {
              const stopPlacemark = new ymaps.Placemark(
                order.coordinates,
                {
                  iconContent: getRouteStopBadge(group.color, index),
                  hintContent: `${group.name} · ${order.title}`,
                  balloonContent: `
                    <div style="max-width: 280px; line-height: 1.45; font-size: 14px;">
                      <div style="font-weight: 700; margin-bottom: 6px;">
                        ${group.name} · ${order.title}
                      </div>
                      <div style="margin-bottom: 4px;">
                        <span style="color:#666;">Стоп:</span> ${index + 1}
                      </div>
                      <div style="margin-bottom: 4px;">
                        <span style="color:#666;">Слот:</span>
                        ${order.deliveryFrom && order.deliveryTo
                      ? `${order.deliveryFrom} — ${order.deliveryTo}`
                      : "не указан"
                    }
                      </div>
                      <div>
                        <span style="color:#666;">Адрес:</span> ${order.textAddress || "не указан"
                    }
                      </div>
                    </div>
                  `,
                },
                {
                  iconLayout: "default#imageWithContent",
                  iconImageHref:
                    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
                  iconImageSize: [1, 1],
                  iconImageOffset: [0, 0],
                  iconContentOffset: [-13, -13],
                  iconOpacity: isDimmed ? 0.35 : 1,
                }
              );

              map.geoObjects.add(stopPlacemark);
              routeBounds.push(order.coordinates);
            });

            if (points.length >= 2) {
              const multiRoute = new ymaps.multiRouter.MultiRoute(
                {
                  referencePoints: points,
                  params: {
                    routingMode: "auto",
                  },
                },
                {
                  boundsAutoApply: false,
                  wayPointVisible: false,
                  viaPointVisible: false,
                  routeActiveStrokeColor: group.color,
                  routeStrokeColor: group.color,
                  routeActiveStrokeWidth: isActive && !isDimmed ? 5 : 4,
                  routeStrokeWidth: isActive && !isDimmed ? 5 : 4,
                  routeActiveStrokeOpacity: isDimmed ? 0.2 : 0.9,
                  routeStrokeOpacity: isDimmed ? 0.2 : 0.75,
                  pinVisible: false,
                }
              );

              map.geoObjects.add(multiRoute);
            }
          });

          if (routeBounds.length > 0) {
            map.setBounds(ymaps.util.bounds.fromPoints(routeBounds), {
              checkZoomRange: true,
              zoomMargin: [120, 420, 40, 80],
            });
          }
        }
        if (routeGroups.length === 0 && routeOrders.length <= 1 && orders.length > 0) {
          const bounds = map.geoObjects.getBounds();

          if (bounds) {
            map.setBounds(bounds, {
              checkZoomRange: true,
              zoomMargin: 40,
            });
          }
        }
        if (routeGroups.length === 0) {
          routeOrders.forEach((order, index) => {
            const routeNumberPlacemark = new ymaps.Placemark(
              order.coordinates,
              {
                iconContent: String(index + 1),
              },
              {
                preset: "islands#blueStretchyIcon",
                iconColor: "#111827",
              }
            );

            map.geoObjects.add(routeNumberPlacemark);
          });

          if (routeOrders.length > 0) {
            const points = [
              ...(warehouse ? [warehouse.coordinates] : []),
              ...routeOrders.map((order) => order.coordinates),
              ...(warehouse && returnToWarehouse ? [warehouse.coordinates] : []),
            ];

            ymaps
              .route(points, {
                routingMode: "auto",
                mapStateAutoApply: false,
              })
              .then((route: any) => {
                route.getPaths().options.set({
                  strokeColor: "#8e44ad",
                  strokeWidth: 4,
                  strokeOpacity: 0.8,
                });

                route.getWayPoints().options.set({
                  visible: false,
                });

                route.getViaPoints().options.set({
                  visible: false,
                });

                map.geoObjects.add(route);

                const bounds = map.geoObjects.getBounds();

                if (bounds) {
                  map.setBounds(bounds, {
                    checkZoomRange: true,
                    zoomMargin: 40,
                  });
                }
              })
              .catch((error: any) => {
                console.error("Ошибка построения маршрута:", error);
              });
          }
        }
      });
    };

    const existingScript = document.querySelector(
      'script[data-yandex-maps="true"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      renderOrdersOnMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.dataset.yandexMaps = "true";
    script.onload = renderOrdersOnMap;

    document.body.appendChild(script);
  }, [
    ordersKey,
    routeOrdersKey,
    routeGroupsKey,
    activeRouteGroupId,
    orders,
    routeOrders,
    routeGroups,
  ]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "320px",
      }}
    />
  );
}