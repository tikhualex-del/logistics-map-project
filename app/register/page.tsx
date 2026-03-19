"use client";

import { useState } from "react";

export default function RegisterPage() {
    const [companyName, setCompanyName] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError("");
        setSuccessMessage("");

        if (!companyName.trim() || !fullName.trim() || !email.trim() || !password.trim()) {
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
                    companyName,
                    fullName,
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || "Не удалось зарегистрироваться");
                return;
            }

            setSuccessMessage("Аккаунт успешно создан");
            setCompanyName("");
            setFullName("");
            setEmail("");
            setPassword("");
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
                    Регистрация
                </h1>

                <p
                    style={{
                        margin: 0,
                        marginBottom: "20px",
                        fontSize: "14px",
                        color: "#6b7280",
                        lineHeight: 1.5,
                    }}
                >
                    Создай компанию и owner-аккаунт для входа в систему.
                </p>

                <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
                    <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                            Название компании
                        </span>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Например, My Logistics"
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
                    </label>

                    <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                            Полное имя
                        </span>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Например, Oleg Ivanov"
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
                    </label>

                    <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                            Email
                        </span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Например, you@test.com"
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
                    </label>

                    <label style={{ display: "grid", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                            Пароль
                        </span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль"
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
                    </label>

                    {error ? (
                        <div
                            style={{
                                borderRadius: "12px",
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#b91c1c",
                                padding: "12px",
                                fontSize: "14px",
                                lineHeight: 1.4,
                            }}
                        >
                            {error}
                        </div>
                    ) : null}

                    {successMessage ? (
                        <div
                            style={{
                                borderRadius: "12px",
                                background: "#ecfdf5",
                                border: "1px solid #bbf7d0",
                                color: "#166534",
                                padding: "12px",
                                fontSize: "14px",
                                lineHeight: 1.4,
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
                            border: "none",
                            borderRadius: "12px",
                            background: loading ? "#93c5fd" : "#2563eb",
                            color: "#ffffff",
                            fontSize: "15px",
                            fontWeight: 700,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Создание..." : "Create account"}
                    </button>
                </form>
            </div>
        </main>
    );
}