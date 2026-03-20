"use client";

import { useEffect, useState } from "react";

type Warehouse = {
  id: string;
  companyId: string;
  name: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
};

type Integration = {
  id: string;
  companyId: string;
  name: string;
  provider: string;
  baseUrl: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
};

type Order = {
  id: string;
  companyId: string;
  integrationId: string | null;
  warehouseId: string | null;
  externalId: string;
  title: string;
  status: string;
  deliveryType: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  deliveryWindowFrom: string | null;
  deliveryWindowTo: string | null;
  courierExternalId: string | null;
  courierName: string | null;
  rawPayloadJson: string | null;
  createdAt: string;
  updatedAt: string;
  integration: Integration | null;
  warehouse: Warehouse | null;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState("");

  const [orderExternalId, setOrderExternalId] = useState("");
  const [orderTitle, setOrderTitle] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [orderDeliveryType, setOrderDeliveryType] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [orderLatitude, setOrderLatitude] = useState("");
  const [orderLongitude, setOrderLongitude] = useState("");
  const [orderDeliveryWindowFrom, setOrderDeliveryWindowFrom] = useState("");
  const [orderDeliveryWindowTo, setOrderDeliveryWindowTo] = useState("");

  const [orderFormError, setOrderFormError] = useState("");
  const [orderFormSuccess, setOrderFormSuccess] = useState("");
  const [orderCreateLoading, setOrderCreateLoading] = useState(false);

  async function loadOrders() {
    setOrdersLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Не удалось загрузить заказы");
      }

      setOrders(result.data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось загрузить заказы";
      setError(message);
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    setError("");
    loadOrders();
  }, []);

  async function handleCreateOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setOrderFormError("");
    setOrderFormSuccess("");

    if (
      !orderExternalId.trim() ||
      !orderTitle.trim() ||
      !orderStatus.trim() ||
      !orderDeliveryType.trim() ||
      !orderAddress.trim()
    ) {
      setOrderFormError(
        "Заполни externalId, title, status, deliveryType и address"
      );
      return;
    }

    const normalizedLatitude =
      orderLatitude.trim() === "" ? null : Number(orderLatitude.trim());
    const normalizedLongitude =
      orderLongitude.trim() === "" ? null : Number(orderLongitude.trim());

    if (
      (normalizedLatitude !== null && Number.isNaN(normalizedLatitude)) ||
      (normalizedLongitude !== null && Number.isNaN(normalizedLongitude))
    ) {
      setOrderFormError("Latitude и longitude должны быть числами");
      return;
    }

    try {
      setOrderCreateLoading(true);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          externalId: orderExternalId,
          title: orderTitle,
          status: orderStatus,
          deliveryType: orderDeliveryType,
          address: orderAddress,
          latitude: normalizedLatitude,
          longitude: normalizedLongitude,
          deliveryWindowFrom: orderDeliveryWindowFrom.trim() || null,
          deliveryWindowTo: orderDeliveryWindowTo.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setOrderFormError(result.message || "Не удалось создать заказ");
        return;
      }

      setOrderFormSuccess("Заказ успешно создан");
      setOrderExternalId("");
      setOrderTitle("");
      setOrderStatus("");
      setOrderDeliveryType("");
      setOrderAddress("");
      setOrderLatitude("");
      setOrderLongitude("");
      setOrderDeliveryWindowFrom("");
      setOrderDeliveryWindowTo("");

      await loadOrders();
    } catch {
      setOrderFormError("Ошибка сети или сервера");
    } finally {
      setOrderCreateLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "grid",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
          }}
        >
          <h1
            style={{
              margin: 0,
              marginBottom: "8px",
              fontSize: "30px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Заказы
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Отдельный раздел для просмотра и создания заказов.
          </p>
        </div>

        {error ? (
          <div
            style={{
              borderRadius: "12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "12px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "24px",
            display: "grid",
            gap: "16px",
            boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Список заказов
          </div>

          {ordersLoading ? (
            <div style={{ fontSize: "14px", color: "#4b5563" }}>
              Загрузка заказов...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              Заказов пока нет
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "16px",
                    background: "#f9fafb",
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {order.title}
                  </div>

                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    <strong>External ID:</strong> {order.externalId}
                  </div>

                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    <strong>Status:</strong> {order.status}
                  </div>

                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    <strong>Delivery type:</strong> {order.deliveryType}
                  </div>

                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    <strong>Address:</strong> {order.address}
                  </div>

                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    <strong>Window:</strong>{" "}
                    {order.deliveryWindowFrom || order.deliveryWindowTo
                      ? `${order.deliveryWindowFrom || "?"} - ${order.deliveryWindowTo || "?"}`
                      : "не указано"}
                  </div>

                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    <strong>Coordinates:</strong>{" "}
                    {order.latitude !== null && order.longitude !== null
                      ? `${order.latitude}, ${order.longitude}`
                      : "не указаны"}
                  </div>

                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    <strong>Warehouse:</strong> {order.warehouse?.name || "не привязан"}
                  </div>

                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    <strong>Integration:</strong> {order.integration?.name || "не привязан"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "18px",
            padding: "24px",
            display: "grid",
            gap: "16px",
            boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Добавить заказ
          </div>

          <form
            onSubmit={handleCreateOrder}
            style={{ display: "grid", gap: "14px" }}
          >
            <input
              type="text"
              value={orderExternalId}
              onChange={(e) => setOrderExternalId(e.target.value)}
              placeholder="External ID"
              style={inputStyle}
            />

            <input
              type="text"
              value={orderTitle}
              onChange={(e) => setOrderTitle(e.target.value)}
              placeholder="Название заказа"
              style={inputStyle}
            />

            <input
              type="text"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              placeholder="Status, например new"
              style={inputStyle}
            />

            <input
              type="text"
              value={orderDeliveryType}
              onChange={(e) => setOrderDeliveryType(e.target.value)}
              placeholder="Delivery type, например planned"
              style={inputStyle}
            />

            <input
              type="text"
              value={orderAddress}
              onChange={(e) => setOrderAddress(e.target.value)}
              placeholder="Адрес"
              style={inputStyle}
            />

            <input
              type="text"
              value={orderLatitude}
              onChange={(e) => setOrderLatitude(e.target.value)}
              placeholder="Latitude (необязательно)"
              style={inputStyle}
            />

            <input
              type="text"
              value={orderLongitude}
              onChange={(e) => setOrderLongitude(e.target.value)}
              placeholder="Longitude (необязательно)"
              style={inputStyle}
            />

            <input
              type="text"
              value={orderDeliveryWindowFrom}
              onChange={(e) => setOrderDeliveryWindowFrom(e.target.value)}
              placeholder="Delivery window from, например 10:00"
              style={inputStyle}
            />

            <input
              type="text"
              value={orderDeliveryWindowTo}
              onChange={(e) => setOrderDeliveryWindowTo(e.target.value)}
              placeholder="Delivery window to, например 14:00"
              style={inputStyle}
            />

            {orderFormError ? (
              <div
                style={{
                  borderRadius: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "12px",
                  fontSize: "14px",
                }}
              >
                {orderFormError}
              </div>
            ) : null}

            {orderFormSuccess ? (
              <div
                style={{
                  borderRadius: "12px",
                  background: "#ecfdf5",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  padding: "12px",
                  fontSize: "14px",
                }}
              >
                {orderFormSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={orderCreateLoading}
              style={{
                height: "46px",
                border: "none",
                borderRadius: "12px",
                background: orderCreateLoading ? "#93c5fd" : "#2563eb",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: orderCreateLoading ? "not-allowed" : "pointer",
              }}
            >
              {orderCreateLoading ? "Создание..." : "Добавить заказ"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  height: "44px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
  color: "#111827",
  background: "#ffffff",
  WebkitTextFillColor: "#111827",
};