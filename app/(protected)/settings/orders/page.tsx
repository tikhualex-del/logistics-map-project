"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

const ORDER_TEMPLATE_1 = {
  externalId: `manual-${Date.now()}`,
  title: "Первый тестовый заказ",
  status: "new",
  deliveryType: "courier",
  address: "Москва, ул. Тверская, 1",
  latitude: "",
  longitude: "",
  deliveryWindowFrom: "10:00",
  deliveryWindowTo: "14:00",
};

const ORDER_TEMPLATE_2 = {
  externalId: `pickup-${Date.now()}`,
  title: "Самовывоз",
  status: "confirmed",
  deliveryType: "pickup",
  address: "Москва, ул. Арбат, 10",
  latitude: "",
  longitude: "",
  deliveryWindowFrom: "12:00",
  deliveryWindowTo: "16:00",
};

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  const [error, setError] = useState("");

  const [selectedIntegrationId, setSelectedIntegrationId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

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

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Не удалось загрузить заказы");
      }

      setOrders(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось загрузить заказы";
      setError(message);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadIntegrations() {
    setIntegrationsLoading(true);

    try {
      const response = await fetch("/api/integrations", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Не удалось загрузить интеграции");
      }

      const items = Array.isArray(result.data) ? result.data : [];
      setIntegrations(items);

      if (!selectedIntegrationId && items.length > 0) {
        const defaultIntegration =
          items.find((item: Integration) => item.isDefault && item.isActive) ||
          items.find((item: Integration) => item.isActive) ||
          items[0];

        if (defaultIntegration?.id) {
          setSelectedIntegrationId(defaultIntegration.id);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось загрузить интеграции";
      setError(message);
    } finally {
      setIntegrationsLoading(false);
    }
  }

  async function loadWarehouses() {
    setWarehousesLoading(true);

    try {
      const response = await fetch("/api/warehouses", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Не удалось загрузить склады");
      }

      const items = Array.isArray(result.data) ? result.data : [];
      setWarehouses(items);

      if (!selectedWarehouseId && items.length > 0) {
        const activeWarehouse =
          items.find((item: Warehouse) => item.isActive) || items[0];

        if (activeWarehouse?.id) {
          setSelectedWarehouseId(activeWarehouse.id);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось загрузить склады";
      setError(message);
    } finally {
      setWarehousesLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      setError("");
      await Promise.all([loadOrders(), loadIntegrations(), loadWarehouses()]);
    }

    bootstrap();
  }, []);

  const activeIntegrations = useMemo(
    () => integrations.filter((item) => item.isActive),
    [integrations]
  );

  const activeWarehouses = useMemo(
    () => warehouses.filter((item) => item.isActive),
    [warehouses]
  );

  function resetFormMessages() {
    setOrderFormError("");
    setOrderFormSuccess("");
  }

  function applyTemplate(template: {
    externalId: string;
    title: string;
    status: string;
    deliveryType: string;
    address: string;
    latitude: string;
    longitude: string;
    deliveryWindowFrom: string;
    deliveryWindowTo: string;
  }) {
    resetFormMessages();
    setOrderExternalId(template.externalId);
    setOrderTitle(template.title);
    setOrderStatus(template.status);
    setOrderDeliveryType(template.deliveryType);
    setOrderAddress(template.address);
    setOrderLatitude(template.latitude);
    setOrderLongitude(template.longitude);
    setOrderDeliveryWindowFrom(template.deliveryWindowFrom);
    setOrderDeliveryWindowTo(template.deliveryWindowTo);
  }

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();

    resetFormMessages();

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
          integrationId: selectedIntegrationId || null,
          warehouseId: selectedWarehouseId || null,
          externalId: orderExternalId.trim(),
          title: orderTitle.trim(),
          status: orderStatus.trim(),
          deliveryType: orderDeliveryType.trim(),
          address: orderAddress.trim(),
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

      setOrderFormSuccess(
        "Заказ успешно создан. Следующий шаг: открыть карту и убедиться, что у тебя появился первый рабочий результат."
      );

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
        padding: "32px 16px 48px",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <section style={panelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={eyebrowStyle}>Step 3 / Orders</div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.15,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Заказы
              </h1>

              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  fontSize: "15px",
                  lineHeight: 1.7,
                  color: "#4b5563",
                  maxWidth: "760px",
                }}
              >
                Здесь можно быстро создать первый заказ вручную и проверить, что
                продукт уже готов к работе, даже если внешняя интеграция ещё не
                подтянула данные.
              </p>
            </div>

            <div style={hintBoxStyle}>
              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                Что делать
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.6 }}>
                1. Выбрать интеграцию и склад
                <br />
                2. Создать первый заказ
                <br />
                3. Проверить список заказов
                <br />
                4. Перейти на карту
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          <MetricCard
            title="Всего заказов"
            value={String(orders.length)}
            description="Все заказы компании"
          />
          <MetricCard
            title="Активных интеграций"
            value={String(activeIntegrations.length)}
            description="Можно привязать к новому заказу"
          />
          <MetricCard
            title="Активных складов"
            value={String(activeWarehouses.length)}
            description="Можно использовать как точку работы"
          />
        </section>

        {error ? <div style={errorBoxStyle}>{error}</div> : null}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
            gap: "20px",
          }}
        >
          <div style={panelStyle}>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={sectionTitleStyle}>Создать первый заказ</h2>
              <p style={sectionTextStyle}>
                Это безопасный fallback-сценарий для первого запуска клиента.
              </p>
            </div>

            {(integrationsLoading || warehousesLoading) ? (
              <div style={mutedBoxStyle}>Загрузка интеграций и складов...</div>
            ) : (
              <form onSubmit={handleCreateOrder} style={{ display: "grid", gap: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => applyTemplate(ORDER_TEMPLATE_1)}
                    style={templateButtonStyle}
                  >
                    Вставить шаблон доставки
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTemplate(ORDER_TEMPLATE_2)}
                    style={templateButtonStyle}
                  >
                    Вставить шаблон самовывоза
                  </button>
                </div>

                <SelectField
                  label="Интеграция"
                  value={selectedIntegrationId}
                  onChange={setSelectedIntegrationId}
                  placeholder="Не выбрана"
                  options={activeIntegrations.map((item) => ({
                    value: item.id,
                    label: `${item.name} (${item.provider})${item.isDefault ? " — default" : ""}`,
                  }))}
                />

                <SelectField
                  label="Склад"
                  value={selectedWarehouseId}
                  onChange={setSelectedWarehouseId}
                  placeholder="Не выбран"
                  options={activeWarehouses.map((item) => ({
                    value: item.id,
                    label: `${item.name} — ${item.city}`,
                  }))}
                />

                <Field
                  label="External ID"
                  value={orderExternalId}
                  onChange={setOrderExternalId}
                  placeholder="Например, order-1001"
                />

                <Field
                  label="Название заказа"
                  value={orderTitle}
                  onChange={setOrderTitle}
                  placeholder="Например, Доставка клиенту №1"
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <Field
                    label="Status"
                    value={orderStatus}
                    onChange={setOrderStatus}
                    placeholder="Например, new"
                  />

                  <Field
                    label="Delivery type"
                    value={orderDeliveryType}
                    onChange={setOrderDeliveryType}
                    placeholder="Например, courier"
                  />
                </div>

                <Field
                  label="Адрес"
                  value={orderAddress}
                  onChange={setOrderAddress}
                  placeholder="Полный адрес доставки"
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <Field
                    label="Latitude"
                    value={orderLatitude}
                    onChange={setOrderLatitude}
                    placeholder="Необязательно"
                  />

                  <Field
                    label="Longitude"
                    value={orderLongitude}
                    onChange={setOrderLongitude}
                    placeholder="Необязательно"
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <Field
                    label="Delivery window from"
                    value={orderDeliveryWindowFrom}
                    onChange={setOrderDeliveryWindowFrom}
                    placeholder="Например, 10:00"
                  />

                  <Field
                    label="Delivery window to"
                    value={orderDeliveryWindowTo}
                    onChange={setOrderDeliveryWindowTo}
                    placeholder="Например, 14:00"
                  />
                </div>

                <div style={infoBoxStyle}>
                  Обязательные поля: <b>externalId</b>, <b>title</b>, <b>status</b>,{" "}
                  <b>deliveryType</b> и <b>address</b>. Интеграция и склад не
                  обязательны, но лучше указывать их сразу, чтобы заказ был
                  ближе к реальной рабочей схеме.
                </div>

                {orderFormError ? <div style={errorBoxStyle}>{orderFormError}</div> : null}
                {orderFormSuccess ? <div style={successBoxStyle}>{orderFormSuccess}</div> : null}

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="submit"
                    disabled={orderCreateLoading}
                    style={{
                      ...primaryButtonStyle,
                      background: orderCreateLoading ? "#93c5fd" : "#2563eb",
                      cursor: orderCreateLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {orderCreateLoading ? "Создание..." : "Создать заказ"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/map")}
                    disabled={orderCreateLoading}
                    style={secondaryButtonStyle}
                  >
                    Открыть карту
                  </button>
                </div>
              </form>
            )}
          </div>

          <div style={panelStyle}>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={sectionTitleStyle}>Следующий шаг</h2>
              <p style={sectionTextStyle}>
                После первого заказа нужно проверить, что пользователь дошёл до
                рабочего результата.
              </p>
            </div>

            <div style={mutedBoxStyle}>
              Минимально рабочий сценарий:
              <br />
              1. Есть хотя бы один заказ
              <br />
              2. У заказа есть адрес
              <br />
              3. После этого открываем карту
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => router.push("/map")}
                style={primaryButtonStyle}
              >
                Перейти на карту
              </button>

              <button
                type="button"
                onClick={() => router.push("/settings/mappings")}
                style={secondaryButtonStyle}
              >
                Назад к mappings
              </button>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={sectionTitleStyle}>Список заказов</h2>
            <p style={sectionTextStyle}>
              Здесь видно, что уже создано и к чему привязан заказ.
            </p>
          </div>

          {ordersLoading ? (
            <div style={mutedBoxStyle}>Загрузка заказов...</div>
          ) : orders.length === 0 ? (
            <div style={warningBoxStyle}>
              Заказов пока нет.
              <br />
              Создай первый заказ через форму выше — это самый быстрый способ
              проверить, что продукт уже можно показать клиенту.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "18px",
                    padding: "16px",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "17px",
                          fontWeight: 800,
                          color: "#111827",
                          marginBottom: "8px",
                        }}
                      >
                        {order.title}
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.7,
                          color: "#4b5563",
                          wordBreak: "break-word",
                        }}
                      >
                        External ID: {order.externalId}
                        <br />
                        Status: {order.status}
                        <br />
                        Delivery type: {order.deliveryType}
                        <br />
                        Address: {order.address}
                        <br />
                        Window:{" "}
                        {order.deliveryWindowFrom || order.deliveryWindowTo
                          ? `${order.deliveryWindowFrom || "?"} - ${order.deliveryWindowTo || "?"}`
                          : "не указано"}
                        <br />
                        Coordinates:{" "}
                        {order.latitude !== null && order.longitude !== null
                          ? `${order.latitude}, ${order.longitude}`
                          : "не указаны"}
                        <br />
                        Warehouse: {order.warehouse?.name || "не привязан"}
                        <br />
                        Integration: {order.integration?.name || "не привязан"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <StatusBadge text={order.status} tone="primary" />
                      <StatusBadge text={order.deliveryType} tone="success" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={labelStyle}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={labelStyle}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...inputStyle,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        padding: "18px",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#6b7280",
          textTransform: "uppercase",
          marginBottom: "10px",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "22px",
          lineHeight: 1.3,
          fontWeight: 800,
          color: "#111827",
          marginBottom: "8px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: "14px",
          lineHeight: 1.6,
          color: "#4b5563",
        }}
      >
        {description}
      </div>
    </div>
  );
}

