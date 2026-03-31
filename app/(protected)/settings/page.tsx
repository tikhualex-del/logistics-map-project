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
  role?: string;
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

type SettingsSection = {
  key: string;
  title: string;
  description: string;
  href: string;
  statusText: string;
  statusTone: "ready" | "warning" | "neutral";
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

  async function loadOverview() {
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
        err instanceof Error ? err.message : "Ошибка загрузки overview";

      if (message !== "UNAUTHORIZED") {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
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
  const projectReady = completedSteps === totalSteps;

  const nextPendingStep = readinessSteps.find((item) => !item.done) || null;

  const settingsSections = useMemo<SettingsSection[]>(() => {
    return [
      {
        key: "general",
        title: "Общие настройки",
        description: "Базовые параметры компании: название, таймзона и общие параметры проекта.",
        href: "/settings/general",
        statusText: companyData?.company?.name ? "Базовые данные доступны" : "Нужно проверить",
        statusTone: companyData?.company?.name ? "ready" : "warning",
      },
      {
        key: "features",
        title: "Настройка функционала",
        description: "Управление включением модулей и функций платформы для проекта.",
        href: "/settings/features",
        statusText: "Раздел готов к настройке",
        statusTone: "neutral",
      },
      {
        key: "team",
        title: "Команда",
        description: "Управление сотрудниками, ролями и доступом к системе.",
        href: "/settings/staff",
        statusText: "Раздел доступен",
        statusTone: "ready",
      },
      {
        key: "warehouses",
        title: "Склады",
        description: "Настройка складов, точек старта и операционной базы маршрутов.",
        href: "/settings/warehouses",
        statusText:
          activeWarehouses.length > 0
            ? `Активных складов: ${activeWarehouses.length}`
            : "Склады еще не заведены",
        statusTone: activeWarehouses.length > 0 ? "ready" : "warning",
      },
      {
        key: "hours",
        title: "Рабочее время",
        description: "Рабочие дни, часы работы, доступность операций и окна обслуживания.",
        href: "/settings/operations/hours",
        statusText: "Раздел готов к настройке",
        statusTone: "neutral",
      },
      {
        key: "zones",
        title: "Зоны (полигоны)",
        description: "Геозоны, полигоны доставки, ограничения и будущая логика зонального ценообразования.",
        href: "/settings/routing/zones",
        statusText: "Раздел готов к настройке",
        statusTone: "neutral",
      },
      {
        key: "integrations",
        title: "Интеграции",
        description: "Подключение внешних систем и обмен заказами с платформой.",
        href: "/settings/integrations",
        statusText:
          activeIntegrations.length > 0
            ? `Активных интеграций: ${activeIntegrations.length}`
            : "Интеграции еще не подключены",
        statusTone: activeIntegrations.length > 0 ? "ready" : "warning",
      },
      {
        key: "orders",
        title: "Заказы",
        description: "Проверка и просмотр базового потока заказов внутри проекта.",
        href: "/settings/orders",
        statusText:
          orders.length > 0
            ? `Заказов в системе: ${orders.length}`
            : "Пока нет заказов",
        statusTone: orders.length > 0 ? "ready" : "warning",
      },
    ];
  }, [activeIntegrations.length, activeWarehouses.length, companyData?.company?.name, orders.length]);

  const overviewChecklist = useMemo(
    () => [
      {
        key: "integration",
        text: "Есть хотя бы одна активная интеграция",
        done: activeIntegrations.length > 0,
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
        text: "Есть хотя бы один заказ",
        done: orders.length > 0,
      },
    ],
    [activeIntegrations.length, mappings.length, activeWarehouses.length, orders.length]
  );

  const overviewChecklistDone = overviewChecklist.filter((item) => item.done).length;
  const overviewChecklistTotal = overviewChecklist.length;

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
              <div style={sectionEyebrowStyle}>Settings Overview</div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.15,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Обзор настроек проекта
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
                Это главная точка входа в настройки проекта. Здесь видно, какие
                разделы уже подготовлены, что настроено, а что еще требует
                внимания перед полноценной работой.
              </p>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: "18px",
                border: projectReady ? "1px solid #bbf7d0" : "1px solid #dbeafe",
                background: projectReady ? "#f0fdf4" : "#eff6ff",
                minWidth: "280px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  color: projectReady ? "#166534" : "#1d4ed8",
                }}
              >
                Статус проекта
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: projectReady ? "#166534" : "#1e3a8a",
                  marginBottom: "6px",
                }}
              >
                {projectReady ? "Проект готов к работе" : `${readinessPercent}% готовности`}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: projectReady ? "#166534" : "#1e3a8a",
                }}
              >
                Выполнено ключевых шагов: {completedSteps} из {totalSteps}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section style={panelStyle}>
            <div style={loadingBoxStyle}>Загрузка overview настроек...</div>
          </section>
        ) : error ? (
          <section style={panelStyle}>
            <div style={errorBoxStyle}>
              <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                Не удалось загрузить overview настроек
              </div>
              <div>{error}</div>

              <button
                type="button"
                onClick={loadOverview}
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
                title="Заказы"
                value={orders.length > 0 ? String(orders.length) : "0"}
                description={
                  orders.length > 0
                    ? `Последний пример: ${orders[0]?.title || "—"}`
                    : "Пока нет заказов для проверки сценария"
                }
              />
            </section>

            <section style={panelStyle}>
              <div style={{ marginBottom: "18px" }}>
                <h2 style={sectionTitleStyle}>Основные разделы настроек</h2>

                <p style={sectionDescriptionStyle}>
                  Ниже находятся ключевые разделы, через которые настраивается
                  проект. Это основная навигация для owner и admin.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "16px",
                }}
              >
                {settingsSections.map((item) => (
                  <SettingsSectionCard
                    key={item.key}
                    title={item.title}
                    description={item.description}
                    statusText={item.statusText}
                    statusTone={item.statusTone}
                    onClick={() => router.push(item.href)}
                  />
                ))}
              </div>
            </section>

            <section style={panelStyle}>
              <div style={{ marginBottom: "18px" }}>
                <h2 style={sectionTitleStyle}>Готовность к запуску</h2>

                <p style={sectionDescriptionStyle}>
                  Это operational checklist для базового запуска проекта.
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
                  <h2 style={sectionTitleStyle}>Что настроить дальше</h2>
                </div>

                {projectReady ? (
                  <div style={successInfoBoxStyle}>
                    Базовые настройки проекта уже доведены до рабочего состояния.
                    <br />
                    Дальше можно переходить к операционной работе, тестированию
                    маршрутов и развитию более сложных сценариев.
                  </div>
                ) : (
                  <div style={infoBoxStyle}>
                    Следующий незавершенный шаг:
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
                  {!projectReady && nextPendingStep ? (
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
                    onClick={loadOverview}
                    style={secondaryButtonStyle}
                  >
                    Обновить обзор
                  </button>
                </div>
              </div>

              <div style={panelStyle}>
                <div style={{ marginBottom: "16px" }}>
                  <h2 style={sectionTitleStyle}>Краткий чеклист</h2>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  {overviewChecklist.map((item) => (
                    <ChecklistItem
                      key={item.key}
                      done={item.done}
                      text={item.text}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section style={panelStyle}>
              <div style={{ marginBottom: "16px" }}>
                <h2 style={sectionTitleStyle}>Итоговая оценка состояния</h2>

                <p style={sectionDescriptionStyle}>
                  Этот блок помогает быстро понять, можно ли уже использовать
                  проект в реальном сценарии или еще нужно закрыть ключевые
                  настройки.
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
                  {overviewChecklist.map((item) => (
                    <FinalCheckItem
                      key={item.key}
                      done={item.done}
                      text={item.text}
                    />
                  ))}
                </div>

                <div
                  style={{
                    border: projectReady ? "1px solid #bbf7d0" : "1px solid #fde68a",
                    background: projectReady ? "#f0fdf4" : "#fffbeb",
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
                      color: projectReady ? "#166534" : "#92400e",
                    }}
                  >
                    Итоговый статус
                  </div>

                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: projectReady ? "#166534" : "#92400e",
                      marginBottom: "10px",
                    }}
                  >
                    {projectReady ? "Настройки в рабочем состоянии" : "Нужно завершить настройку"}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.7,
                      color: projectReady ? "#166534" : "#92400e",
                      marginBottom: "16px",
                    }}
                  >
                    Выполнено пунктов: {overviewChecklistDone} из {overviewChecklistTotal}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (projectReady) {
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
                      background: projectReady ? "#16a34a" : "#f59e0b",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {projectReady ? "Открыть карту" : "Перейти к следующему шагу"}
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

function SettingsSectionCard({
  title,
  description,
  statusText,
  statusTone,
  onClick,
}: {
  title: string;
  description: string;
  statusText: string;
  statusTone: "ready" | "warning" | "neutral";
  onClick: () => void;
}) {
  const toneStyles =
    statusTone === "ready"
      ? {
        badgeBackground: "#dcfce7",
        badgeColor: "#166534",
        buttonBackground: "#ffffff",
        buttonColor: "#111827",
        buttonBorder: "1px solid #d1d5db",
      }
      : statusTone === "warning"
        ? {
          badgeBackground: "#fef3c7",
          badgeColor: "#92400e",
          buttonBackground: "#2563eb",
          buttonColor: "#ffffff",
          buttonBorder: "none",
        }
        : {
          badgeBackground: "#e5e7eb",
          badgeColor: "#374151",
          buttonBackground: "#ffffff",
          buttonColor: "#111827",
          buttonBorder: "1px solid #d1d5db",
        };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
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
          background: toneStyles.badgeBackground,
          color: toneStyles.badgeColor,
          fontSize: "12px",
          fontWeight: 700,
          marginBottom: "14px",
        }}
      >
        {statusText}
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
          border: toneStyles.buttonBorder,
          background: toneStyles.buttonBackground,
          color: toneStyles.buttonColor,
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Открыть раздел
      </button>
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

const sectionEyebrowStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#2563eb",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "10px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  lineHeight: 1.2,
  fontWeight: 800,
  color: "#111827",
};

const sectionDescriptionStyle: React.CSSProperties = {
  marginTop: "8px",
  marginBottom: 0,
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#4b5563",
};

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

const errorBoxStyle: React.CSSProperties = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: "16px",
  padding: "16px",
  fontSize: "14px",
  lineHeight: 1.6,
};

const infoBoxStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#1e3a8a",
  borderRadius: "16px",
  padding: "16px",
  fontSize: "14px",
  lineHeight: 1.7,
};

const successInfoBoxStyle: React.CSSProperties = {
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  color: "#166534",
  borderRadius: "16px",
  padding: "16px",
  fontSize: "14px",
  lineHeight: 1.7,
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