"use client";

import { useEffect, useState } from "react";

type ImportMonitoringItem = {
  id: string;
  integrationName: string;
  provider: string;
  companyId: string;
  companyName: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  ordersCount: number;
  hasImportedOrders: boolean;
  lastOrderUpdateAt: string | null;
};

export default function AdminImportMonitoringPage() {
  const [items, setItems] = useState<ImportMonitoringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState<null | {
    success: boolean;
    totalIntegrations: number;
    successCount: number;
    failedCount: number;
    results: Array<{
      integrationId: string;
      companyId: string;
      name: string;
      success: boolean;
      error?: string;
    }>;
  }>(null);

  useEffect(() => {
    fetch("/api/admin/import-monitoring", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message || "Ошибка загрузки import monitoring");
          return;
        }

        setItems(data.data);
      })
      .catch(() => {
        setError("Ошибка сети при загрузке import monitoring");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredItems = items.filter((item) => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return true;
    }

    return (
      item.companyName.toLowerCase().includes(normalizedSearch) ||
      item.integrationName.toLowerCase().includes(normalizedSearch) ||
      item.provider.toLowerCase().includes(normalizedSearch)
    );
  });

  async function handleRunImport() {
    try {
      setRunLoading(true);
      setRunResult(null);
      setError("");

      const response = await fetch("/api/admin/import-monitoring/run", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Не удалось запустить импорт");
        return;
      }

      setRunResult({
        success: data.success,
        totalIntegrations: data.totalIntegrations,
        successCount: data.successCount,
        failedCount: data.failedCount,
        results: Array.isArray(data.results) ? data.results : [],
      });

      const refreshResponse = await fetch("/api/admin/import-monitoring", {
        credentials: "include",
      });

      const refreshData = await refreshResponse.json();

      if (refreshResponse.ok && refreshData.success) {
        setItems(refreshData.data);
      }
    } catch {
      setError("Ошибка сети при запуске импорта");
    } finally {
      setRunLoading(false);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  function getImportState(item: ImportMonitoringItem) {
    if (!item.isActive) {
      return {
        label: "Disabled",
        color: "#b91c1c",
        background: "#fef2f2",
      };
    }

    if (item.hasImportedOrders) {
      return {
        label: "Has data",
        color: "#15803d",
        background: "#ecfdf5",
      };
    }

    return {
      label: "No imports yet",
      color: "#92400e",
      background: "#fffbeb",
    };
  }

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return (
      <div
        style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          borderRadius: "16px",
          padding: "14px 16px",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        {error}
      </div>
    );
  }

  {
    {
      runResult ? (
        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: runResult.failedCount === 0 ? "#ecfdf5" : "#fffbeb",
              border:
                runResult.failedCount === 0
                  ? "1px solid #bbf7d0"
                  : "1px solid #fde68a",
              color: runResult.failedCount === 0 ? "#166534" : "#92400e",
              borderRadius: "16px",
              padding: "14px 16px",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Импорт завершён. Интеграций: {runResult.totalIntegrations}, успешно:{" "}
            {runResult.successCount}, с ошибкой: {runResult.failedCount}.
          </div>

          {runResult.failedCount > 0 ? (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #fecaca",
                borderRadius: "16px",
                padding: "16px",
                display: "grid",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#b91c1c",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Ошибки запуска импорта
              </div>

              {runResult.results
                .filter((item) => !item.success)
                .map((item) => (
                  <div
                    key={item.integrationId}
                    style={{
                      border: "1px solid #fee2e2",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      background: "#fef2f2",
                      display: "grid",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {item.name}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                      }}
                    >
                      integrationId: {item.integrationId}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "#b91c1c",
                        lineHeight: 1.6,
                      }}
                    >
                      {item.error || "Unknown error"}
                    </div>
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      ) : null
    }
  }

  return (
    <main
      style={{
        display: "grid",
        gap: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#111827",
            }}
          >
            Import Monitoring
          </h1>

          <p
            style={{
              marginTop: "10px",
              marginBottom: 0,
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#6b7280",
            }}
          >
            Мониторинг активных retailCRM-интеграций и состояния импортированных
            заказов.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunImport}
          disabled={runLoading}
          style={{
            height: "44px",
            padding: "0 16px",
            borderRadius: "12px",
            border: "none",
            background: "#4338ca",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 800,
            cursor: runLoading ? "not-allowed" : "pointer",
            boxShadow: "0 10px 24px rgba(67,56,202,0.20)",
          }}
        >
          {runLoading ? "Запускаем..." : "Run import now"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по компании, интеграции или provider"
          style={{
            width: "100%",
            maxWidth: "420px",
            height: "44px",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            padding: "0 14px",
            fontSize: "14px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #e5e7eb",
            display: "grid",
            gridTemplateColumns: "1.2fr 1.1fr 120px 120px 160px 160px",
            alignItems: "center",
            gap: "12px",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Компания / Интеграция
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Provider
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Статус
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Orders
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Last order update
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Import state
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: 1.6,
              background: "#ffffff",
            }}
          >
            Ничего не найдено
          </div>
        ) : (
          filteredItems.map((item) => {
            const importState = getImportState(item);

            return (
              <div
                key={item.id}
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "grid",
                  gridTemplateColumns:
                    "1.2fr 1.1fr 120px 120px 160px 160px",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      color: "#111827",
                      fontSize: "15px",
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.companyName}
                  </div>

                  <div
                    style={{
                      color: "#374151",
                      fontSize: "14px",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.integrationName}
                  </div>

                  <div
                    style={{
                      color: "#9ca3af",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {item.id}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      color: "#374151",
                      fontSize: "15px",
                      lineHeight: 1.4,
                      textTransform: "capitalize",
                    }}
                  >
                    {item.provider}
                  </div>

                  <div
                    style={{
                      color: "#9ca3af",
                      fontSize: "12px",
                    }}
                  >
                    {item.isDefault ? "Default integration" : "Secondary"}
                  </div>
                </div>

                <div
                  style={{
                    color: item.isActive ? "#15803d" : "#b91c1c",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  {item.isActive ? "Active" : "Disabled"}
                </div>

                <div
                  style={{
                    color: "#111827",
                    fontWeight: 800,
                    fontSize: "15px",
                  }}
                >
                  {item.ordersCount}
                </div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  {formatDate(item.lastOrderUpdateAt)}
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: "32px",
                      padding: "0 12px",
                      borderRadius: "999px",
                      background: importState.background,
                      color: importState.color,
                      fontSize: "13px",
                      fontWeight: 800,
                    }}
                  >
                    {importState.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}