function StatusBadge({
  text,
  tone,
}: {
  text: string;
  tone: "success" | "primary";
}) {
  const map = {
    success: {
      background: "#dcfce7",
      color: "#166534",
      border: "#bbf7d0",
    },
    primary: {
      background: "#dbeafe",
      color: "#1d4ed8",
      border: "#bfdbfe",
    },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "30px",
        padding: "0 10px",
        borderRadius: "999px",
        border: `1px solid ${map.border}`,
        background: map.background,
        color: map.color,
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#2563eb",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "10px",
};

const hintBoxStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  minWidth: "250px",
  color: "#1e3a8a",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  lineHeight: 1.2,
  fontWeight: 800,
  color: "#111827",
};

const sectionTextStyle: React.CSSProperties = {
  marginTop: "8px",
  marginBottom: 0,
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#4b5563",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
};

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

const primaryButtonStyle: React.CSSProperties = {
  height: "44px",
  borderRadius: "12px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  padding: "0 16px",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  height: "44px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  fontSize: "14px",
  fontWeight: 700,
  padding: "0 16px",
  cursor: "pointer",
};

const templateButtonStyle: React.CSSProperties = {
  height: "34px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  fontSize: "12px",
  fontWeight: 700,
  padding: "0 12px",
  cursor: "pointer",
};

const errorBoxStyle: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  lineHeight: 1.5,
};

const successBoxStyle: React.CSSProperties = {
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  color: "#065f46",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  lineHeight: 1.5,
};

const warningBoxStyle: React.CSSProperties = {
  background: "#fffbeb",
  border: "1px solid #fde68a",
  color: "#92400e",
  borderRadius: "12px",
  padding: "14px 16px",
  fontSize: "14px",
  lineHeight: 1.6,
};

const mutedBoxStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  background: "#f9fafb",
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: 1.6,
};

const infoBoxStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: 1.6,
};