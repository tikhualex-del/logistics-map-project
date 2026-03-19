"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CabinetData = {
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
    session: {
        id: string;
        expiresAt: string;
    };
};

export default function CabinetPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState<CabinetData | null>(null);
    const [logoutLoading, setLogoutLoading] = useState(false);


    useEffect(() => {
        async function loadCurrentUser() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch("/api/auth/me", {
                    method: "GET",
                    cache: "no-store",
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    setData(null);

                    if (response.status === 401) {
                        router.replace("/login");
                        return;
                    }

                    setError(result.message || "Не удалось загрузить кабинет");
                    return;
                }

                setData(result.data);
            } catch {
                setError("Ошибка загрузки кабинета");
                setData(null);
            } finally {
                setLoading(false);
            }
        }

        loadCurrentUser();
    }, []);

    async function handleLogout() {
        try {
            setLogoutLoading(true);

            const response = await fetch("/api/auth/logout", {
                method: "POST",
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(result.message || "Не удалось выйти");
                return;
            }

            setData(null);
            setError("");
            router.replace("/login");
        } catch {
            alert("Ошибка сети или сервера");
        } finally {
            setLogoutLoading(false);
        }
    }

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
                    maxWidth: "760px",
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
                        Личный кабинет
                    </h1>

                    <p
                        style={{
                            margin: 0,
                            color: "#6b7280",
                            fontSize: "14px",
                            lineHeight: 1.5,
                        }}
                    >
                        Первая защищённая страница SaaS MVP. Здесь мы проверяем текущую
                        сессию и показываем данные пользователя и компании.
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
                            fontSize: "15px",
                        }}
                    >
                        Загрузка данных кабинета...
                    </div>
                ) : error ? (
                    <div
                        style={{
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "18px",
                            padding: "24px",
                            display: "grid",
                            gap: "12px",
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

                        <div
                            style={{
                                fontSize: "14px",
                                color: "#4b5563",
                                lineHeight: 1.5,
                            }}
                        >
                            Чтобы увидеть кабинет, сначала войди в систему через страницу
                            <strong> /login</strong>.
                        </div>
                    </div>
                ) : data ? (
                    <>
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
                                Пользователь
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gap: "10px",
                                }}
                            >
                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    <strong>ID:</strong> {data.user.id}
                                </div>
                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    <strong>Имя:</strong> {data.user.fullName}
                                </div>
                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    <strong>Email:</strong> {data.user.email}
                                </div>
                            </div>
                        </div>

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
                                Компания
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gap: "10px",
                                }}
                            >
                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    <strong>ID:</strong> {data.company.id}
                                </div>
                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    <strong>Название:</strong> {data.company.name}
                                </div>
                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    <strong>Таймзона:</strong> {data.company.timezone}
                                </div>
                            </div>
                        </div>

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
                                Сессия
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gap: "10px",
                                }}
                            >
                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    <strong>Session ID:</strong> {data.session.id}
                                </div>
                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    <strong>Действует до:</strong> {data.session.expiresAt}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={logoutLoading}
                                style={{
                                    marginTop: "8px",
                                    width: "220px",
                                    height: "44px",
                                    border: "none",
                                    borderRadius: "12px",
                                    background: logoutLoading ? "#fca5a5" : "#dc2626",
                                    color: "#ffffff",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    cursor: logoutLoading ? "not-allowed" : "pointer",
                                }}
                            >
                                {logoutLoading ? "Выход..." : "Выйти из системы"}
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </main>
    );
}