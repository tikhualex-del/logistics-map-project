"use client";

import { useEffect, useMemo, useState } from "react";
import YandexMap from "../../components/map/YandexMap";

type RouteOrder = {
  id: number;
  title: string;
  status: string;
  textAddress?: string | null;
  coordinates: [number, number];
  deliveryFrom?: string;
  deliveryTo?: string;
  courierName?: string | null;
};

type RouteItem = {
  id: string;
  name: string;
  color: string;
  courierName: string;
  status: "draft" | "active" | "completed";
  orders: RouteOrder[];
};

type RouteTab = "active" | "draft" | "completed";

const WAREHOUSE = {
  name: "Склад",
  coordinates: [55.816252, 37.503909] as [number, number],
};

const MOCK_ROUTES: RouteItem[] = [
  {
    id: "route-1",
    name: "Маршрут #1",
    color: "#2563eb",
    courierName: "Иван Петров",
    status: "active",
    orders: [
      {
        id: 101,
        title: "Заказ #423023",
        status: "courier-assigned",
        textAddress: "Москва, ул. Артековская, д. 9, корп. 1",
        coordinates: [55.8567, 37.5778],
        deliveryFrom: "10:00",
        deliveryTo: "14:00",
        courierName: "Иван Петров",
      },
      {
        id: 102,
        title: "Заказ #423022",
        status: "assembling-complete",
        textAddress: "Москва, ул. Петрозаводская, д. 24, корп. 2",
        coordinates: [55.8688, 37.5005],
        deliveryFrom: "18:00",
        deliveryTo: "22:00",
        courierName: "Иван Петров",
      },
      {
        id: 103,
        title: "Заказ #423021",
        status: "special-confirmation",
        textAddress: "Москва, пр-д 1-й Красногвардейский, д. 22",
        coordinates: [55.7498, 37.5373],
        deliveryFrom: "16:00",
        deliveryTo: "20:00",
        courierName: "Иван Петров",
      },
    ],
  },
  {
    id: "route-2",
    name: "Маршрут #2",
    color: "#16a34a",
    courierName: "Алексей Смирнов",
    status: "draft",
    orders: [
      {
        id: 201,
        title: "Заказ #423101",
        status: "client-confirmed",
        textAddress: "Москва, Кутузовский проспект, д. 31",
        coordinates: [55.7411, 37.5227],
        deliveryFrom: "12:00",
        deliveryTo: "15:00",
        courierName: "Алексей Смирнов",
      },
      {
        id: 202,
        title: "Заказ #423102",
        status: "courier-assigned",
        textAddress: "Москва, Мичуринский проспект, д. 12",
        coordinates: [55.7002, 37.5056],
        deliveryFrom: "15:30",
        deliveryTo: "18:30",
        courierName: "Алексей Смирнов",
      },
    ],
  },
  {
    id: "route-3",
    name: "Маршрут #3",
    color: "#f59e0b",
    courierName: "Дмитрий Ковалёв",
    status: "completed",
    orders: [
      {
        id: 301,
        title: "Заказ #423201",
        status: "complete",
        textAddress: "Москва, Волгоградский проспект, д. 45",
        coordinates: [55.7203, 37.7275],
        deliveryFrom: "09:00",
        deliveryTo: "12:00",
        courierName: "Дмитрий Ковалёв",
      },
      {
        id: 302,
        title: "Заказ #423202",
        status: "complete",
        textAddress: "Москва, ул. Люблинская, д. 88",
        coordinates: [55.6761, 37.7391],
        deliveryFrom: "12:30",
        deliveryTo: "15:30",
        courierName: "Дмитрий Ковалёв",
      },
    ],
  },
];

