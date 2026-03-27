"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
    id: string;
    name: string;
    createdAt: string;
    ownerEmail: string;
    isActive: boolean;
};

export default function AdminCompaniesPage() {
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/admin/companies")
            .then((res) => res.json())
            .then((data) => {
                if (!data.success) {
                    setError(data.message || "Ошибка загрузки");
                    return;
                }

                setCompanies(data.data);
            })
            .catch(() => {
                setError("Ошибка сети");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const filteredCompanies = companies.filter((company) => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return true;
        }

        return (
            company.name.toLowerCase().includes(normalizedSearch) ||
            company.ownerEmail.toLowerCase().includes(normalizedSearch)
        );
    });

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div style={{ color: "red" }}>{error}</div>;

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
                }}
            >
                Компании
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
                    placeholder="Поиск по названию компании или email owner"
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
                        gridTemplateColumns: "1fr 1fr 1fr 120px",
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
                        Owner Email
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
                        Дата создания
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

                {filteredCompanies.length === 0 ? (
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
                        Компании не найдены
                    </div>
                ) : (
                    filteredCompanies.map((company) => (
                        <div
                            key={company.id}
                            onClick={() => router.push(`/admin/companies/${company.id}`)}
                            style={{
                                padding: "16px",
                                borderBottom: "1px solid #f1f5f9",
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr 120px",
                                alignItems: "center",
                                gap: "12px",
                                cursor: "pointer",
                                transition: "background 0.15s ease",
                            }}
                        >
                            <div
                                style={{
                                    color: "#111827",
                                    fontSize: "15px",
                                    lineHeight: 1.4,
                                }}
                            >
                                <strong>{company.name}</strong>
                            </div>

                            <div
                                style={{
                                    color: "#374151",
                                    fontSize: "15px",
                                    lineHeight: 1.4,
                                }}
                            >
                                {company.ownerEmail}
                            </div>

                            <div
                                style={{
                                    color: "#6b7280",
                                    fontSize: "15px",
                                    lineHeight: 1.4,
                                }}
                            >
                                {new Date(company.createdAt).toLocaleDateString()}
                            </div>

                            <div
                                style={{
                                    color: company.isActive ? "#15803d" : "#b91c1c",
                                    fontWeight: 700,
                                    fontSize: "15px",
                                }}
                            >
                                {company.isActive ? "Active" : "Disabled"}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}