"use client";

import { useEffect, useState } from "react";

type IntegrationItem = {
    id: string;
    companyName: string;
    provider: string;
    name: string;
    isEnabled: boolean;
    createdAt: string;
};

export default function AdminIntegrationsPage() {
    const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/admin/integrations")
            .then((res) => res.json())
            .then((data) => {
                if (!data.success) {
                    setError(data.message || "Ошибка загрузки");
                    return;
                }

                setIntegrations(data.data);
            })
            .catch(() => {
                setError("Ошибка сети");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const filteredIntegrations = integrations.filter((integration) => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return true;
        }

        return (
            integration.companyName.toLowerCase().includes(normalizedSearch) ||
            integration.provider.toLowerCase().includes(normalizedSearch) ||
            integration.name.toLowerCase().includes(normalizedSearch)
        );
    });

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
                Интеграции
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
                    placeholder="Поиск по компании, провайдеру или названию"
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
                        gridTemplateColumns: "1.2fr 1fr 1fr 120px",
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
                        Провайдер
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
                        Название
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
                </div>

                {filteredIntegrations.length === 0 ? (
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
                        Интеграции не найдены
                    </div>
                ) : (
                    filteredIntegrations.map((integration) => (
                        <div
                            key={integration.id}
                            style={{
                                padding: "16px",
                                borderBottom: "1px solid #f1f5f9",
                                display: "grid",
                                gridTemplateColumns: "1.2fr 1fr 1fr 120px",
                                alignItems: "center",
                                gap: "12px",
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
                                {integration.companyName}
                            </div>

                            <div
                                style={{
                                    color: "#374151",
                                    fontSize: "15px",
                                    lineHeight: 1.4,
                                    textTransform: "capitalize",
                                }}
                            >
                                {integration.provider}
                            </div>

                            <div
                                style={{
                                    color: "#374151",
                                    fontSize: "15px",
                                    lineHeight: 1.4,
                                }}
                            >
                                {integration.name}
                            </div>

                            <div
                                style={{
                                    color: integration.isEnabled ? "#15803d" : "#b91c1c",
                                    fontWeight: 700,
                                    fontSize: "15px",
                                }}
                            >
                                {integration.isEnabled ? "Enabled" : "Disabled"}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}