function getDistanceKm(from: [number, number], to: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const lat1 = from[0];
  const lon1 = from[1];
  const lat2 = to[0];
  const lon2 = to[1];

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getRouteDistance(route: RouteItem, warehouse: [number, number]) {
  if (route.orders.length === 0) return 0;

  let total = 0;
  let currentPoint = warehouse;

  route.orders.forEach((order) => {
    total += getDistanceKm(currentPoint, order.coordinates);
    currentPoint = order.coordinates;
  });

  return Math.round(total);
}

function getRouteEta(route: RouteItem, warehouse: [number, number]) {
  const distanceKm = getRouteDistance(route, warehouse);
  const totalMinutes = Math.round(distanceKm * 1.8 + route.orders.length * 12);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}ч ${String(minutes).padStart(2, "0")}м`;
}

function getRouteStatusLabel(status: RouteItem["status"]) {
  switch (status) {
    case "active":
      return "Активный";
    case "draft":
      return "Черновик";
    case "completed":
      return "Завершён";
    default:
      return status;
  }
}

export default function RoutesPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string | "all">("all");
  const [activeTab, setActiveTab] = useState<RouteTab>("active");

  const filteredRoutes = useMemo(() => {
    return MOCK_ROUTES.filter((route) => route.status === activeTab);
  }, [activeTab]);

  const selectedRoute = useMemo(() => {
    if (selectedRouteId === "all") return null;
    return filteredRoutes.find((route) => route.id === selectedRouteId) || null;
  }, [selectedRouteId, filteredRoutes]);

  useEffect(() => {
    if (
      selectedRouteId !== "all" &&
      !filteredRoutes.some((route) => route.id === selectedRouteId)
    ) {
      setSelectedRouteId("all");
    }
  }, [filteredRoutes, selectedRouteId]);

  const totalRoutes = filteredRoutes.length;

  const totalStops = filteredRoutes.reduce(
    (sum, route) => sum + route.orders.length,
    0
  );

  const selectedStops = selectedRoute ? selectedRoute.orders.length : totalStops;

  const selectedDistance = selectedRoute
    ? getRouteDistance(selectedRoute, WAREHOUSE.coordinates)
    : filteredRoutes.reduce(
        (sum, route) => sum + getRouteDistance(route, WAREHOUSE.coordinates),
        0
      );

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        padding: 0,
        margin: 0,
        overflow: "hidden",
        position: "relative",
        background:
          "linear-gradient(135deg, rgba(246,185,129,0.20) 0%, rgba(201,235,214,0.18) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "72px",
          left: "96px",
          right: "426px",
          zIndex: 50,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.94)",
            border: "1px solid rgba(229,231,235,0.95)",
            borderRadius: "16px",
            boxShadow: "0 10px 24px rgba(15,23,42,0.10)",
            backdropFilter: "blur(10px)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedRouteId("all")}
            style={{
              border:
                selectedRouteId === "all"
                  ? "2px solid #2563eb"
                  : "1px solid #dbe3f0",
              background: selectedRouteId === "all" ? "#eff6ff" : "#ffffff",
              color: selectedRouteId === "all" ? "#1d4ed8" : "#374151",
              borderRadius: "999px",
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Все маршруты
          </button>

          {filteredRoutes.map((route) => {
            const isActive = selectedRouteId === route.id;

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRouteId(route.id)}
                style={{
                  border: isActive
                    ? `2px solid ${route.color}`
                    : "1px solid #dbe3f0",
                  background: isActive ? "#f8fafc" : "#ffffff",
                  color: "#374151",
                  borderRadius: "999px",
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "999px",
                    background: route.color,
                    display: "inline-block",
                  }}
                />
                <span>{route.name}</span>
              </button>
            );
          })}

          <button
            type="button"
            style={{
              width: "34px",
              minWidth: "34px",
              height: "34px",
              borderRadius: "999px",
              border: "1px dashed #cbd5e1",
              background: "#ffffff",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Добавить маршрут"
          >
            +
          </button>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
        }}
      >
        <YandexMap
          orders={[]}
          routeGroups={filteredRoutes.map((route) => ({
            id: route.id,
            name: route.name,
            color: route.color,
            orders: route.orders,
          }))}
          activeRouteGroupId={selectedRouteId}
          warehouse={WAREHOUSE}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: "84px",
          right: "16px",
          bottom: "16px",
          width: "390px",
          zIndex: 60,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: "100%",
            display: "grid",
            gridTemplateRows: "auto auto minmax(0, 1fr) auto",
            background: "rgba(249,250,251,0.96)",
            borderLeft: "1px solid #e5e7eb",
            boxShadow: "-12px 0 28px rgba(15, 23, 42, 0.06)",
            backdropFilter: "blur(8px)",
            padding: "56px 20px 18px 20px",
            boxSizing: "border-box",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                display: "grid",
                justifyItems: "center",
                width: "100%",
                textAlign: "center",
                gap: "12px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                  lineHeight: 1.1,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Маршруты
              </h2>

              <div
                style={{
                  display: "inline-grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "4px",
                  background: "#f3f4f6",
                  borderRadius: "10px",
                  padding: "4px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("active")}
                  style={{
                    height: "28px",
                    minWidth: "88px",
                    border: "none",
                    borderRadius: "8px",
                    background: activeTab === "active" ? "#ffffff" : "transparent",
                    color: activeTab === "active" ? "#2563eb" : "#4b5563",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  АКТИВНЫЕ
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("draft")}
                  style={{
                    height: "28px",
                    minWidth: "88px",
                    border: "none",
                    borderRadius: "8px",
                    background: activeTab === "draft" ? "#ffffff" : "transparent",
                    color: activeTab === "draft" ? "#2563eb" : "#4b5563",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ЧЕРНОВИКИ
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("completed")}
                  style={{
                    height: "28px",
                    minWidth: "88px",
                    border: "none",
                    borderRadius: "8px",
                    background:
                      activeTab === "completed" ? "#ffffff" : "transparent",
                    color: activeTab === "completed" ? "#2563eb" : "#4b5563",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ЗАВЕРШЁННЫЕ
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #eceff3",
              borderRadius: "14px",
              padding: "12px 8px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
            }}
          >
            <div
              style={{
                textAlign: "center",
                padding: "4px 8px",
                borderRight: "1px solid #eef2f7",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                Всего
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                {totalRoutes}
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "4px 8px",
                borderRight: "1px solid #eef2f7",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                Остановок
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#2563eb" }}>
                {selectedStops}
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "4px 8px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                Дистанция
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                {selectedDistance} км
              </div>
            </div>
          </div>

          <div
            style={{
              minHeight: 0,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              paddingRight: "2px",
            }}
          >
            {filteredRoutes.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #eceff3",
                  borderRadius: "14px",
                  padding: "18px",
                  color: "#6b7280",
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                В этой категории пока нет маршрутов
              </div>
            ) : selectedRouteId === "all" ? (
              filteredRoutes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedRouteId(route.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "#ffffff",
                    border: `1px solid ${route.color}33`,
                    borderLeft: `4px solid ${route.color}`,
                    borderRadius: "14px",
                    padding: "14px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "#111827",
                      }}
                    >
                      {route.name}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: route.color,
                      }}
                    >
                      {getRouteStatusLabel(route.status)}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#4b5563",
                      marginBottom: "8px",
                    }}
                  >
                    Курьер: {route.courierName}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    <span>{route.orders.length} остановок</span>
                    <span>{getRouteDistance(route, WAREHOUSE.coordinates)} км</span>
                    <span>{getRouteEta(route, WAREHOUSE.coordinates)}</span>
                  </div>
                </button>
              ))
            ) : selectedRoute ? (
              <div
                style={{
                  background: "#ffffff",
                  border: `1px solid ${selectedRoute.color}33`,
                  borderLeft: `4px solid ${selectedRoute.color}`,
                  borderRadius: "14px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "#111827",
                        marginBottom: "4px",
                      }}
                    >
                      {selectedRoute.name}
                    </div>
                    <div style={{ fontSize: "13px", color: "#4b5563" }}>
                      Курьер: {selectedRoute.courierName}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: selectedRoute.color,
                    }}
                  >
                    {getRouteStatusLabel(selectedRoute.status)}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>
                      Остановки
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                      {selectedRoute.orders.length}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>
                      ETA
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                      {getRouteEta(selectedRoute, WAREHOUSE.coordinates)}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>
                      Дистанция
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                      {getRouteDistance(selectedRoute, WAREHOUSE.coordinates)} км
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {selectedRoute.orders.map((order, index) => (
                    <div
                      key={order.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "12px",
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            minWidth: "24px",
                            height: "24px",
                            borderRadius: "999px",
                            background: selectedRoute.color,
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                            marginTop: "2px",
                          }}
                        >
                          {index + 1}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#111827",
                              marginBottom: "4px",
                            }}
                          >
                            {order.title}
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              color: "#4b5563",
                              lineHeight: 1.4,
                              marginBottom: "4px",
                            }}
                          >
                            {order.textAddress || "Адрес не указан"}
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            {order.deliveryFrom && order.deliveryTo
                              ? `${order.deliveryFrom} — ${order.deliveryTo}`
                              : "Слот не указан"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ display: "grid", gap: "10px", paddingTop: "4px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
              }}
            >
              <button
                type="button"
                style={{
                  height: "40px",
                  border: "none",
                  borderRadius: "12px",
                  background: "#0f4bb8",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Ручной
              </button>

              <button
                type="button"
                style={{
                  height: "40px",
                  border: "none",
                  borderRadius: "12px",
                  background: "#e5e7eb",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Авто
              </button>

              <button
                type="button"
                style={{
                  height: "40px",
                  border: "none",
                  borderRadius: "12px",
                  background: "#e5e7eb",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Доплан.
              </button>
            </div>

            <button
              type="button"
              style={{
                width: "100%",
                height: "44px",
                border: "none",
                borderRadius: "12px",
                background: "#0f4bb8",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Построить маршрут
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <button
                type="button"
                style={{
                  width: "100%",
                  height: "40px",
                  border: "none",
                  borderRadius: "12px",
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Сохранить
              </button>

              <button
                type="button"
                style={{
                  width: "100%",
                  height: "40px",
                  border: "none",
                  borderRadius: "12px",
                  background: "#e5e7eb",
                  color: "#4b5563",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Очистить
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}