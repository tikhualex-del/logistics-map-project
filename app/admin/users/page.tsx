"use client";

import { useEffect, useState } from "react";

type UserItem = {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  statusLoading?: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.message || "Ошибка загрузки");
          return;
        }

        setUsers(data.data);
      })
      .catch(() => {
        setError("Ошибка сети");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredUsers = users.filter((user) => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return true;
    }

    return (
      user.fullName.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      user.companyName.toLowerCase().includes(normalizedSearch)
    );
  });

  async function handleToggleUserStatus(userId: string) {
    try {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, statusLoading: true } : user
        )
      );

      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Не удалось изменить статус пользователя");

        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, statusLoading: false } : user
          )
        );

        return;
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
              ...user,
              isActive: data.data.isActive,
              statusLoading: false,
            }
            : user
        )
      );
    } catch {
      setError("Ошибка сети при изменении статуса пользователя");

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, statusLoading: false } : user
        )
      );
    }
  }

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div style={{ color: "#b91c1c" }}>{error}</div>;

  return (
    <div
      style={{
        display: "grid",
        gap: "16px",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 900,
          color: "#111827",
        }}
      >
        Пользователи
      </h1>

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
          placeholder="Поиск по имени, email или компании"
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
            gridTemplateColumns: "1.1fr 1.2fr 1fr 120px 120px 140px",
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
            Имя
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
            Email
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
            Компания
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
            Роль
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
            Действие
          </div>
        </div>

        {filteredUsers.length === 0 ? (
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
            Пользователи не найдены
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              style={{
                padding: "16px",
                borderBottom: "1px solid #f1f5f9",
                display: "grid",
                gridTemplateColumns: "1.1fr 1.2fr 1fr 120px 120px 140px",
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
                    lineHeight: 1.4,
                    fontWeight: 700,
                  }}
                >
                  {user.fullName}
                </div>

                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    lineHeight: 1.4,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {user.id}
                </div>
              </div>

              <div
                style={{
                  color: "#374151",
                  fontSize: "15px",
                  lineHeight: 1.4,
                }}
              >
                {user.email}
              </div>

              <div
                style={{
                  color: "#374151",
                  fontSize: "15px",
                  lineHeight: 1.4,
                }}
              >
                {user.companyName}
              </div>

              <div
                style={{
                  color: "#6b7280",
                  fontSize: "15px",
                  lineHeight: 1.4,
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
              <button
                type="button"
                onClick={() => handleToggleUserStatus(user.id)}
                disabled={user.statusLoading}
                style={{
                  height: "36px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: user.isActive
                    ? "1px solid #fecaca"
                    : "1px solid #bbf7d0",
                  background: user.isActive ? "#fef2f2" : "#f0fdf4",
                  color: user.isActive ? "#b91c1c" : "#15803d",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: user.statusLoading ? "not-allowed" : "pointer",
                }}
              >
                {user.statusLoading
                  ? "Сохраняем..."
                  : user.isActive
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}