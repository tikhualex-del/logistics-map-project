"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WorkingDayKey =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

type WorkingHoursDay = {
    day: WorkingDayKey;
    isWorking: boolean;
    from: string;
    to: string;
};

type WorkingHoursData = {
    timezone: string;
    days: WorkingHoursDay[];
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

const DAY_LABELS: Record<WorkingDayKey, string> = {
    MONDAY: "Понедельник",
    TUESDAY: "Вторник",
    WEDNESDAY: "Среда",
    THURSDAY: "Четверг",
    FRIDAY: "Пятница",
    SATURDAY: "Суббота",
    SUNDAY: "Воскресенье",
};

export default function WorkingHoursPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState<WorkingHoursData | null>(null);
    const [editableDays, setEditableDays] = useState<WorkingHoursDay[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    async function loadWorkingHours() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/settings/working-hours", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result: ApiResponse<WorkingHoursData> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Не удалось загрузить рабочее время");
            }

            setData(result.data);
            setEditableDays(result.data.days);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка загрузки рабочего времени";

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!data) return;

        try {
            setSaving(true);
            setSaveError("");
            setSuccessMessage("");

            const response = await fetch("/api/settings/working-hours", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    timezone: data.timezone,
                    days: editableDays,
                }),
            });

            const result: ApiResponse<WorkingHoursData> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Не удалось сохранить рабочее время");
            }

            setData(result.data);
            setEditableDays(result.data.days);
            setSuccessMessage("Рабочее время успешно сохранено");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка сохранения рабочего времени";

            setSaveError(message);
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        loadWorkingHours();
    }, []);

    return (
        <main
            style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#2563eb",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "10px",
                }}
            >
                Settings
            </div>

            <h1
                style={{
                    margin: 0,
                    fontSize: "30px",
                    lineHeight: 1.15,
                    fontWeight: 800,
                    color: "#111827",
                }}
            >
                Рабочее время
            </h1>

            <p
                style={{
                    marginTop: "10px",
                    marginBottom: "24px",
                    fontSize: "15px",
                    lineHeight: 1.7,
                    color: "#4b5563",
                    maxWidth: "760px",
                }}
            >
                Здесь настраиваются рабочие дни и часы работы компании для операций и маршрутизации.
            </p>

            {loading ? (
                <div
                    style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "18px",
                        background: "#f9fafb",
                        fontSize: "14px",
                        color: "#4b5563",
                    }}
                >
                    Загрузка рабочего времени...
                </div>
            ) : error ? (
                <div
                    style={{
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        borderRadius: "16px",
                        padding: "16px",
                        fontSize: "14px",
                        lineHeight: 1.6,
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                        Не удалось загрузить рабочее время
                    </div>
                    <div>{error}</div>
                </div>
            ) : !data ? (
                <div
                    style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "18px",
                        background: "#f9fafb",
                        fontSize: "14px",
                        color: "#4b5563",
                    }}
                >
                    Нет данных для отображения
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gap: "18px",
                        maxWidth: "760px",
                    }}
                >
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            height: "44px",
                            borderRadius: "12px",
                            border: "none",
                            background: saving ? "#9ca3af" : "#2563eb",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: saving ? "not-allowed" : "pointer",
                            width: "fit-content",
                            padding: "0 16px",
                        }}
                    >
                        {saving ? "Сохранение..." : "Сохранить"}
                    </button>

                    {successMessage ? (
                        <div
                            style={{
                                border: "1px solid #bbf7d0",
                                background: "#f0fdf4",
                                color: "#166534",
                                borderRadius: "16px",
                                padding: "12px",
                                fontSize: "14px",
                            }}
                        >
                            {successMessage}
                        </div>
                    ) : null}

                    {saveError ? (
                        <div
                            style={{
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                borderRadius: "16px",
                                padding: "12px",
                                fontSize: "14px",
                                lineHeight: 1.6,
                            }}
                        >
                            {saveError}
                        </div>
                    ) : null}

                    <div
                        style={{
                            border: "1px solid #dbeafe",
                            background: "#eff6ff",
                            color: "#1e3a8a",
                            borderRadius: "16px",
                            padding: "16px",
                            fontSize: "14px",
                            lineHeight: 1.7,
                        }}
                    >
                        Текущий часовой пояс для рабочих часов: <b>{data.timezone}</b>
                    </div>

                    <div
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1.5fr 1fr 1fr",
                                gap: "12px",
                                padding: "14px 16px",
                                background: "#f8fafc",
                                borderBottom: "1px solid #e5e7eb",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#475569",
                                textTransform: "uppercase",
                            }}
                        >
                            <div>День</div>
                            <div>Статус</div>
                            <div>Время</div>
                        </div>

                        {editableDays.map((item) => (
                            <div
                                key={item.day}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1.5fr 1fr 1fr",
                                    gap: "12px",
                                    padding: "16px",
                                    borderBottom: "1px solid #f1f5f9",
                                    alignItems: "center",
                                    fontSize: "14px",
                                    color: "#111827",
                                }}
                            >
                                <div style={{ fontWeight: 700 }}>
                                    {DAY_LABELS[item.day]}
                                </div>

                                <div>
                                    <label
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            fontSize: "14px",
                                            color: "#111827",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={item.isWorking}
                                            onChange={(event) => {
                                                setEditableDays((prev) =>
                                                    prev.map((day) =>
                                                        day.day === item.day
                                                            ? { ...day, isWorking: event.target.checked }
                                                            : day
                                                    )
                                                );
                                            }}
                                        />
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                padding: "6px 10px",
                                                borderRadius: "999px",
                                                background: item.isWorking ? "#dcfce7" : "#f3f4f6",
                                                color: item.isWorking ? "#166534" : "#374151",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {item.isWorking ? "Рабочий день" : "Выходной"}
                                        </span>
                                    </label>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <input
                                        type="time"
                                        value={item.from}
                                        onChange={(event) => {
                                            setEditableDays((prev) =>
                                                prev.map((day) =>
                                                    day.day === item.day
                                                        ? { ...day, from: event.target.value }
                                                        : day
                                                )
                                            );
                                        }}
                                        style={{
                                            height: "36px",
                                            borderRadius: "10px",
                                            border: "1px solid #d1d5db",
                                            padding: "0 10px",
                                            fontSize: "14px",
                                            color: "#111827",
                                            outline: "none",
                                            background: "#ffffff",
                                        }}
                                    />

                                    <span style={{ color: "#6b7280", fontWeight: 600 }}>—</span>

                                    <input
                                        type="time"
                                        value={item.to}
                                        onChange={(event) => {
                                            setEditableDays((prev) =>
                                                prev.map((day) =>
                                                    day.day === item.day
                                                        ? { ...day, to: event.target.value }
                                                        : day
                                                )
                                            );
                                        }}
                                        style={{
                                            height: "36px",
                                            borderRadius: "10px",
                                            border: "1px solid #d1d5db",
                                            padding: "0 10px",
                                            fontSize: "14px",
                                            color: "#111827",
                                            outline: "none",
                                            background: "#ffffff",
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}