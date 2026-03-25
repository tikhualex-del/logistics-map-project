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

export default function WarehousesPage() {
  const router = useRouter();

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

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Не удалось загрузить склады");
      }

      setWarehouses(Array.isArray(result.data) ? result.data : []);
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

  const activeWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.isActive !== false),
    [warehouses]
  );

  function resetMessages() {
    setFormError("");
    setFormSuccess("");
  }

  function applyFirstWarehouseTemplate() {
    resetMessages();
    setName("Основной склад");
    setCity("Москва");
    setAddress("Москва, ул. Тверская, 1");
    setLatitude("");
    setLongitude("");
  }

  async function handleCreateWarehouse(e: React.FormEvent) {
    e.preventDefault();

    resetMessages();

    if (!name.trim() || !city.trim() || !address.trim()) {
      setFormError("Заполни название склада, город и адрес");
      return;
    }

    const normalizedLatitude = latitude.trim() === "" ? null : Number(latitude.trim());
    const normalizedLongitude = longitude.trim() === "" ? null : Number(longitude.trim());

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
          name: name.trim(),
          city: city.trim(),
          address: address.trim(),
          latitude: normalizedLatitude,
          longitude: normalizedLongitude,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setFormError(result.message || "Не удалось создать склад");
        return;
      }

      setFormSuccess(
        "Склад успешно создан. Следующий шаг: создать заказ или открыть карту."
      );

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
              <div style={eyebrowStyle}>Step 3 / Warehouses</div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.15,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Склады
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
                Склад нужен как базовая точка операционной логики: откуда идут
                заказы, маршрутизация и дальнейшая работа на карте.
              </p>
            </div>

            <div style={hintBoxStyle}>
              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                Что делать
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.6 }}>
                1. Создать первый склад
                <br />
                2. Проверить адрес
                <br />
                3. При необходимости указать координаты
                <br />
                4. Перейти к заказам или карте
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
            title="Всего складов"
            value={String(warehouses.length)}
            description="Все склады компании"
          />
          <MetricCard
            title="Активных"
            value={String(activeWarehouses.length)}
            description="Можно использовать в работе"
          />
          <MetricCard
            title="Go-Live статус"
            value={activeWarehouses.length > 0 ? "OK" : "Нужен склад"}
            description="Минимум один активный склад для готовности к запуску"
          />
        </section>

        {error ? <div style={errorBoxStyle}>{error}</div> : null}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
            gap: "20px",
          }}
        >
          <div style={panelStyle}>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={sectionTitleStyle}>Добавить склад</h2>
              <p style={sectionTextStyle}>
                Начни с одного основного склада. Этого уже достаточно для первого
                клиента и первого запуска.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "14px",
              }}
            >
              <button
                type="button"
                onClick={applyFirstWarehouseTemplate}
                style={templateButtonStyle}
              >
                Вставить шаблон первого склада
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} style={{ display: "grid", gap: "14px" }}>
              <Field
                label="Название склада"
                value={name}
                onChange={setName}
                placeholder="Например, Основной склад"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                }}
              >
                <Field
                  label="Город"
                  value={city}
                  onChange={setCity}
                  placeholder="Например, Москва"
                />

                <Field
                  label="Адрес"
                  value={address}
                  onChange={setAddress}
                  placeholder="Полный адрес склада"
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
                  label="Latitude"
                  value={latitude}
                  onChange={setLatitude}
                  placeholder="Необязательно"
                />

                <Field
                  label="Longitude"
                  value={longitude}
                  onChange={setLongitude}
                  placeholder="Необязательно"
                />
              </div>

              <div style={infoBoxStyle}>
                Обязательные поля: <b>название склада</b>, <b>город</b> и{" "}
                <b>адрес</b>. Координаты можно добавить позже, если они уже есть
                у клиента.
              </div>

              {formError ? <div style={errorBoxStyle}>{formError}</div> : null}
              {formSuccess ? <div style={successBoxStyle}>{formSuccess}</div> : null}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    ...primaryButtonStyle,
                    background: createLoading ? "#93c5fd" : "#2563eb",
                    cursor: createLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {createLoading ? "Создание..." : "Добавить склад"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/settings/orders")}
                  disabled={createLoading}
                  style={secondaryButtonStyle}
                >
                  Перейти к заказам
                </button>
              </div>
            </form>
          </div>

          <div style={panelStyle}>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={sectionTitleStyle}>Следующий шаг</h2>
              <p style={sectionTextStyle}>
                После создания склада проверь, что путь до первого результата
                не обрывается.
              </p>
            </div>

            <div style={mutedBoxStyle}>
              Минимально рабочий сценарий:
              <br />
              1. Есть хотя бы один склад
              <br />
              2. Есть хотя бы один заказ
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
                onClick={() => router.push("/settings/orders")}
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
            <h2 style={sectionTitleStyle}>Список складов</h2>
            <p style={sectionTextStyle}>
              Здесь видно, какие точки уже заведены у компании.
            </p>
          </div>

          {loading ? (
            <div style={mutedBoxStyle}>Загрузка складов...</div>
          ) : warehouses.length === 0 ? (
            <div style={warningBoxStyle}>
              Складов пока нет.
              <br />
              Создай первый склад через форму выше — это обязательный шаг для
              готовности клиента к запуску.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
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
                        {warehouse.name}
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          lineHeight: 1.7,
                          color: "#4b5563",
                          wordBreak: "break-word",
                        }}
                      >
                        Город: {warehouse.city}
                        <br />
                        Адрес: {warehouse.address}
                        <br />
                        Координаты:{" "}
                        {warehouse.latitude !== null && warehouse.longitude !== null
                          ? `${warehouse.latitude}, ${warehouse.longitude}`
                          : "не указаны"}
                      </div>
                    </div>

                    <StatusBadge
                      text={warehouse.isActive !== false ? "Active" : "Disabled"}
                      tone={warehouse.isActive !== false ? "success" : "danger"}
                    />
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
  tone: "success" | "danger";
}) {
  const map = {
    success: {
      background: "#dcfce7",
      color: "#166534",
      border: "#bbf7d0",
    },
    danger: {
      background: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
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