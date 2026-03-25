"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccessMessage("");

    const normalizedCompanyName = companyName.trim();
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (
      !normalizedCompanyName ||
      !normalizedFullName ||
      !normalizedEmail ||
      !normalizedPassword
    ) {
      setError("Заполни все поля");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: normalizedCompanyName,
          fullName: normalizedFullName,
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Не удалось зарегистрироваться");
        return;
      }

      setSuccessMessage(
        "Компания и owner-аккаунт созданы. Сейчас перенаправим на вход."
      );

      const query = new URLSearchParams({
        registered: "1",
        email: normalizedEmail,
      });

      setTimeout(() => {
        router.push(`/login?${query.toString()}`);
      }, 1200);
    } catch {
      setError("Ошибка сети или сервера");
    } finally {
      setLoading(false);
    }
  }

  function handleGoToLogin() {
    const normalizedEmail = email.trim().toLowerCase();
    const query = new URLSearchParams();

    if (normalizedEmail) {
      query.set("email", normalizedEmail);
    }

    query.set("registered", "1");

    router.push(`/login?${query.toString()}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              lineHeight: 1.2,
              color: "#111827",
              fontWeight: 800,
            }}
          >
            Регистрация
          </h1>

          <p
            style={{
              marginTop: "10px",
              marginBottom: 0,
              color: "#4b5563",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Создай компанию и owner-аккаунт для входа в систему.
          </p>
        </div>

        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "14px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Что будет дальше
          </div>

          <ol
            style={{
              margin: 0,
              paddingLeft: "18px",
              color: "#4b5563",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            <li>Создаётся компания и owner-аккаунт</li>
            <li>Ты входишь в систему</li>
            <li>Подключаешь интеграцию</li>
            <li>Начинаешь загружать заказы и работать с картой</li>
          </ol>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Название компании
            </span>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Например, My Logistics"
              autoComplete="organization"
              disabled={loading}
              style={inputStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Полное имя
            </span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Например, Oleg Ivanov"
              autoComplete="name"
              disabled={loading}
              style={inputStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Email
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Например, you@test.com"
              autoComplete="email"
              disabled={loading}
              style={inputStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#374151",
              }}
            >
              Пароль
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              autoComplete="new-password"
              disabled={loading}
              style={inputStyle}
            />
          </label>

          {error ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                borderRadius: "12px",
                padding: "12px 14px",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: "46px",
              borderRadius: "12px",
              border: "none",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Создание..." : "Создать аккаунт"}
          </button>

          <button
            type="button"
            onClick={handleGoToLogin}
            disabled={loading}
            style={{
              height: "44px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Уже есть аккаунт? Перейти ко входу
          </button>
        </form>
      </div>
    </main>
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