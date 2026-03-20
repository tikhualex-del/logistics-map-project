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
      <strong>Пользователь:</strong> {companyData.user.fullName} ({companyData.user.email})
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

    <div style={{ fontSize: "14px", color: "#4b5563" }}>
      Управление складами вынесено в отдельный раздел.
    </div>

    <button
      type="button"
      onClick={() => router.push("/settings/warehouses")}
      style={{
        height: "44px",
        border: "none",
        borderRadius: "12px",
        background: "#2563eb",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        width: "fit-content",
        padding: "0 16px",
      }}
    >
      Открыть склады
    </button>
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

    <div style={{ fontSize: "14px", color: "#4b5563" }}>
      Управление интеграциями вынесено в отдельный раздел.
    </div>

    <button
      type="button"
      onClick={() => router.push("/settings/integrations")}
      style={{
        height: "44px",
        border: "none",
        borderRadius: "12px",
        background: "#2563eb",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        width: "fit-content",
        padding: "0 16px",
      }}
    >
      Открыть интеграции
    </button>
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

    <div style={{ fontSize: "14px", color: "#4b5563" }}>
      Управление mappings вынесено в отдельный раздел.
    </div>

    <button
      type="button"
      onClick={() => router.push("/settings/mappings")}
      style={{
        height: "44px",
        border: "none",
        borderRadius: "12px",
        background: "#2563eb",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        width: "fit-content",
        padding: "0 16px",
      }}
    >
      Открыть mappings
    </button>
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

    <div style={{ fontSize: "14px", color: "#4b5563" }}>
      Управление заказами вынесено в отдельный раздел.
    </div>

    <button
      type="button"
      onClick={() => router.push("/settings/orders")}
      style={{
        height: "44px",
        border: "none",
        borderRadius: "12px",
        background: "#2563eb",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        width: "fit-content",
        padding: "0 16px",
      }}
    >
      Открыть заказы
    </button>
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