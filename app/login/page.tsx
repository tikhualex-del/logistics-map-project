"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const emailFromQuery = searchParams.get("email") || "";
    const isRegistered = searchParams.get("registered") === "1";

    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }

    if (isRegistered) {
      setSuccessMessage(
        "Аккаунт создан. Войди под owner-данными, чтобы перейти к настройке компании."
      );
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccessMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Заполни email и пароль");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Ошибка входа");
        return;
      }

      const nextPath = searchParams.get("next");

      if (nextPath && nextPath.startsWith("/")) {
        router.push(nextPath);
        return;
      }

      router.push("/settings");
    } catch {
      setError("Ошибка сети или сервера");
    } finally {
      setLoading(false);
    }
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
          maxWidth: "480px",
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
            Вход
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
            Войди в свой аккаунт и продолжи настройку компании.
          </p>
        </div>

        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "14px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            color: "#4b5563",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          После входа следующий шаг: открыть настройки и подключить первую интеграцию.
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
              Email
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
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
              placeholder="Пароль"
              autoComplete="current-password"
              disabled={loading}
              style={inputStyle}
            />
          </label>

          {error && (
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
          )}

          {successMessage && (
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
          )}

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
            {loading ? "Вход..." : "Войти"}
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