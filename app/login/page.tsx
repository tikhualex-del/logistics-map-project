"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!email.trim() || !password.trim()) {
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
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Ошибка входа");
        return;
      }

      setSuccessMessage("Вход выполнен успешно");

      console.log("USER DATA:", data.data);
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: "8px",
            fontSize: "28px",
            fontWeight: 800,
            color: "#111827",
          }}
        >
          Вход
        </h1>

        <p
          style={{
            margin: 0,
            marginBottom: "20px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Войди в свой аккаунт
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              height: "44px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              padding: "0 12px",
              fontSize: "14px",
              outline: "none",
              color: "#111827",
              background: "#ffffff",
              WebkitTextFillColor: "#111827",
            }}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            style={{
              height: "44px",
              borderRadius: "12px",
              border: "1px solid #d1d5db",
              padding: "0 12px",
              fontSize: "14px",
              outline: "none",
              color: "#111827",
              background: "#ffffff",
              WebkitTextFillColor: "#111827",
            }}
          />

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "10px",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "10px",
                borderRadius: "10px",
                fontSize: "14px",
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
              color: "#fff",
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