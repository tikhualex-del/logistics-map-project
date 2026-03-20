"use client";

import { useEffect, useState } from "react";

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

export default function MappingsPage() {
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

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Не удалось загрузить интеграции");
      }

      setIntegrations(result.data || []);
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

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Не удалось загрузить mappings");
      }

      setMappings(result.data || []);
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

  async function handleCreateMapping(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMappingFormError("");
    setMappingFormSuccess("");

    if (
      !mappingIntegrationId.trim() ||
      !orderStatusMapJson.trim() ||
      !deliveryTypeMapJson.trim()
    ) {
      setMappingFormError(
        "Заполни integration, orderStatusMapJson и deliveryTypeMapJson"
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
      setMappingFormError("Все JSON поля должны быть валидным JSON");
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

      setMappingFormSuccess("Mapping успешно создан");
      setMappingIntegrationId("");
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
            Integration mappings
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Отдельный раздел для просмотра и создания mappings.
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
            Список mappings
          </div>

          {mappingsLoading ? (
            <div style={{ fontSize: "14px", color: "#4b5563" }}>
              Загрузка mappings...
            </div>
          ) : mappings.length === 0 ? (
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              Mappings пока нет
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
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
                    {mapping.integration.name}
                  </div>

                  <div style={{ fontSize: "14px", color: "#374151" }}>
                    <strong>Provider:</strong> {mapping.integration.provider}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <strong>orderStatusMapJson:</strong> {mapping.orderStatusMapJson}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <strong>deliveryTypeMapJson:</strong> {mapping.deliveryTypeMapJson}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <strong>warehouseMapJson:</strong>{" "}
                    {mapping.warehouseMapJson || "не указан"}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <strong>courierMapJson:</strong>{" "}
                    {mapping.courierMapJson || "не указан"}
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
            Добавить mapping
          </div>

          {integrationsLoading ? (
            <div style={{ fontSize: "14px", color: "#4b5563" }}>
              Загрузка интеграций...
            </div>
          ) : integrations.length === 0 ? (
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              Сначала создай хотя бы одну интеграцию
            </div>
          ) : (
            <form
              onSubmit={handleCreateMapping}
              style={{ display: "grid", gap: "14px" }}
            >
              <select
                value={mappingIntegrationId}
                onChange={(e) => setMappingIntegrationId(e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value="">Выбери интеграцию</option>
                {integrations.map((integration) => (
                  <option key={integration.id} value={integration.id}>
                    {integration.name} ({integration.provider})
                  </option>
                ))}
              </select>

              <textarea
                value={orderStatusMapJson}
                onChange={(e) => setOrderStatusMapJson(e.target.value)}
                placeholder='orderStatusMapJson, например {"new_order":"new","done":"complete"}'
                style={textareaStyle}
              />

              <textarea
                value={deliveryTypeMapJson}
                onChange={(e) => setDeliveryTypeMapJson(e.target.value)}
                placeholder='deliveryTypeMapJson, например {"planned_delivery":"planned","express_delivery":"express"}'
                style={textareaStyle}
              />

              <textarea
                value={warehouseMapJson}
                onChange={(e) => setWarehouseMapJson(e.target.value)}
                placeholder="warehouseMapJson (необязательно)"
                style={textareaStyle}
              />

              <textarea
                value={courierMapJson}
                onChange={(e) => setCourierMapJson(e.target.value)}
                placeholder="courierMapJson (необязательно)"
                style={textareaStyle}
              />

              {mappingFormError ? (
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
                  {mappingFormError}
                </div>
              ) : null}

              {mappingFormSuccess ? (
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
                  {mappingFormSuccess}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={mappingCreateLoading}
                style={{
                  height: "46px",
                  border: "none",
                  borderRadius: "12px",
                  background: mappingCreateLoading ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: mappingCreateLoading ? "not-allowed" : "pointer",
                }}
              >
                {mappingCreateLoading ? "Создание..." : "Добавить mapping"}
              </button>
            </form>
          )}
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