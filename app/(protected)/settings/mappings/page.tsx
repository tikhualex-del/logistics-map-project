"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type IntegrationMapping = {
  id: string;
  companyId: string;
  integrationId: string;
  orderStatusMapJson: string;
  deliveryTypeMapJson: string;
  warehouseMapJson: string | null;
  courierMapJson: string | null;
  createdAt: string;
  integration: {
    id: string;
    name: string;
    provider: string;
    baseUrl: string | null;
    isActive: boolean;
    createdAt: string;
    companyId: string;
  };
};

const ORDER_STATUS_TEMPLATE = `{
  "new": "new",
  "confirmed": "confirmed",
  "assembling": "assembling",
  "ready_for_delivery": "ready_for_delivery",
  "delivered": "delivered",
  "cancelled": "cancelled"
}`;

const DELIVERY_TYPE_TEMPLATE = `{
  "courier": "courier",
  "express": "express",
  "pickup": "pickup"
}`;

const WAREHOUSE_TEMPLATE = `{
  "warehouse_1": "Main warehouse",
  "warehouse_2": "Reserve warehouse"
}`;

const COURIER_TEMPLATE = `{
  "car": "car",
  "bike": "bike",
  "walk": "walk"
}`;

export default function MappingsPage() {
  const router = useRouter();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);

  const [mappings, setMappings] = useState<IntegrationMapping[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);

  const [error, setError] = useState("");

  const [mappingIntegrationId, setMappingIntegrationId] = useState("");
  const [orderStatusMapJson, setOrderStatusMapJson] = useState("");
  const [deliveryTypeMapJson, setDeliveryTypeMapJson] = useState("");
  const [warehouseMapJson, setWarehouseMapJson] = useState("");
  const [courierMapJson, setCourierMapJson] = useState("");

  const [mappingFormError, setMappingFormError] = useState("");
  const [mappingFormSuccess, setMappingFormSuccess] = useState("");
  const [mappingCreateLoading, setMappingCreateLoading] = useState(false);

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

      if (!mappingIntegrationId && items.length > 0) {
        const defaultIntegration =
          items.find((item: Integration) => item.isDefault && item.isActive) ||
          items.find((item: Integration) => item.isActive) ||
          items[0];

        if (defaultIntegration?.id) {
          setMappingIntegrationId(defaultIntegration.id);
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

  async function loadMappings() {
    setMappingsLoading(true);

    try {
      const response = await fetch("/api/integration-mappings", {
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
        throw new Error(result.message || "Не удалось загрузить mappings");
      }

      setMappings(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось загрузить mappings";
      setError(message);
    } finally {
      setMappingsLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      setError("");
      await loadIntegrations();
      await loadMappings();
    }

    bootstrap();
  }, []);

  const activeIntegrations = useMemo(
    () => integrations.filter((item) => item.isActive),
    [integrations]
  );

  const defaultIntegration = useMemo(
    () =>
      activeIntegrations.find((item) => item.isDefault) || activeIntegrations[0] || null,
    [activeIntegrations]
  );

  const hasMappings = mappings.length > 0;

  function applyTemplate(
    setter: (value: string) => void,
    value: string
  ) {
    setter(value);
    setMappingFormError("");
    setMappingFormSuccess("");
  }

  async function handleCreateMapping(e: React.FormEvent) {
    e.preventDefault();

    setMappingFormError("");
    setMappingFormSuccess("");

    if (
      !mappingIntegrationId.trim() ||
      !orderStatusMapJson.trim() ||
      !deliveryTypeMapJson.trim()
    ) {
      setMappingFormError(
        "Заполни integration, order status mapping и delivery type mapping"
      );
      return;
    }

    try {
      JSON.parse(orderStatusMapJson);
      JSON.parse(deliveryTypeMapJson);

      if (warehouseMapJson.trim()) {
        JSON.parse(warehouseMapJson);
      }

      if (courierMapJson.trim()) {
        JSON.parse(courierMapJson);
      }
    } catch {
      setMappingFormError("Все JSON-поля должны быть валидным JSON");
      return;
    }

    try {
      setMappingCreateLoading(true);

      const response = await fetch("/api/integration-mappings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          integrationId: mappingIntegrationId,
          orderStatusMapJson,
          deliveryTypeMapJson,
          warehouseMapJson: warehouseMapJson.trim() || null,
          courierMapJson: courierMapJson.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMappingFormError(result.message || "Не удалось создать mapping");
        return;
      }

      setMappingFormSuccess(
        "Mapping успешно создан. Следующий шаг: открыть заказы или карту и проверить первый полезный результат."
      );

      setOrderStatusMapJson("");
      setDeliveryTypeMapJson("");
      setWarehouseMapJson("");
      setCourierMapJson("");

      await loadMappings();
    } catch {
      setMappingFormError("Ошибка сети или сервера");
    } finally {
      setMappingCreateLoading(false);
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
              <div style={eyebrowStyle}>Step 2 / Mappings</div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.15,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Integration mappings
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
                Здесь ты сопоставляешь значения из внешней системы с внутренними
                значениями платформы. Без этого заказы могут загрузиться
                некорректно.
              </p>
            </div>

            <div style={hintBoxStyle}>
              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                Что делать
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.6 }}>
                1. Выбрать интеграцию
                <br />
                2. Заполнить mapping статусов
                <br />
                3. Заполнить mapping типов доставки
                <br />
                4. При необходимости указать склад и курьера
                <br />
                5. Сохранить и перейти к заказам / карте
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
            title="Активных интеграций"
            value={String(activeIntegrations.length)}
            description="Можно использовать для mappings"
          />
          <MetricCard
            title="Основная интеграция"
            value={defaultIntegration?.name || "Не выбрана"}
            description="Подставляется первой для настройки"
          />
          <MetricCard
            title="Создано mappings"
            value={String(mappings.length)}
            description="Сохранённые сопоставления по интеграциям"
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
              <h2 style={sectionTitleStyle}>Создать mapping</h2>
              <p style={sectionTextStyle}>
                Используй шаблоны ниже, чтобы не писать JSON с нуля.
              </p>
            </div>

            {integrationsLoading ? (
              <div style={mutedBoxStyle}>Загрузка интеграций...</div>
            ) : activeIntegrations.length === 0 ? (
              <div style={warningBoxStyle}>
                Сначала подключи хотя бы одну активную интеграцию, потом вернись
                к mappings.
                <div style={{ marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/settings/integrations")}
                    style={primaryButtonStyle}
                  >
                    Перейти к интеграциям
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleCreateMapping}
                style={{ display: "grid", gap: "14px" }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={labelStyle}>Интеграция</span>
                  <select
                    value={mappingIntegrationId}
                    onChange={(e) => {
                      setMappingIntegrationId(e.target.value);
                      setMappingFormError("");
                      setMappingFormSuccess("");
                    }}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                    }}
                  >
                    <option value="">Выбери интеграцию</option>
                    {activeIntegrations.map((integration) => (
                      <option key={integration.id} value={integration.id}>
                        {integration.name} ({integration.provider})
                        {integration.isDefault ? " — default" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <JsonField
                  label="Order status mapping"
                  value={orderStatusMapJson}
                  onChange={setOrderStatusMapJson}
                  placeholder='Например: {"new":"new","done":"delivered"}'
                  onApplyTemplate={() =>
                    applyTemplate(setOrderStatusMapJson, ORDER_STATUS_TEMPLATE)
                  }
                  templateButtonText="Вставить шаблон статусов"
                />

                <JsonField
                  label="Delivery type mapping"
                  value={deliveryTypeMapJson}
                  onChange={setDeliveryTypeMapJson}
                  placeholder='Например: {"courier":"courier","pickup":"pickup"}'
                  onApplyTemplate={() =>
                    applyTemplate(setDeliveryTypeMapJson, DELIVERY_TYPE_TEMPLATE)
                  }
                  templateButtonText="Вставить шаблон типов доставки"
                />

                <JsonField
                  label="Warehouse mapping"
                  value={warehouseMapJson}
                  onChange={setWarehouseMapJson}
                  placeholder="Необязательно"
                  onApplyTemplate={() =>
                    applyTemplate(setWarehouseMapJson, WAREHOUSE_TEMPLATE)
                  }
                  templateButtonText="Вставить шаблон складов"
                />

                <JsonField
                  label="Courier mapping"
                  value={courierMapJson}
                  onChange={setCourierMapJson}
                  placeholder="Необязательно"
                  onApplyTemplate={() =>
                    applyTemplate(setCourierMapJson, COURIER_TEMPLATE)
                  }
                  templateButtonText="Вставить шаблон курьеров"
                />

                <div style={infoBoxStyle}>
                  Обязательные поля: <b>Order status mapping</b> и{" "}
                  <b>Delivery type mapping</b>. Остальные можно заполнить позже,
                  если они реально нужны в интеграции.
                </div>

                {mappingFormError ? (
                  <div style={errorBoxStyle}>{mappingFormError}</div>
                ) : null}

                {mappingFormSuccess ? (
                  <div style={successBoxStyle}>{mappingFormSuccess}</div>
                ) : null}

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "4px",
                  }}
                >
                  <button
                    type="submit"
                    disabled={mappingCreateLoading}
                    style={{
                      ...primaryButtonStyle,
                      background: mappingCreateLoading ? "#93c5fd" : "#2563eb",
                      cursor: mappingCreateLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {mappingCreateLoading ? "Сохранение..." : "Сохранить mapping"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/settings/integrations")}
                    disabled={mappingCreateLoading}
                    style={secondaryButtonStyle}
                  >
                    К интеграциям
                  </button>
                </div>
              </form>
            )}
          </div>

          <div style={panelStyle}>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={sectionTitleStyle}>Следующий шаг</h2>
              <p style={sectionTextStyle}>
                После сохранения mapping переходи к первому рабочему результату.
              </p>
            </div>

            <div style={mutedBoxStyle}>
              Минимально рабочий сценарий:
              <br />
              1. Есть активная интеграция
              <br />
              2. Есть хотя бы один mapping
              <br />
              3. После этого открываем заказы или карту
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
                onClick={() => router.push("/orders")}
                style={primaryButtonStyle}
              >
                Открыть заказы
              </button>

              <button
                type="button"
                onClick={() => router.push("/map")}
                style={secondaryButtonStyle}
              >
                Открыть карту
              </button>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={sectionTitleStyle}>Список mappings</h2>
            <p style={sectionTextStyle}>
              Здесь видно, для какой интеграции уже настроены сопоставления.
            </p>
          </div>

          {mappingsLoading ? (
            <div style={mutedBoxStyle}>Загрузка mappings...</div>
          ) : !hasMappings ? (
            <div style={mutedBoxStyle}>
              Пока mappings нет.
              <br />
              Создай первый mapping через форму выше.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "18px",
                    padding: "16px",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight: 800,
                      color: "#111827",
                      marginBottom: "8px",
                    }}
                  >
                    {mapping.integration.name}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.7,
                      color: "#4b5563",
                      wordBreak: "break-word",
                    }}
                  >
                    Provider: {mapping.integration.provider}
                    <br />
                    Order status mapping: {mapping.orderStatusMapJson}
                    <br />
                    Delivery type mapping: {mapping.deliveryTypeMapJson}
                    <br />
                    Warehouse mapping: {mapping.warehouseMapJson || "не указан"}
                    <br />
                    Courier mapping: {mapping.courierMapJson || "не указан"}
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

function JsonField({
  label,
  value,
  onChange,
  placeholder,
  onApplyTemplate,
  templateButtonText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onApplyTemplate: () => void;
  templateButtonText: string;
}) {
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={labelStyle}>{label}</span>

        <button
          type="button"
          onClick={onApplyTemplate}
          style={templateButtonStyle}
        >
          {templateButtonText}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={textareaStyle}
      />
    </div>
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

const textareaStyle: React.CSSProperties = {
  minHeight: "120px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  padding: "12px",
  fontSize: "14px",
  outline: "none",
  color: "#111827",
  background: "#ffffff",
  WebkitTextFillColor: "#111827",
  resize: "vertical",
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