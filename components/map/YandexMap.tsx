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

type MapStatusConfigItem = {
  rawStatus: string;
  internalStage?: string;
  label?: string;
  color?: string;
  iconUrl?: string;
  isVisible?: boolean;
};

type MapDeliveryZone = {
  id: string;
  name: string;
  color: string;
  polygonJson: string;
  price?: string | null;
  priority?: number;
  isActive?: boolean;
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
  mapStatusConfig?: MapStatusConfigItem[];
  deliveryZones?: MapDeliveryZone[];

  drawMode?: boolean;
  draftPolygonPoints?: [number, number][];
  onMapClickPoint?: (point: [number, number]) => void;
  onDraftPointDrag?: (index: number, point: [number, number]) => void;
};

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

function parseZonePolygon(polygonJson: string): [number, number][] | null {
  try {
    const parsed = JSON.parse(polygonJson);

    if (!Array.isArray(parsed) || parsed.length < 3) {
      return null;
    }

    const points = parsed.filter(
      (point): point is [number, number] =>
        Array.isArray(point) &&
        point.length === 2 &&
        typeof point[0] === "number" &&
        Number.isFinite(point[0]) &&
        typeof point[1] === "number" &&
        Number.isFinite(point[1])
    );

    if (points.length < 3) {
      return null;
    }

    return points;
  } catch {
    return null;
  }
}

