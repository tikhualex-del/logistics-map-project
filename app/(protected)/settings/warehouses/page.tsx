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

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  async function loadWarehouses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/warehouses", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
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
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWarehouses();
  }, []);

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
        credentials: "include",
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
            Склады
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Отдельный раздел для просмотра и создания складов.
          </p>
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
            Список складов
          </div>

          {loading ? (
            <div style={{ fontSize: "14px", color: "#4b5563" }}>
              Загрузка складов...
            </div>
          ) : error ? (
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
                    {warehouse.latitude !== null && warehouse.longitude !== null
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