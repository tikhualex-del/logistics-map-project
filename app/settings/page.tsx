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

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyData, setCompanyData] = useState<MeResponseData | null>(null);

  async function loadMe() {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
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

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        setError("");

        const me = await loadMe();
        if (!me) return;

        setCompanyData(me);
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
            Центр управления настройками компании.
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

            <HubCard
              title="Склады"
              description="Управление складами вынесено в отдельный раздел."
              buttonText="Открыть склады"
              onClick={() => router.push("/settings/warehouses")}
            />

            <HubCard
              title="Интеграции"
              description="Управление интеграциями вынесено в отдельный раздел."
              buttonText="Открыть интеграции"
              onClick={() => router.push("/settings/integrations")}
            />

            <HubCard
              title="Integration mappings"
              description="Управление mappings вынесено в отдельный раздел."
              buttonText="Открыть mappings"
              onClick={() => router.push("/settings/mappings")}
            />

            <HubCard
              title="Заказы"
              description="Управление заказами вынесено в отдельный раздел."
              buttonText="Открыть заказы"
              onClick={() => router.push("/settings/orders")}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}

type HubCardProps = {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
};

function HubCard({ title, description, buttonText, onClick }: HubCardProps) {
  return (
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
        {title}
      </div>

      <div style={{ fontSize: "14px", color: "#4b5563" }}>
        {description}
      </div>

      <button
        type="button"
        onClick={onClick}
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
        {buttonText}
      </button>
    </div>
  );
}