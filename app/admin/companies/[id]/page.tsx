"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type CompanyUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
};

type CompanyDetail = {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
  owner: {
    email: string;
    fullName: string;
  } | null;
  users: CompanyUser[];
  integrations: Array<{
    id: string;
    name: string;
    provider: string;
    isActive: boolean;
  }>;
};

export default function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/companies/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message || "Ошибка загрузки компании");
          return;
        }

        setCompany(data.data);
      })
      .catch(() => {
        setError("Ошибка сети");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (error) {
    return (
      <div
        style={{
          color: "#b91c1c",
          fontSize: "14px",
        }}
      >
        {error}
      </div>
    );
  }

  if (!company) {
    return (
      <div
        style={{
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Компания не найдена
      </div>
    );
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <Link
            href="/admin/companies"
            style={{
              color: "#4338ca",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            ← Назад к компаниям
          </Link>

          <h1
            style={{
              margin: "12px 0 0",
              fontSize: "30px",
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#111827",
            }}
          >
            {company.name}
          </h1>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "38px",
            padding: "0 14px",
            borderRadius: "999px",
            background: company.isActive ? "#ecfdf5" : "#fef2f2",
            color: company.isActive ? "#15803d" : "#b91c1c",
            fontSize: "14px",
            fontWeight: 800,
          }}
        >
          {company.isActive ? "Active" : "Disabled"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={cardStyle}
        >
          <div style={cardLabelStyle}>ID компании</div>
          <div style={cardValueStyle}>{company.id}</div>
        </div>

        <div
          style={cardStyle}
        >
          <div style={cardLabelStyle}>Дата создания</div>
          <div style={cardValueStyle}>
            {new Date(company.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div
          style={cardStyle}
        >
          <div style={cardLabelStyle}>Owner</div>
          <div style={cardValueStyle}>
            {company.owner?.fullName || "—"}
          </div>
          <div
            style={{
              marginTop: "6px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            {company.owner?.email || "—"}
          </div>
        </div>
      </div>

      <div
        style={sectionStyle}
      >
        <h2 style={sectionTitleStyle}>Пользователи компании</h2>

        <div
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          {company.users.length === 0 ? (
            <div
              style={{
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Пользователи не найдены
            </div>
          ) : (
            company.users.map((user) => (
              <div
                key={user.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 120px 120px",
                  gap: "12px",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#111827",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    {user.fullName}
                  </div>
                </div>

                <div
                  style={{
                    color: "#374151",
                    fontSize: "15px",
                  }}
                >
                  {user.email}
                </div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "15px",
                    textTransform: "capitalize",
                  }}
                >
                  {user.role}
                </div>

                <div
                  style={{
                    color: user.isActive ? "#15803d" : "#b91c1c",
                    fontWeight: 700,
                    fontSize: "15px",
                  }}
                >
                  {user.isActive ? "Active" : "Disabled"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={sectionStyle}
      >
        <h2 style={sectionTitleStyle}>Интеграции компании</h2>

        <div
          style={{
            marginTop: "16px",
          }}
        >
          {company.integrations.length === 0 ? (
            <div
              style={{
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Интеграции пока не подключены
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {company.integrations.map((integration) => (
                <div
                  key={integration.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 120px",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      color: "#111827",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    {integration.name}
                  </div>

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "15px",
                      textTransform: "capitalize",
                    }}
                  >
                    {integration.provider}
                  </div>

                  <div
                    style={{
                      color: integration.isActive ? "#15803d" : "#b91c1c",
                      fontWeight: 700,
                      fontSize: "15px",
                    }}
                  >
                    {integration.isActive ? "Active" : "Disabled"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 800,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const cardValueStyle: React.CSSProperties = {
  marginTop: "10px",
  fontSize: "18px",
  fontWeight: 800,
  color: "#111827",
  lineHeight: 1.4,
};

const sectionStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "22px",
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 900,
  color: "#111827",
};