function getDraftPointSvg(index: number) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="10" fill="#2563eb" stroke="white" stroke-width="3" />
      <text x="14" y="18" text-anchor="middle" font-size="10" font-weight="700" fill="white">${index + 1}</text>
    </svg>
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
  mapStatusConfig = [],
  deliveryZones = [],
  drawMode = false,
  draftPolygonPoints = [],
  onMapClickPoint,
  onDraftPointDrag,
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapClickHandlerRef = useRef<((e: any) => void) | null>(null);

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

  const deliveryZonesKey = useMemo(() => {
    return JSON.stringify(
      deliveryZones.map((zone) => ({
        id: zone.id,
        color: zone.color,
        polygonJson: zone.polygonJson,
        isActive: zone.isActive,
      }))
    );
  }, [deliveryZones]);

  const draftPolygonKey = useMemo(() => {
    return JSON.stringify(draftPolygonPoints);
  }, [draftPolygonPoints]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Не найден API key Яндекс Карт");
      return;
    }

    const renderMap = () => {
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

        if (mapClickHandlerRef.current) {
          map.events.remove("click", mapClickHandlerRef.current);
          mapClickHandlerRef.current = null;
        }

        if (drawMode && onMapClickPoint) {
          const clickHandler = (e: any) => {
            const coords = e.get("coords");

            if (
              Array.isArray(coords) &&
              coords.length === 2 &&
              typeof coords[0] === "number" &&
              typeof coords[1] === "number"
            ) {
              onMapClickPoint([coords[0], coords[1]]);
            }
          };

          map.events.add("click", clickHandler);
          mapClickHandlerRef.current = clickHandler;
        }

        map.geoObjects.removeAll();

        const allBoundsPoints: [number, number][] = [];
        const coordinateMap = new Map<string, number>();

        if (warehouse) {
          const warehouseKey = `${warehouse.coordinates[0].toFixed(5)}_${warehouse.coordinates[1].toFixed(5)}`;
          coordinateMap.set(warehouseKey, 1);
          allBoundsPoints.push(warehouse.coordinates);
        }

        deliveryZones.forEach((zone) => {
          if (zone.isActive === false) {
            return;
          }

          const polygonPoints = parseZonePolygon(zone.polygonJson);

          if (!polygonPoints) {
            return;
          }

          polygonPoints.forEach((point) => {
            allBoundsPoints.push(point);
          });

          const polygon = new ymaps.Polygon(
            [polygonPoints],
            {
              balloonContent: `
                <div style="max-width: 260px; line-height: 1.45; font-size: 14px;">
                  <div style="font-weight: 700; margin-bottom: 6px;">
                    ${zone.name}
                  </div>
                  <div style="margin-bottom: 4px;">
                    <span style="color:#666;">Стоимость:</span> ${zone.price ?? "Не задана"}
                  </div>
                  <div>
                    <span style="color:#666;">Приоритет:</span> ${zone.priority ?? "Не задан"}
                  </div>
                </div>
              `,
              hintContent: zone.name,
            },
            {
              fillColor: `${zone.color}33`,
              strokeColor: zone.color || "#2563eb",
              strokeWidth: 3,
              strokeOpacity: 0.9,
            }
          );

          map.geoObjects.add(polygon);
        });

        if (draftPolygonPoints.length > 0) {
          draftPolygonPoints.forEach((point, index) => {
            allBoundsPoints.push(point);

            const draftPointPlacemark = new ymaps.Placemark(
              point,
              {
                hintContent: `Точка ${index + 1}`,
              },
              {
                iconLayout: "default#image",
                iconImageHref: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                  getDraftPointSvg(index)
                )}`,
                iconImageSize: [28, 28],
                iconImageOffset: [-14, -14],
                draggable: Boolean(onDraftPointDrag),
              }
            );

            if (onDraftPointDrag) {
              draftPointPlacemark.events.add("dragend", () => {
                const coords = draftPointPlacemark.geometry.getCoordinates();

                if (
                  Array.isArray(coords) &&
                  coords.length === 2 &&
                  typeof coords[0] === "number" &&
                  typeof coords[1] === "number"
                ) {
                  onDraftPointDrag(index, [coords[0], coords[1]]);
                }
              });
            }

            map.geoObjects.add(draftPointPlacemark);
          });

          if (draftPolygonPoints.length >= 2) {
            const draftLine = new ymaps.Polyline(draftPolygonPoints, {}, {
              strokeColor: "#2563eb",
              strokeWidth: 3,
              strokeOpacity: 0.85,
            });

            map.geoObjects.add(draftLine);
          }

          if (draftPolygonPoints.length >= 3) {
            const draftPolygon = new ymaps.Polygon(
              [draftPolygonPoints],
              {
                hintContent: "Черновик полигона",
              },
              {
                fillColor: "#2563eb22",
                strokeColor: "#2563eb",
                strokeWidth: 3,
                strokeOpacity: 0.95,
              }
            );

            map.geoObjects.add(draftPolygon);
          }
        }

        orders.forEach((order) => {
          const isSelected = selectedOrderIds.includes(order.id);

          const key = `${order.coordinates[0].toFixed(5)}_${order.coordinates[1].toFixed(5)}`;
          const count = coordinateMap.get(key) || 0;
          coordinateMap.set(key, count + 1);

          const offset = count * 0.00015;

          const adjustedCoordinates: [number, number] = [
            order.coordinates[0] + offset,
            order.coordinates[1] + offset,
          ];

          allBoundsPoints.push(adjustedCoordinates);

          const matchedStatusConfig = mapStatusConfig.find(
            (item) => item.rawStatus === order.status
          );

          const customIconUrl = matchedStatusConfig?.iconUrl?.trim() || "";

          const placemark = new ymaps.Placemark(
            adjustedCoordinates,
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
              hintContent: `${order.title} — ${getStatusLabel(order.status)}${order.deliveryFrom && order.deliveryTo
                  ? ` — ${order.deliveryFrom} — ${order.deliveryTo}`
                  : ""
                }`,
            },
            customIconUrl
              ? {
                iconLayout: "default#image",
                iconImageHref: customIconUrl,
                iconImageSize: isSelected ? [44, 44] : [40, 40],
                iconImageOffset: isSelected ? [-22, -22] : [-20, -20],
              }
              : {
                preset: isSelected ? "islands#greenDotIcon" : "islands#blueDotIcon",
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
                        <span style="color:#666;">Адрес:</span> ${order.textAddress || "не указан"}
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

        if (
          routeGroups.length === 0 &&
          routeOrders.length === 0 &&
          orders.length === 0 &&
          allBoundsPoints.length > 0
        ) {
          map.setBounds(ymaps.util.bounds.fromPoints(allBoundsPoints), {
            checkZoomRange: true,
            zoomMargin: 40,
          });
        }
      });
    };

    const existingScript = document.querySelector(
      'script[data-yandex-maps="true"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      renderMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.dataset.yandexMaps = "true";
    script.onload = renderMap;

    document.body.appendChild(script);
    }, [
    ordersKey,
    routeOrdersKey,
    routeGroupsKey,
    deliveryZonesKey,
    draftPolygonKey,
    activeRouteGroupId,
    orders,
    routeOrders,
    routeGroups,
    deliveryZones,
    draftPolygonPoints,
    drawMode,
    selectedOrderIds,
    warehouse,
    returnToWarehouse,
    onOrderCtrlClick,
    onMapClickPoint,
    onDraftPointDrag,
    mapStatusConfig,
  ]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "320px",
        cursor: drawMode ? "crosshair" : "default",
      }}
    />
  );
}