"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const benefits = [
  "Быстрый запуск без сложной настройки",
  "Единая карта заказов и маршрутов",
  "Интеграции и AI-инструменты для логистики",
];

type InputWithFakePlaceholderProps = {
  value: string;
  onChange: (value: string) => void;
  fakePlaceholder: string;
  autoComplete?: string;
  disabled?: boolean;
  type?: string;
};

function InputWithFakePlaceholder({
  value,
  onChange,
  fakePlaceholder,
  autoComplete,
  disabled,
  type = "text",
}: InputWithFakePlaceholderProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      {!value ? (
        <span
          style={{
            position: "absolute",
            left: "18px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#c9cfdb",
            fontSize: "15px",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {fakePlaceholder}
        </span>
      ) : null}

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        style={inputStyle}
      />
    </div>
  );
}

function translateRegisterError(message: string) {
  switch (message) {
    case "User with this email already exists":
      return "Пользователь с таким email уже существует";
    case "Registration failed":
      return "Не удалось зарегистрироваться";
    case "companyName, fullName, email and password are required":
      return "Необходимо заполнить название компании, имя, email и пароль";
    default:
      return message;
  }
}

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
        setError(
          translateRegisterError(data.message || "Не удалось зарегистрироваться")
        );
        return;
      }

      setSuccessMessage(
        "Компания и owner-аккаунт созданы. Выполняем вход в систему..."
      );

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok || !loginData.success) {
        setSuccessMessage("");
        setError("Аккаунт создан, но не удалось выполнить автоматический вход");
        return;
      }

      setTimeout(() => {
        router.push("/settings");
      }, 800);
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
        background: "#f3f5fb",
        padding: "32px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1320px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 520px",
          gap: "48px",
          alignItems: "stretch",
        }}
      >
        <section
          style={{
            background: "#edf1fb",
            borderRadius: "36px",
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "900px",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "36px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "16px",
                  background: "#4338ca",
                  boxShadow: "0 12px 24px rgba(67,56,202,0.20)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "20px",
                  fontWeight: 900,
                }}
              >
                ✦
              </div>

              <div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.1,
                  }}
                >
                  Логистический центр
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    height: "22px",
                    padding: "0 10px",
                    borderRadius: "999px",
                    background: "#e0e7ff",
                    color: "#4338ca",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Logistics SaaS
                </div>
              </div>
            </div>

            <h1
              style={{
                margin: 0,
                maxWidth: "640px",
                fontSize: "68px",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              Создайте аккаунт и начните управлять доставкой в одном кабинете
            </h1>

            <p
              style={{
                marginTop: "28px",
                marginBottom: 0,
                maxWidth: "620px",
                color: "#5b6475",
                fontSize: "20px",
                lineHeight: 1.65,
              }}
            >
              Подключите CRM, загружайте заказы, работайте с картой и
              маршрутами в единой системе.
            </p>

            <div
              style={{
                marginTop: "44px",
                display: "grid",
                gap: "22px",
                maxWidth: "560px",
              }}
            >
              {benefits.map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      minWidth: "48px",
                      borderRadius: "999px",
                      background: "#dfe8ff",
                      color: "#4338ca",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: 800,
                    }}
                  >
                    {index === 0 ? "↗" : index === 1 ? "◉" : "✦"}
                  </div>

                  <div
                    style={{
                      color: "#0f172a",
                      fontSize: "18px",
                      lineHeight: 1.4,
                      fontWeight: 700,
                    }}
                  >
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              background: "#ffffff",
              borderRadius: "36px",
              padding: "44px 38px 34px",
              boxSizing: "border-box",
              boxShadow: "0 24px 60px rgba(15,23,42,0.06)",
              border: "1px solid rgba(229,231,235,0.72)",
            }}
          >
            <div style={{ marginBottom: "28px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.15,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Регистрация
              </h2>

              <p
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  color: "#4b5563",
                  fontSize: "15px",
                  lineHeight: 1.6,
                }}
              >
                Создайте рабочее пространство для вашей компании
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              <label
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Название компании
                </span>

                <InputWithFakePlaceholder
                  value={companyName}
                  onChange={setCompanyName}
                  fakePlaceholder="ООО Логистик Групп"
                  autoComplete="organization"
                  disabled={loading}
                />
              </label>

              <label
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Ваше имя
                </span>

                <InputWithFakePlaceholder
                  value={fullName}
                  onChange={setFullName}
                  fakePlaceholder="Александр Петров"
                  autoComplete="name"
                  disabled={loading}
                />
              </label>

              <label
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Email
                </span>

                <InputWithFakePlaceholder
                  value={email}
                  onChange={setEmail}
                  fakePlaceholder="alex@company.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </label>

              <label
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Пароль
                </span>

                <InputWithFakePlaceholder
                  value={password}
                  onChange={setPassword}
                  fakePlaceholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  type="password"
                />

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#c0c7d6",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Минимум 8 символов
                </span>
              </label>

              <div
                style={{
                  display: "grid",
                  gap: "14px",
                  marginTop: "2px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#374151",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    cursor: "pointer",
                  }}
                >
                  <input type="checkbox" disabled={loading} />
                  <span>Я принимаю условия использования</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#374151",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    cursor: "pointer",
                  }}
                >
                  <input type="checkbox" disabled={loading} />
                  <span>Получать полезные обновления о продукте</span>
                </label>
              </div>

              {error ? (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    borderRadius: "16px",
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
                    borderRadius: "16px",
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
                  height: "58px",
                  borderRadius: "18px",
                  border: "none",
                  background: loading ? "#818cf8" : "#4338ca",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 14px 28px rgba(67,56,202,0.22)",
                  marginTop: "8px",
                }}
              >
                {loading ? "Создание..." : "Создать аккаунт"}
              </button>

              <button
                type="button"
                onClick={handleGoToLogin}
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#312e81",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  padding: 0,
                  marginTop: "4px",
                }}
              >
                Уже есть аккаунт? Войти
              </button>

              <div
                style={{
                  background: "#f3f6fd",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  color: "#1e3a8a",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  textAlign: "center",
                  marginTop: "4px",
                  border: "1px solid #e5ecfb",
                }}
              >
                14 дней бесплатного доступа. Банковская карта не требуется.
              </div>
            </form>

            <p
              style={{
                marginTop: "30px",
                marginBottom: 0,
                textAlign: "center",
                color: "#6b7280",
                fontSize: "13px",
                lineHeight: 1.7,
              }}
            >
              Регистрируясь, вы соглашаетесь с условиями использования и
              политикой конфиденциальности
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  height: "56px",
  borderRadius: "18px",
  border: "1px solid #e7ebf3",
  padding: "0 18px",
  fontSize: "15px",
  outline: "none",
  color: "#111827",
  background: "#f3f6fd",
  WebkitTextFillColor: "#111827",
  boxSizing: "border-box",
  width: "100%",
};
const inputClassName = "register-input";