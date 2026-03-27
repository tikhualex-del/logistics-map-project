"use client";

import Link from "next/link";
import { useEffect, useState } from "react";


type AdminStats = {
  companiesCount: number;
  activeCompaniesCount: number;
  disabledCompaniesCount: number;
  usersCount: number;
  activeUsersCount: number;
  disabledUsersCount: number;
  integrationsCount: number;
};

const statCards = [
  {
    key: "companiesCount",
    title: "Компании",
    hint: "Всего tenant-компаний",
    href: "/admin/companies",
  },
  {
    key: "usersCount",
    title: "Пользователи",
    hint: "Все owner и staff аккаунты",
    href: "/admin/users",
  },
  {
    key: "integrationsCount",
    title: "Интеграции",
    hint: "Подключённые integration records",
    href: "/admin/integrations",
  },
  {
    key: "disabledCompaniesCount",
    title: "Disabled companies",
    hint: "Компании с отключённым доступом",
    href: "/admin/companies",
  },
] as const;

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message || "Ошибка загрузки статистики");
          return;
        }

        setStats(data.data);
      })
      .catch(() => {
        setError("Ошибка сети при загрузке статистики");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main
      style={{
        display: "grid",
        gap: "24px",
      }}
    >
      <section
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: "28px",
          padding: "32px",
          color: "#ffffff",
          boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "28px",
            padding: "0 12px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.14)",
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Internal Admin
        </div>

        <h1
          style={{
            margin: "18px 0 12px",
            fontSize: "40px",
            lineHeight: 1.05,
            fontWeight: 900,
          }}
        >
          SaaS Control Panel
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: "760px",
            color: "rgba(255,255,255,0.82)",
            fontSize: "17px",
            lineHeight: 1.7,
          }}
        >
          Внутренняя панель управления платформой для контроля компаний,
          пользователей, интеграций и операционных процессов.
        </p>
      </section>

      {error ? (
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
      ) : null}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "18px",
        }}
      >
        {statCards.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "22px",
              padding: "22px",
              boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
              textDecoration: "none",
              display: "block",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                marginTop: "12px",
                fontSize: "34px",
                lineHeight: 1,
                fontWeight: 900,
                color: "#111827",
              }}
            >
              {loading || !stats ? "—" : stats[item.key]}
            </div>

            <div
              style={{
                marginTop: "10px",
                fontSize: "14px",
                lineHeight: 1.5,
                color: "#6b7280",
              }}
            >
              {item.hint}
            </div>
          </Link>
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "18px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "22px",
            boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Active users
          </div>

          <div
            style={{
              marginTop: "12px",
              fontSize: "28px",
              fontWeight: 900,
              color: "#15803d",
            }}
          >
            {loading || !stats ? "—" : stats.activeUsersCount}
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "22px",
            boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Disabled users
          </div>

          <div
            style={{
              marginTop: "12px",
              fontSize: "28px",
              fontWeight: 900,
              color: "#b91c1c",
            }}
          >
            {loading || !stats ? "—" : stats.disabledUsersCount}
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "20px",
            padding: "22px",
            boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Active companies
          </div>

          <div
            style={{
              marginTop: "12px",
              fontSize: "28px",
              fontWeight: 900,
              color: "#15803d",
            }}
          >
            {loading || !stats ? "—" : stats.activeCompaniesCount}
          </div>
        </div>
      </section>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "24px",
            lineHeight: 1.2,
            fontWeight: 800,
            color: "#111827",
          }}
        >
          Следующие разделы
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
            marginTop: "20px",
          }}
        >
          {[
            "Компании",
            "Пользователи",
            "Интеграции",
            "Cron / Import Jobs",
            "System errors",
            "Support actions",
          ].map((item) => (
            <div
              key={item}
              style={{
                borderRadius: "16px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                padding: "16px 18px",
                fontSize: "15px",
                fontWeight: 700,
                color: "#1f2937",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}