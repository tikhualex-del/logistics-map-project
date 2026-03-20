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

  if (loading) {
    return (
      <main style={{ padding: "24px" }}>
        <div>Загрузка интеграций...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "24px" }}>
        <div style={{ color: "#b91c1c" }}>{error}</div>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px", display: "grid", gap: "20px" }}>
      <h1
        style={{
          margin: 0,
          fontSize: "28px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Интеграции
      </h1>

      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          background: "#ffffff",
          display: "grid",
          gap: "12px",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
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
          style={{
            height: "40px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            padding: "0 12px",
            fontSize: "14px",
            outline: "none",
          }}
        />

        <input
          type="text"
          placeholder="Provider (например: retailcrm)"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          style={{
            height: "40px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            padding: "0 12px",
            fontSize: "14px",
            outline: "none",
          }}
        />

        <input
          type="text"
          placeholder="Base URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          style={{
            height: "40px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            padding: "0 12px",
            fontSize: "14px",
            outline: "none",
          }}
        />

        <textarea
          placeholder='Credentials JSON, например: {"apiKey":"test","apiUrl":"https://example.com"}'
          value={credentialsJson}
          onChange={(e) => setCredentialsJson(e.target.value)}
          style={{
            minHeight: "120px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            padding: "12px",
            fontSize: "14px",
            outline: "none",
            resize: "vertical",
          }}
        />

        <button
          type="button"
          onClick={handleCreateIntegration}
          disabled={creating}
          style={{
            height: "42px",
            border: "none",
            borderRadius: "10px",
            background: "#0f4bb8",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: creating ? "not-allowed" : "pointer",
            opacity: creating ? 0.7 : 1,
          }}
        >
          {creating ? "Создаём..." : "Создать интеграцию"}
        </button>
      </section>

      {integrations.length === 0 ? (
        <div style={{ color: "#6b7280" }}>Интеграций пока нет</div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {integrations.map((integration) => (
            <div
              key={integration.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "16px",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "#111827",
                  }}
                >
                  {integration.name}
                </div>

                {integration.isDefault ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      height: "28px",
                      padding: "0 10px",
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
                    disabled={updatingId === integration.id}
                    style={{
                      height: "32px",
                      padding: "0 12px",
                      border: "none",
                      borderRadius: "10px",
                      background: "#0f4bb8",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor:
                        updatingId === integration.id ? "not-allowed" : "pointer",
                      opacity: updatingId === integration.id ? 0.7 : 1,
                    }}
                  >
                    {updatingId === integration.id
                      ? "Сохраняем..."
                      : "Сделать default"}
                  </button>
                )}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Provider: {integration.provider}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Base URL: {integration.baseUrl || "—"}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Active: {integration.isActive ? "Yes" : "No"}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Default: {integration.isDefault ? "Yes" : "No"}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                ID: {integration.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}