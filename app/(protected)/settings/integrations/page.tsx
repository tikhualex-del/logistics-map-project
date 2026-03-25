"use client";

import { useEffect, useState } from "react";

type Integration = {
  id: string;
  name: string;
  provider: string;
  baseUrl: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [credentialsJson, setCredentialsJson] = useState("");

  async function loadIntegrations() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/integrations", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Не удалось загрузить интеграции");
        return;
      }

      setIntegrations(data.data || []);
    } catch {
      setError("Ошибка загрузки интеграций");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function handleSetDefault(integrationId: string) {
    try {
      setUpdatingId(integrationId);

      const res = await fetch(`/api/integrations/${integrationId}/set-default`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Не удалось сделать интеграцию default");
        return;
      }

      await loadIntegrations();
    } catch {
      alert("Ошибка при обновлении default-интеграции");
    } finally {
      setUpdatingId(null);
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

      const res = await fetch(`/api/integrations/${integrationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Не удалось удалить интеграцию");
        return;
      }

      await loadIntegrations();
    } catch {
      alert("Ошибка при удалении интеграции");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeactivateIntegration(
    integrationId: string,
    integrationName: string
  ) {
    const confirmed = window.confirm(
      `Деактивировать интеграцию "${integrationName}"? Она перестанет использоваться в новых операциях.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivatingId(integrationId);

      const res = await fetch(`/api/integrations/${integrationId}/deactivate`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Не удалось деактивировать интеграцию");
        return;
      }

      await loadIntegrations();
    } catch {
      alert("Ошибка при деактивации интеграции");
    } finally {
      setDeactivatingId(null);
    }
  }

  async function handleCreateIntegration() {
    try {
      if (!name.trim()) {
        alert("Введите name");
        return;
      }

      if (!provider.trim()) {
        alert("Введите provider");
        return;
      }

      if (!credentialsJson.trim()) {
        alert("Введите credentials JSON");
        return;
      }

      try {
        JSON.parse(credentialsJson);
      } catch {
        alert("credentials JSON должен быть валидным JSON");
        return;
      }

      setCreating(true);

      const res = await fetch("/api/integrations", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          provider: provider.trim(),
          baseUrl: baseUrl.trim(),
          credentialsEncryptedJson: credentialsJson.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Не удалось создать интеграцию");
        return;
      }

      setName("");
      setProvider("");
      setBaseUrl("");
      setCredentialsJson("");

      await loadIntegrations();
    } catch {
      alert("Ошибка при создании интеграции");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      style={{
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
          Интеграции
        </h1>

        <p
          style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          Управление интеграциями компании и выбором default-интеграции.
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
          Создать интеграцию
        </div>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Provider (например: retailcrm)"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Base URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder='Credentials JSON, например: {"apiKey":"test","site":"demo"}'
          value={credentialsJson}
          onChange={(e) => setCredentialsJson(e.target.value)}
          style={textareaStyle}
        />

        <button
          type="button"
          onClick={handleCreateIntegration}
          disabled={creating}
          style={{
            height: "46px",
            border: "none",
            borderRadius: "12px",
            background: creating ? "#93c5fd" : "#2563eb",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "Создание..." : "Создать интеграцию"}
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
          Список интеграций
        </div>

        {loading ? (
          <div style={{ fontSize: "14px", color: "#4b5563" }}>
            Загрузка интеграций...
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
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {integration.name}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {integration.isDefault ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: "30px",
                          padding: "0 12px",
                          borderRadius: "999px",
                          background: "#dbeafe",
                          color: "#1d4ed8",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        Default
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(integration.id)}
                        disabled={
                          updatingId === integration.id ||
                          deletingId === integration.id ||
                          deactivatingId === integration.id ||
                          !integration.isActive
                        }
                        style={{
                          height: "36px",
                          border: "none",
                          borderRadius: "10px",
                          background: "#2563eb",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor:
                            updatingId === integration.id ||
                              deletingId === integration.id ||
                              deactivatingId === integration.id ||
                              !integration.isActive
                              ? "not-allowed"
                              : "pointer",
                          padding: "0 14px",
                          opacity:
                            updatingId === integration.id ||
                              deletingId === integration.id ||
                              deactivatingId === integration.id ||
                              !integration.isActive
                              ? 0.7
                              : 1,
                        }}
                      >
                        {updatingId === integration.id ? "Сохранение..." : "Сделать default"}
                      </button>
                    )}

                    {!integration.isDefault && integration.isActive && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeactivateIntegration(integration.id, integration.name)
                        }
                        disabled={
                          deactivatingId === integration.id ||
                          deletingId === integration.id ||
                          updatingId === integration.id
                        }
                        style={{
                          height: "36px",
                          border: "none",
                          borderRadius: "10px",
                          background: "#f59e0b",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor:
                            deactivatingId === integration.id ||
                              deletingId === integration.id ||
                              updatingId === integration.id
                              ? "not-allowed"
                              : "pointer",
                          padding: "0 14px",
                          opacity:
                            deactivatingId === integration.id ||
                              deletingId === integration.id ||
                              updatingId === integration.id
                              ? 0.7
                              : 1,
                        }}
                      >
                        {deactivatingId === integration.id ? "Деактивация..." : "Деактивировать"}
                      </button>
                    )}

                    {!integration.isDefault && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteIntegration(integration.id, integration.name)
                        }
                        disabled={
                          deletingId === integration.id ||
                          updatingId === integration.id ||
                          deactivatingId === integration.id
                        }
                        style={{
                          height: "36px",
                          border: "none",
                          borderRadius: "10px",
                          background: "#dc2626",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor:
                            deletingId === integration.id ||
                              updatingId === integration.id ||
                              deactivatingId === integration.id
                              ? "not-allowed"
                              : "pointer",
                          padding: "0 14px",
                          opacity:
                            deletingId === integration.id ||
                              updatingId === integration.id ||
                              deactivatingId === integration.id
                              ? 0.7
                              : 1,
                        }}
                      >
                        {deletingId === integration.id ? "Удаление..." : "Удалить"}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: "14px", color: "#374151" }}>
                  <strong>Provider:</strong> {integration.provider}
                </div>

                <div style={{ fontSize: "14px", color: "#374151" }}>
                  <strong>Base URL:</strong> {integration.baseUrl || "не указан"}
                </div>

                <div style={{ fontSize: "14px", color: "#374151" }}>
                  <strong>Active:</strong> {integration.isActive ? "Yes" : "No"}
                </div>

                <div style={{ fontSize: "14px", color: "#374151" }}>
                  <strong>Default:</strong> {integration.isDefault ? "Yes" : "No"}
                </div>

                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  ID: {integration.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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