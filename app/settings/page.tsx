"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponseData = {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  company: {
    id: string;
    name: string;
    timezone: string;
  };
};

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
  credentialsEncryptedJson: string;
  isActive: boolean;
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
    credentialsEncryptedJson: string;
    isActive: boolean;
    createdAt: string;
    companyId: string;
  };
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

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyData, setCompanyData] = useState<MeResponseData | null>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);

  const [integrationName, setIntegrationName] = useState("");
  const [integrationProvider, setIntegrationProvider] = useState("");
  const [integrationBaseUrl, setIntegrationBaseUrl] = useState("");
  const [integrationCredentials, setIntegrationCredentials] = useState("");

  const [integrationFormError, setIntegrationFormError] = useState("");
  const [integrationFormSuccess, setIntegrationFormSuccess] = useState("");
  const [integrationCreateLoading, setIntegrationCreateLoading] = useState(false);
  const [mappings, setMappings] = useState<IntegrationMapping[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);

  const [mappingIntegrationId, setMappingIntegrationId] = useState("");
  const [orderStatusMapJson, setOrderStatusMapJson] = useState("");
  const [deliveryTypeMapJson, setDeliveryTypeMapJson] = useState("");
  const [warehouseMapJson, setWarehouseMapJson] = useState("");
  const [courierMapJson, setCourierMapJson] = useState("");

  const [mappingFormError, setMappingFormError] = useState("");
  const [mappingFormSuccess, setMappingFormSuccess] = useState("");
  const [mappingCreateLoading, setMappingCreateLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

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

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  async function loadMe() {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (response.status === 401) {
        router.replace("/login");
        return null;
      }

      throw new Error(result.message || "Не удалось загрузить данные компании");
    }

    return result.data as MeResponseData;
  }

  async function loadWarehouses() {
    setWarehousesLoading(true);

    try {
      const response = await fetch("/api/warehouses", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Не удалось загрузить склады");
      }

      setWarehouses(result.data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Не удалось загрузить склады";
      setError(message);
    } finally {
      setWarehousesLoading(false);
    }
  }

  async function loadIntegrations() {
    setIntegrationsLoading(true);

    try {
      const response = await fetch("/api/integrations", {
        method: "GET",
        cache: "no-store",
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

  async function loadOrders() {
    setOrdersLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
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
    async function bootstrap() {
      try {
        setLoading(true);
        setError("");

        const me = await loadMe();
        if (!me) return;

        setCompanyData(me);
        await loadWarehouses();
        await loadIntegrations();
        await loadMappings();
        await loadOrders();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Ошибка загрузки настроек";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [router]);

  async function handleCreateWarehouse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setFormError("");
    setFormSuccess("");

    if (!name.trim() || !city.trim() || !address.trim()) {
      setFormError("Заполни name, city и address");
      return;
    }

    const normalizedLatitude =
      latitude.trim() === "" ? null : Number(latitude.trim());
    const normalizedLongitude =
      longitude.trim() === "" ? null : Number(longitude.trim());

    if (
      (normalizedLatitude !== null && Number.isNaN(normalizedLatitude)) ||
      (normalizedLongitude !== null && Number.isNaN(normalizedLongitude))
    ) {
      setFormError("Latitude и longitude должны быть числами");
      return;
    }

    try {
      setCreateLoading(true);

      const response = await fetch("/api/warehouses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          city,
          address,
          latitude: normalizedLatitude,
          longitude: normalizedLongitude,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setFormError(result.message || "Не удалось создать склад");
        return;
      }

      setFormSuccess("Склад успешно создан");
      setName("");
      setCity("");
      setAddress("");
      setLatitude("");
      setLongitude("");

      await loadWarehouses();
    } catch {
      setFormError("Ошибка сети или сервера");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleCreateIntegration(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIntegrationFormError("");
    setIntegrationFormSuccess("");

    if (
      !integrationName.trim() ||
      !integrationProvider.trim() ||
      !integrationCredentials.trim()
    ) {
      setIntegrationFormError(
        "Заполни name, provider и credentialsEncryptedJson"
      );
      return;
    }

    try {
      setIntegrationCreateLoading(true);

      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: integrationName,
          provider: integrationProvider,
          baseUrl: integrationBaseUrl.trim() || null,
          credentialsEncryptedJson: integrationCredentials,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setIntegrationFormError(result.message || "Не удалось создать интеграцию");
        return;
      }

      setIntegrationFormSuccess("Интеграция успешно создана");
      setIntegrationName("");
      setIntegrationProvider("");
      setIntegrationBaseUrl("");
      setIntegrationCredentials("");

      await loadIntegrations();
    } catch {
      setIntegrationFormError("Ошибка сети или сервера");
    } finally {
      setIntegrationCreateLoading(false);
    }
  }

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
      setMappingCreateLoading(true);

      const response = await fetch("/api/integration-mappings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
            Настройки
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Первая версия настроек компании и складов.
          </p>
        </div>

        {loading ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
              padding: "24px",
              color: "#374151",
            }}
          >
            Загрузка настроек...
          </div>
        ) : error ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "18px",
              padding: "24px",
            }}
          >
            <div
              style={{
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "14px",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          </div>
        ) : companyData ? (
          <>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "18px",
                padding: "24px",
                display: "grid",
                gap: "12px",
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
                Компания
              </div>

              <div style={{ fontSize: "14px", color: "#374151" }}>
                <strong>Название:</strong> {companyData.company.name}
              </div>

              <div style={{ fontSize: "14px", color: "#374151" }}>
                <strong>Таймзона:</strong> {companyData.company.timezone}
              </div>

              <div style={{ fontSize: "14px", color: "#374151" }}>
                <strong>Пользователь:</strong> {companyData.user.fullName} (
                {companyData.user.email})
              </div>
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
                Склады
              </div>

              {warehousesLoading ? (
                <div style={{ fontSize: "14px", color: "#4b5563" }}>
                  Загрузка складов...
                </div>
              ) : warehouses.length === 0 ? (
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  Складов пока нет
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  {warehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
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
                        {warehouse.name}
                      </div>

                      <div style={{ fontSize: "14px", color: "#374151" }}>
                        <strong>Город:</strong> {warehouse.city}
                      </div>

                      <div style={{ fontSize: "14px", color: "#374151" }}>
                        <strong>Адрес:</strong> {warehouse.address}
                      </div>

                      <div style={{ fontSize: "14px", color: "#374151" }}>
                        <strong>Координаты:</strong>{" "}
                        {warehouse.latitude !== null &&
                          warehouse.longitude !== null
                          ? `${warehouse.latitude}, ${warehouse.longitude}`
                          : "не указаны"}
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
                Интеграции
              </div>

              {integrationsLoading ? (
                <div style={{ fontSize: "14px", color: "#4b5563" }}>
                  Загрузка интеграций...
                </div>
              ) : integrations.length === 0 ? (
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  Интеграций пока нет
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
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
                        {integration.name}
                      </div>

                      <div style={{ fontSize: "14px", color: "#374151" }}>
                        <strong>Provider:</strong> {integration.provider}
                      </div>

                      <div style={{ fontSize: "14px", color: "#374151" }}>
                        <strong>Base URL:</strong> {integration.baseUrl || "не указан"}
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                          wordBreak: "break-all",
                        }}
                      >
                        <strong>Credentials JSON:</strong>{" "}
                        {integration.credentialsEncryptedJson}
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
                Добавить интеграцию
              </div>

              <form
                onSubmit={handleCreateIntegration}
                style={{ display: "grid", gap: "14px" }}
              >
                <input
                  type="text"
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                  placeholder="Название интеграции"
                  style={inputStyle}
                />

                <input
                  type="text"
                  value={integrationProvider}
                  onChange={(e) => setIntegrationProvider(e.target.value)}
                  placeholder="Provider, например retailcrm"
                  style={inputStyle}
                />

                <input
                  type="text"
                  value={integrationBaseUrl}
                  onChange={(e) => setIntegrationBaseUrl(e.target.value)}
                  placeholder="Base URL (необязательно)"
                  style={inputStyle}
                />

                <textarea
                  value={integrationCredentials}
                  onChange={(e) => setIntegrationCredentials(e.target.value)}
                  placeholder='credentialsEncryptedJson, например {"apiKey":"test-key"}'
                  style={{
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
                  }}
                />


                {integrationFormError ? (
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
                    {integrationFormError}
                  </div>
                ) : null}

                {integrationFormSuccess ? (
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
                    {integrationFormSuccess}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={integrationCreateLoading}
                  style={{
                    height: "46px",
                    border: "none",
                    borderRadius: "12px",
                    background: integrationCreateLoading ? "#93c5fd" : "#2563eb",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: integrationCreateLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {integrationCreateLoading ? "Создание..." : "Добавить интеграцию"}
                </button>
              </form>
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
                Integration mappings
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
                        <strong>orderStatusMapJson:</strong>{" "}
                        {mapping.orderStatusMapJson}
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <strong>deliveryTypeMapJson:</strong>{" "}
                        {mapping.deliveryTypeMapJson}
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
                  placeholder='warehouseMapJson (необязательно)'
                  style={textareaStyle}
                />

                <textarea
                  value={courierMapJson}
                  onChange={(e) => setCourierMapJson(e.target.value)}
                  placeholder='courierMapJson (необязательно)'
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
                Заказы
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
                Добавить склад
              </div>

              <form
                onSubmit={handleCreateWarehouse}
                style={{ display: "grid", gap: "14px" }}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Название склада"
                  style={inputStyle}
                />

                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Город"
                  style={inputStyle}
                />

                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Адрес"
                  style={inputStyle}
                />

                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude (необязательно)"
                  style={inputStyle}
                />

                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude (необязательно)"
                  style={inputStyle}
                />

                {formError ? (
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
                    {formError}
                  </div>
                ) : null}

                {formSuccess ? (
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
                    {formSuccess}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    height: "46px",
                    border: "none",
                    borderRadius: "12px",
                    background: createLoading ? "#93c5fd" : "#2563eb",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: createLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {createLoading ? "Создание..." : "Добавить склад"}
                </button>
              </form>
            </div>
          </>
        ) : null}
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