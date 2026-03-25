"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type IntegrationListItem = {
  id: string;
  name: string;
  provider: string;
  baseUrl: string | null;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: string;
};

type ApiListResponse = {
  success: boolean;
  message?: string;
  data?: IntegrationListItem[];
};

type TestResult = {
  connectionOk: boolean;
  ordersFetched: number;
  totalCount: number | null;
  totalPageCount: number | null;
  currentPage: number | null;
};

export default function IntegrationsPage() {
  const router = useRouter();

  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [integrations, setIntegrations] = useState<IntegrationListItem[]>([]);

  const [name, setName] = useState("RetailCRM");
  const [provider, setProvider] = useState("retailcrm");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [site, setSite] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadIntegrations() {
    try {
      setLoadingList(true);
      setListError("");

      const response = await fetch("/api/integrations", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result: ApiListResponse = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !result.success) {
        setListError(result.message || "Не удалось загрузить интеграции");
        return;
      }

      setIntegrations(Array.isArray(result.data) ? result.data : []);
    } catch {
      setListError("Ошибка сети или сервера при загрузке интеграций");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadIntegrations();
  }, []);

  const hasIntegrations = integrations.length > 0;
  const activeCount = integrations.filter((item) => item.isActive !== false).length;
  const defaultIntegration = integrations.find((item) => item.isDefault);

  const onboardingText = useMemo(() => {
    if (hasIntegrations) {
      return "Интеграции уже подключены. Проверь статус, выбери default и переходи к mappings.";
    }

    return "Это обязательный шаг перед загрузкой заказов и работой с картой.";
  }, [hasIntegrations]);

  function resetMessages() {
    setFormError("");
    setFormSuccess("");
  }

  function resetTestState() {
    setTestPassed(false);
    setTestResult(null);
  }

  function onAnyFieldChange(setter: (value: string) => void, value: string) {
    setter(value);
    resetMessages();
    resetTestState();
  }

  async function handleTestConnection() {
    resetMessages();

    const normalizedName = name.trim();
    const normalizedBaseUrl = baseUrl.trim();
    const normalizedApiKey = apiKey.trim();
    const normalizedSite = site.trim();

    if (!normalizedName || !normalizedBaseUrl || !normalizedApiKey) {
      setFormError("Для проверки подключения заполни name, base URL и API key");
      return;
    }

    try {
      setIsTesting(true);

      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider,
          baseUrl: normalizedBaseUrl,
          credentials: {
            apiKey: normalizedApiKey,
            site: normalizedSite || undefined,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setTestPassed(false);
        setTestResult(null);
        setFormError(result.message || "Не удалось проверить подключение");
        return;
      }

      setTestPassed(true);
      setTestResult(result.data);
      setFormSuccess("Подключение успешно проверено. Теперь интеграцию можно сохранить.");
    } catch {
      setTestPassed(false);
      setTestResult(null);
      setFormError("Ошибка сети или сервера при проверке подключения");
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSave() {
    resetMessages();

    const normalizedName = name.trim();
    const normalizedBaseUrl = baseUrl.trim();
    const normalizedApiKey = apiKey.trim();
    const normalizedSite = site.trim();

    if (!normalizedName || !normalizedBaseUrl || !normalizedApiKey) {
      setFormError("Заполни обязательные поля");
      return;
    }

    if (!testPassed) {
      setFormError("Сначала выполни проверку подключения");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: normalizedName,
          provider,
          baseUrl: normalizedBaseUrl,
          credentialsJson: JSON.stringify({
            apiKey: normalizedApiKey,
            site: normalizedSite || undefined,
          }),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setFormError(result.message || "Не удалось сохранить интеграцию");
        return;
      }

      setFormSuccess("Интеграция сохранена. Следующий шаг: перейти к mappings.");
      setName("RetailCRM");
      setProvider("retailcrm");
      setBaseUrl("");
      setApiKey("");
      setSite("");
      setTestPassed(false);
      setTestResult(null);

      await loadIntegrations();
    } catch {
      setFormError("Ошибка сети или сервера при сохранении интеграции");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetDefault(integrationId: string) {
    try {
      setUpdatingId(integrationId);
      resetMessages();

      const response = await fetch(`/api/integrations/${integrationId}/set-default`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setFormError(result.message || "Не удалось сделать интеграцию основной");
        return;
      }

      setFormSuccess("Основная интеграция обновлена.");
      await loadIntegrations();
    } catch {
      setFormError("Ошибка сети или сервера при обновлении основной интеграции");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeactivateIntegration(integrationId: string, integrationName: string) {
    const confirmed = window.confirm(
      `Отключить интеграцию "${integrationName}"? Она перестанет использоваться в новых операциях.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivatingId(integrationId);
      resetMessages();

      const response = await fetch(`/api/integrations/${integrationId}/deactivate`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setFormError(result.message || "Не удалось отключить интеграцию");
        return;
      }

      setFormSuccess("Интеграция отключена.");
      await loadIntegrations();
    } catch {
      setFormError("Ошибка сети или сервера при отключении интеграции");
    } finally {
      setDeactivatingId(null);
    }
  }

  async function handleDeleteIntegration(integrationId: string, integrationName: string) {
    const confirmed = window.confirm(
      `Удалить интеграцию "${integrationName}"? Это действие нельзя отменить.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(integrationId);
      resetMessages();

      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setFormError(result.message || "Не удалось удалить интеграцию");
        return;
      }

      setFormSuccess("Интеграция удалена.");
      await loadIntegrations();
    } catch {
      setFormError("Ошибка сети или сервера при удалении интеграции");
    } finally {
      setDeletingId(null);
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
              <div style={eyebrowStyle}>Step 1 / Integrations</div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.15,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Интеграции
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
                Подключи источник заказов. После этого выбери основную интеграцию и переходи к mappings.
              </p>
            </div>

            <div style={hintBoxStyle}>
              <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
                Что делать
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.6 }}>
                1. Ввести данные RetailCRM
                <br />
                2. Проверить подключение
                <br />
                3. Сохранить интеграцию
                <br />
                4. Выбрать основную
                <br />
                5. Перейти к mappings
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
            title="Всего интеграций"
            value={String(integrations.length)}
            description="Все сохранённые подключения компании"
          />
          <MetricCard
            title="Активных"
            value={String(activeCount)}
            description="Интеграции, которые можно использовать"
          />
          <MetricCard
            title="Основная"
            value={defaultIntegration?.name || "Не выбрана"}
            description="Эта интеграция используется по умолчанию"
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
            gap: "20px",
          }}
        >
          <div style={panelStyle}>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={sectionTitleStyle}>Новая интеграция</h2>
              <p style={sectionTextStyle}>{onboardingText}</p>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <Field
                label="Название интеграции"
                value={name}
                onChange={(value) => onAnyFieldChange(setName, value)}
                placeholder="Например, RetailCRM Main"
              />

              <Field
                label="Provider"
                value={provider}
                onChange={(value) => onAnyFieldChange(setProvider, value)}
                placeholder="retailcrm"
                disabled
              />

              <Field
                label="Base URL"
                value={baseUrl}
                onChange={(value) => onAnyFieldChange(setBaseUrl, value)}
                placeholder="https://example.retailcrm.ru"
              />

              <Field
                label="API key"
                value={apiKey}
                onChange={(value) => onAnyFieldChange(setApiKey, value)}
                placeholder="Вставь API key"
                type="password"
              />

              <Field
                label="Site"
                value={site}
                onChange={(value) => onAnyFieldChange(setSite, value)}
                placeholder="Необязательно, если RetailCRM использует site"
              />
            </div>

            <div style={infoBoxStyle}>
              Сначала нажми <b>Проверить подключение</b>. Сохраняй интеграцию только после успешной проверки.
            </div>

            {formError ? <div style={errorBoxStyle}>{formError}</div> : null}
            {formSuccess ? <div style={successBoxStyle}>{formSuccess}</div> : null}

            {testResult ? (
              <div
                style={{
                  marginTop: "16px",
                  border: "1px solid #bbf7d0",
                  background: "#f0fdf4",
                  borderRadius: "16px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#166534",
                    marginBottom: "8px",
                  }}
                >
                  Результат проверки
                </div>

                <div style={{ fontSize: "14px", color: "#166534", lineHeight: 1.7 }}>
                  Подключение: успешно
                  <br />
                  Заказов получено в тестовом запросе: {testResult.ordersFetched}
                  <br />
                  Всего заказов: {testResult.totalCount ?? "неизвестно"}
                  <br />
                  Всего страниц: {testResult.totalPageCount ?? "неизвестно"}
                </div>
              </div>
            ) : null}

            <div
              style={{
                marginTop: "18px",
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || isSaving}
                style={{
                  ...primaryButtonStyle,
                  background: isTesting ? "#93c5fd" : "#2563eb",
                  cursor: isTesting || isSaving ? "not-allowed" : "pointer",
                }}
              >
                {isTesting ? "Проверка..." : "Проверить подключение"}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isTesting}
                style={{
                  ...successButtonStyle,
                  background: isSaving ? "#86efac" : "#16a34a",
                  cursor: isSaving || isTesting ? "not-allowed" : "pointer",
                }}
              >
                {isSaving ? "Сохранение..." : "Сохранить интеграцию"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/settings")}
                disabled={isTesting || isSaving}
                style={secondaryButtonStyle}
              >
                Назад в настройки
              </button>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={{ marginBottom: "16px" }}>
              <h2 style={sectionTitleStyle}>Следующий шаг</h2>
              <p style={sectionTextStyle}>
                Когда интеграция сохранена и выбрана основная, переходи к mappings.
              </p>
            </div>

            <div style={mutedBoxStyle}>
              Минимально рабочий сценарий:
              <br />
              1. Есть хотя бы одна активная интеграция
              <br />
              2. Выбрана default-интеграция
              <br />
              3. После этого открываем mappings
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
                onClick={() => router.push("/settings/mappings")}
                style={primaryButtonStyle}
              >
                Перейти к mappings
              </button>

              <button
                type="button"
                onClick={() => router.push("/settings")}
                style={secondaryButtonStyle}
              >
                В настройки
              </button>
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={sectionTitleStyle}>Список интеграций</h2>
            <p style={sectionTextStyle}>
              Здесь видно, какая интеграция активна и какая выбрана основной.
            </p>
          </div>

          {loadingList ? (
            <div style={mutedBoxStyle}>Загрузка интеграций...</div>
          ) : listError ? (
            <div style={errorBoxStyle}>{listError}</div>
          ) : integrations.length === 0 ? (
            <div style={mutedBoxStyle}>
              Пока нет ни одной интеграции.
              <br />
              Начни с формы выше: подключи RetailCRM и проверь соединение.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {integrations.map((item) => {
                const isUpdating = updatingId === item.id;
                const isDeactivating = deactivatingId === item.id;
                const isDeleting = deletingId === item.id;

                return (
                  <div
                    key={item.id}
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
                            marginBottom: "6px",
                          }}
                        >
                          {item.name}
                        </div>

                        <div
                          style={{
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "#4b5563",
                            wordBreak: "break-word",
                          }}
                        >
                          Provider: {item.provider}
                          <br />
                          Base URL: {item.baseUrl || "—"}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <StatusBadge
                          text={item.isActive === false ? "Disabled" : "Active"}
                          tone={item.isActive === false ? "danger" : "success"}
                        />

                        {item.isDefault ? (
                          <StatusBadge text="Default" tone="primary" />
                        ) : null}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "14px",
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {!item.isDefault && item.isActive !== false ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(item.id)}
                          disabled={isUpdating || isDeactivating || isDeleting}
                          style={secondaryButtonStyle}
                        >
                          {isUpdating ? "Обновление..." : "Сделать основной"}
                        </button>
                      ) : null}

                      {item.isActive !== false ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivateIntegration(item.id, item.name)}
                          disabled={isUpdating || isDeactivating || isDeleting}
                          style={warningButtonStyle}
                        >
                          {isDeactivating ? "Отключение..." : "Отключить"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleDeleteIntegration(item.id, item.name)}
                        disabled={isUpdating || isDeactivating || isDeleting}
                        style={dangerButtonStyle}
                      >
                        {isDeleting ? "Удаление..." : "Удалить"}
                      </button>
                    </div>
                  </div>
                );
              })}
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
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#374151",
        }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          height: "44px",
          borderRadius: "12px",
          border: "1px solid #d1d5db",
          padding: "0 12px",
          fontSize: "14px",
          outline: "none",
          color: "#111827",
          background: disabled ? "#f3f4f6" : "#ffffff",
          WebkitTextFillColor: "#111827",
        }}
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
  tone: "success" | "danger" | "primary";
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

const successButtonStyle: React.CSSProperties = {
  height: "44px",
  borderRadius: "12px",
  border: "none",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  padding: "0 16px",
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

const warningButtonStyle: React.CSSProperties = {
  height: "44px",
  borderRadius: "12px",
  border: "1px solid #fcd34d",
  background: "#fffbeb",
  color: "#92400e",
  fontSize: "14px",
  fontWeight: 700,
  padding: "0 16px",
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  height: "44px",
  borderRadius: "12px",
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: "14px",
  fontWeight: 700,
  padding: "0 16px",
  cursor: "pointer",
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: "16px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  lineHeight: 1.5,
};

const successBoxStyle: React.CSSProperties = {
  marginTop: "16px",
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  color: "#065f46",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
  lineHeight: 1.5,
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
  marginTop: "18px",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: 1.6,
};