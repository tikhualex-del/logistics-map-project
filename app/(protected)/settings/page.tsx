"use client";

import { useEffect, useMemo, useState } from "react";
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

type Integration = {
  id: string;
  name: string;
  provider: string;
  baseUrl: string | null;
  isActive?: boolean;
  isDefault?: boolean;
};

type Mapping = {
  id: string;
  integrationId: string;
};

type Warehouse = {
  id: string;
  name: string;
  isActive?: boolean;
};

type Order = {
  id: string;
  externalId: string;
  title: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [companyData, setCompanyData] = useState<MeResponseData | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const result: ApiResponse<T> = await response.json();

    if (response.status === 401) {
      router.replace("/login");
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Не удалось загрузить ${url}`);
    }

    return result.data as T;
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [me, integrationsData, mappingsData, warehousesData, ordersData] =
        await Promise.all([
          fetchJson<MeResponseData>("/api/auth/me"),
          fetchJson<Integration[]>("/api/integrations"),
          fetchJson<Mapping[]>("/api/integration-mappings"),
          fetchJson<Warehouse[]>("/api/warehouses"),
          fetchJson<Order[]>("/api/orders"),
        ]);

      setCompanyData(me);
      setIntegrations(Array.isArray(integrationsData) ? integrationsData : []);
      setMappings(Array.isArray(mappingsData) ? mappingsData : []);
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ошибка загрузки launch dashboard";

      if (message !== "UNAUTHORIZED") {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const activeIntegrations = useMemo(
    () => integrations.filter((item) => item.isActive !== false),
    [integrations]
  );

  const defaultIntegration = useMemo(
    () => activeIntegrations.find((item) => item.isDefault) || null,
    [activeIntegrations]
  );

  const activeWarehouses = useMemo(
    () => warehouses.filter((item) => item.isActive !== false),
    [warehouses]
  );

  const readinessSteps = useMemo(() => {
    const step1Done = activeIntegrations.length > 0;
    const step2Done = mappings.length > 0;
    const step3Done = activeWarehouses.length > 0;
    const step4Done = orders.length > 0;

    return [
      {
        key: "integrations",
        step: "Шаг 1",
        title: "Интеграция подключена",
        done: step1Done,
        description: step1Done
          ? `Активных интеграций: ${activeIntegrations.length}`
          : "Без интеграции система не сможет нормально получать внешние данные.",
        actionText: "Открыть интеграции",
        actionHref: "/settings/integrations",
      },
      {
        key: "mappings",
        step: "Шаг 2",
        title: "Mappings настроены",
        done: step2Done,
        description: step2Done
          ? `Создано mappings: ${mappings.length}`
          : "Без mappings статусы и типы доставки могут отображаться некорректно.",
        actionText: "Открыть mappings",
        actionHref: "/settings/mappings",
      },
      {
        key: "warehouses",
        step: "Шаг 3",
        title: "Склады заведены",
        done: step3Done,
        description: step3Done
          ? `Активных складов: ${activeWarehouses.length}`
          : "Склады нужны для базовой операционной логики и маршрутизации.",
        actionText: "Открыть склады",
        actionHref: "/settings/warehouses",
      },
      {
        key: "orders",
        step: "Шаг 4",
        title: "Есть первый заказ",
        done: step4Done,
        description: step4Done
          ? `Создано заказов: ${orders.length}`
          : "Хотя бы один заказ нужен, чтобы проверить реальный сценарий работы.",
        actionText: "Открыть заказы",
        actionHref: "/settings/orders",
      },
    ];
  }, [activeIntegrations.length, activeWarehouses.length, mappings.length, orders.length]);

  const completedSteps = readinessSteps.filter((item) => item.done).length;
  const totalSteps = readinessSteps.length;
  const readinessPercent = Math.round((completedSteps / totalSteps) * 100);
  const goLiveReady = completedSteps === totalSteps;

  const nextPendingStep = readinessSteps.find((item) => !item.done) || null;

  const finalChecklist = useMemo(
    () => [
      {
        key: "active-integration",
        text: "Есть хотя бы одна активная интеграция",
        done: activeIntegrations.length > 0,
      },
      {
        key: "default-integration",
        text: "Выбрана основная интеграция или есть активная интеграция",
        done: Boolean(defaultIntegration || activeIntegrations.length > 0),
      },
      {
        key: "mapping",
        text: "Создан хотя бы один mapping",
        done: mappings.length > 0,
      },
      {
        key: "warehouse",
        text: "Есть хотя бы один активный склад",
        done: activeWarehouses.length > 0,
      },
      {
        key: "order",
        text: "Есть хотя бы один заказ для проверки рабочего сценария",
        done: orders.length > 0,
      },
    ],
    [activeIntegrations.length, activeWarehouses.length, defaultIntegration, mappings.length, orders.length]
  );

  const finalChecklistDone = finalChecklist.filter((item) => item.done).length;
  const finalChecklistTotal = finalChecklist.length;

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
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
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
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#2563eb",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "10px",
                }}
              >
                Launch Dashboard
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.15,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Настройки компании
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
                Это главный экран запуска клиента. Здесь видно, что уже готово
                для работы, а что ещё нужно завершить до go-live.
              </p>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "18px",
                border: goLiveReady ? "1px solid #bbf7d0" : "1px solid #dbeafe",
                background: goLiveReady ? "#f0fdf4" : "#eff6ff",
                minWidth: "280px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  color: goLiveReady ? "#166534" : "#1d4ed8",
                }}
              >
                Статус запуска
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: goLiveReady ? "#166534" : "#1e3a8a",
                  marginBottom: "6px",
                }}
              >
                {goLiveReady ? "Go-Live Ready" : `${readinessPercent}% готовности`}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: goLiveReady ? "#166534" : "#1e3a8a",
                }}
              >
                Завершено шагов: {completedSteps} из {totalSteps}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section style={panelStyle}>
            <div style={loadingBoxStyle}>Загрузка launch dashboard...</div>
          </section>
        ) : error ? (
          <section style={panelStyle}>
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                borderRadius: "16px",
                padding: "16px",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                Не удалось загрузить данные запуска
              </div>
              <div>{error}</div>

              <button
                type="button"
                onClick={loadDashboard}
                style={secondaryButtonStyle}
              >
                Обновить данные
              </button>
            </div>
          </section>
        ) : (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              <InfoCard
                title="Компания"
                value={companyData?.company.name || "—"}
                description={`Таймзона: ${companyData?.company.timezone || "—"}`}
              />
              <InfoCard
                title="Пользователь"
                value={companyData?.user.fullName || "—"}
                description={companyData?.user.email || "—"}
              />
              <InfoCard
                title="Default integration"
                value={defaultIntegration?.name || "Не выбрана"}
                description={
                  defaultIntegration
                    ? defaultIntegration.provider
                    : "Нужно выбрать основную интеграцию"
                }
              />
              <InfoCard
                title="Первый заказ"
                value={orders[0]?.title || "Ещё не создан"}
                description={
                  orders.length > 0
                    ? `Всего заказов: ${orders.length}`
                    : "Создай заказ для проверки реального сценария"
                }
              />
            </section>

            <section style={panelStyle}>
              <div style={{ marginBottom: "18px" }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    lineHeight: 1.2,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Готовность к запуску
                </h2>

                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "#4b5563",
                  }}
                >
                  Ниже только те шаги, которые реально нужны, чтобы довести
                  клиента до рабочего состояния.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "16px",
                }}
              >
                {readinessSteps.map((item) => (
                  <ReadinessCard
                    key={item.key}
                    step={item.step}
                    title={item.title}
                    description={item.description}
                    done={item.done}
                    actionText={item.actionText}
                    onClick={() => router.push(item.actionHref)}
                  />
                ))}
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 380px)",
                gap: "20px",
              }}
            >
              <div style={panelStyle}>
                <div style={{ marginBottom: "16px" }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    Что делать дальше
                  </h2>
                </div>

                {goLiveReady ? (
                  <div
                    style={{
                      border: "1px solid #bbf7d0",
                      background: "#f0fdf4",
                      color: "#166534",
                      borderRadius: "16px",
                      padding: "16px",
                      fontSize: "14px",
                      lineHeight: 1.7,
                    }}
                  >
                    Клиент прошёл минимальный путь запуска.
                    <br />
                    Теперь можно открывать карту и показывать продукт в рабочем
                    сценарии.
                  </div>
                ) : (
                  <div
                    style={{
                      border: "1px solid #dbeafe",
                      background: "#eff6ff",
                      color: "#1e3a8a",
                      borderRadius: "16px",
                      padding: "16px",
                      fontSize: "14px",
                      lineHeight: 1.7,
                    }}
                  >
                    Следующий незавершённый шаг:
                    <br />
                    <b>{nextPendingStep?.title || "Проверить настройки"}</b>
                    <br />
                    {nextPendingStep?.description || "Открой следующий раздел и заверши его."}
                  </div>
                )}

                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {!goLiveReady && nextPendingStep ? (
                    <button
                      type="button"
                      onClick={() => router.push(nextPendingStep.actionHref)}
                      style={primaryButtonStyle}
                    >
                      {nextPendingStep.actionText}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push("/map")}
                      style={primaryButtonStyle}
                    >
                      Открыть карту
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={loadDashboard}
                    style={secondaryButtonStyle}
                  >
                    Обновить статус
                  </button>
                </div>
              </div>

              <div style={panelStyle}>
                <div style={{ marginBottom: "16px" }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    Критерии go-live
                  </h2>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <ChecklistItem
                    done={activeIntegrations.length > 0}
                    text="Есть хотя бы одна активная интеграция"
                  />
                  <ChecklistItem
                    done={mappings.length > 0}
                    text="Создан хотя бы один mapping"
                  />
                  <ChecklistItem
                    done={activeWarehouses.length > 0}
                    text="Есть хотя бы один активный склад"
                  />
                  <ChecklistItem
                    done={orders.length > 0}
                    text="Создан хотя бы один заказ"
                  />
                </div>
              </div>
            </section>

            <section style={panelStyle}>
              <div style={{ marginBottom: "16px" }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    lineHeight: 1.2,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Финальная проверка перед стартом
                </h2>

                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "#4b5563",
                  }}
                >
                  Этот блок нужен, чтобы owner понял, можно ли уже реально
                  начинать работу без помощи разработчика.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 360px)",
                  gap: "20px",
                }}
              >
                <div style={{ display: "grid", gap: "12px" }}>
                  {finalChecklist.map((item) => (
                    <FinalCheckItem
                      key={item.key}
                      done={item.done}
                      text={item.text}
                    />
                  ))}
                </div>

                <div
                  style={{
                    border: goLiveReady ? "1px solid #bbf7d0" : "1px solid #fde68a",
                    background: goLiveReady ? "#f0fdf4" : "#fffbeb",
                    borderRadius: "18px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: "10px",
                      color: goLiveReady ? "#166534" : "#92400e",
                    }}
                  >
                    Итоговый статус
                  </div>

                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: goLiveReady ? "#166534" : "#92400e",
                      marginBottom: "10px",
                    }}
                  >
                    {goLiveReady ? "Готово к запуску" : "Нужно завершить настройку"}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.7,
                      color: goLiveReady ? "#166534" : "#92400e",
                      marginBottom: "16px",
                    }}
                  >
                    Выполнено пунктов: {finalChecklistDone} из {finalChecklistTotal}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (goLiveReady) {
                        router.push("/map");
                        return;
                      }

                      if (nextPendingStep) {
                        router.push(nextPendingStep.actionHref);
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "44px",
                      borderRadius: "12px",
                      border: "none",
                      background: goLiveReady ? "#16a34a" : "#f59e0b",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {goLiveReady ? "Открыть карту" : "Завершить следующий шаг"}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function InfoCard({
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
          fontSize: "18px",
          lineHeight: 1.4,
          fontWeight: 700,
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

function ReadinessCard({
  step,
  title,
  description,
  done,
  actionText,
  onClick,
}: {
  step: string;
  title: string;
  description: string;
  done: boolean;
  actionText: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        border: done ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: "18px",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          padding: "6px 10px",
          borderRadius: "999px",
          background: done ? "#dcfce7" : "#f3f4f6",
          color: done ? "#166534" : "#374151",
          fontSize: "12px",
          fontWeight: 700,
          marginBottom: "14px",
        }}
      >
        {step} · {done ? "Done" : "Pending"}
      </div>

      <div
        style={{
          fontSize: "18px",
          fontWeight: 800,
          color: "#111827",
          marginBottom: "10px",
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#4b5563",
          lineHeight: 1.65,
          minHeight: "76px",
          marginBottom: "16px",
        }}
      >
        {description}
      </div>

      <button
        type="button"
        onClick={onClick}
        style={{
          width: "100%",
          height: "42px",
          borderRadius: "12px",
          border: done ? "1px solid #d1d5db" : "none",
          background: done ? "#ffffff" : "#2563eb",
          color: done ? "#111827" : "#ffffff",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {actionText}
      </button>
    </div>
  );
}

function ChecklistItem({
  done,
  text,
}: {
  done: boolean;
  text: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: done ? "#f0fdf4" : "#f9fafb",
        borderRadius: "14px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "999px",
          background: done ? "#16a34a" : "#d1d5db",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: "14px",
          lineHeight: 1.5,
          color: "#111827",
        }}
      >
        {text}
      </span>
    </div>
  );
}

function FinalCheckItem({
  done,
  text,
}: {
  done: boolean;
  text: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: done ? "#f0fdf4" : "#ffffff",
        borderRadius: "14px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "999px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: done ? "#16a34a" : "#e5e7eb",
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {done ? "✓" : "•"}
      </span>

      <span
        style={{
          fontSize: "14px",
          lineHeight: 1.6,
          color: "#111827",
        }}
      >
        {text}
      </span>
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

const loadingBoxStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  background: "#f9fafb",
  fontSize: "14px",
  color: "#4b5563",
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
  marginTop: "14px",
  height: "42px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  fontSize: "14px",
  fontWeight: 700,
  padding: "0 14px",
  cursor: "pointer",
};