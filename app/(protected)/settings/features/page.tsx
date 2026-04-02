"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

type LoadUnit = {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    capacityPoints: number;
    allowedCourierTypes?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

type CourierCapacityRule = {
    id: string;
    courierType: string;
    maxOrders: number;
    maxCapacityPoints: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

type IntegrationOption = {
    id: string;
    name: string;
    provider: string;
};

type ItemLoadMapping = {
    id: string;
    externalFieldType: string;
    matchType: string;
    externalValue: string;
    multiplier: number;
    priority: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    integration: {
        id: string;
        name: string;
        provider: string;
    };
    loadUnit: {
        id: string;
        name: string;
        code: string;
        capacityPoints: number;
    };
};

export default function FeaturesSettingsPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [saving, setSaving] = useState(false);

    const [loadUnits, setLoadUnits] = useState<LoadUnit[]>([]);

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [capacityPoints, setCapacityPoints] = useState("");
    const [allowedCourierTypes, setAllowedCourierTypes] = useState("");

    const [capacityLoading, setCapacityLoading] = useState(true);
    const [capacityLoadError, setCapacityLoadError] = useState("");
    const [capacityFormError, setCapacityFormError] = useState("");
    const [capacitySuccessMessage, setCapacitySuccessMessage] = useState("");
    const [capacitySaving, setCapacitySaving] = useState(false);

    const [capacityRules, setCapacityRules] = useState<CourierCapacityRule[]>([]);

    const [courierType, setCourierType] = useState("");
    const [maxOrders, setMaxOrders] = useState("");
    const [maxCapacityPoints, setMaxCapacityPoints] = useState("");

    const [mappingLoading, setMappingLoading] = useState(true);
    const [mappingLoadError, setMappingLoadError] = useState("");
    const [mappingFormError, setMappingFormError] = useState("");
    const [mappingSuccessMessage, setMappingSuccessMessage] = useState("");
    const [mappingSaving, setMappingSaving] = useState(false);

    const [itemLoadMappings, setItemLoadMappings] = useState<ItemLoadMapping[]>([]);
    const [integrations, setIntegrations] = useState<IntegrationOption[]>([]);

    const [integrationId, setIntegrationId] = useState("");
    const [externalFieldType, setExternalFieldType] = useState("sku");
    const [matchType, setMatchType] = useState("exact");
    const [externalValue, setExternalValue] = useState("");
    const [selectedLoadUnitId, setSelectedLoadUnitId] = useState("");
    const [multiplier, setMultiplier] = useState("1");
    const [priority, setPriority] = useState("100");

    async function loadLoadUnits() {
        try {
            setLoading(true);
            setLoadError("");

            const response = await fetch("/api/load-units", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result: ApiResponse<LoadUnit[]> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось загрузить Load Units");
            }

            setLoadUnits(Array.isArray(result.data) ? result.data : []);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка загрузки Load Units";

            setLoadError(message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadLoadUnits();
        loadCourierCapacityRules();
        loadItemLoadMappings();
        loadIntegrations();
    }, []);

    useEffect(() => {
        if (loadUnits.length > 0 && !selectedLoadUnitId) {
            setSelectedLoadUnitId(loadUnits[0].id);
        }
    }, [loadUnits, selectedLoadUnitId]);

    function resetForm() {
        setName("");
        setCode("");
        setDescription("");
        setCapacityPoints("");
        setAllowedCourierTypes("");
    }

    function validateForm() {
        if (!name.trim()) {
            return "Название обязательно";
        }

        if (!code.trim()) {
            return "Код обязателен";
        }

        const points = Number(capacityPoints);

        if (!Number.isFinite(points) || points <= 0) {
            return "Capacity Points должны быть больше 0";
        }

        return null;
    }

    async function handleCreateLoadUnit() {
        try {
            const validationError = validateForm();

            if (validationError) {
                setFormError(validationError);
                return;
            }

            setSaving(true);
            setFormError("");
            setSuccessMessage("");

            const response = await fetch("/api/load-units", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name,
                    code,
                    description,
                    capacityPoints: Number(capacityPoints),
                    allowedCourierTypes,
                }),
            });

            const result: ApiResponse<LoadUnit> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Не удалось создать Load Unit");
            }

            setLoadUnits((prev) => [result.data as LoadUnit, ...prev]);
            setSuccessMessage("Load Unit успешно создан");
            resetForm();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка создания Load Unit";

            setFormError(message);
        } finally {
            setSaving(false);
        }
    }

    async function loadCourierCapacityRules() {
        try {
            setCapacityLoading(true);
            setCapacityLoadError("");

            const response = await fetch("/api/courier-capacity", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result: ApiResponse<CourierCapacityRule[]> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось загрузить Courier Capacity Rules");
            }

            setCapacityRules(Array.isArray(result.data) ? result.data : []);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Ошибка загрузки Courier Capacity Rules";

            setCapacityLoadError(message);
        } finally {
            setCapacityLoading(false);
        }
    }

    function resetCapacityForm() {
        setCourierType("");
        setMaxOrders("");
        setMaxCapacityPoints("");
    }

    function validateCapacityForm() {
        if (!courierType.trim()) {
            return "Тип курьера обязателен";
        }

        const parsedMaxOrders = Number(maxOrders);
        const parsedMaxCapacityPoints = Number(maxCapacityPoints);

        if (!Number.isFinite(parsedMaxOrders) || parsedMaxOrders <= 0) {
            return "Max Orders должны быть больше 0";
        }

        if (!Number.isFinite(parsedMaxCapacityPoints) || parsedMaxCapacityPoints <= 0) {
            return "Max Capacity Points должны быть больше 0";
        }

        return null;
    }

    async function handleCreateCapacityRule() {
        try {
            const validationError = validateCapacityForm();

            if (validationError) {
                setCapacityFormError(validationError);
                return;
            }

            setCapacitySaving(true);
            setCapacityFormError("");
            setCapacitySuccessMessage("");

            const response = await fetch("/api/courier-capacity", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    courierType,
                    maxOrders: Number(maxOrders),
                    maxCapacityPoints: Number(maxCapacityPoints),
                }),
            });

            const result: ApiResponse<CourierCapacityRule> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Не удалось создать Courier Capacity Rule");
            }

            setCapacityRules((prev) => [result.data as CourierCapacityRule, ...prev]);
            setCapacitySuccessMessage("Courier Capacity Rule успешно создан");
            resetCapacityForm();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Ошибка создания Courier Capacity Rule";

            setCapacityFormError(message);
        } finally {
            setCapacitySaving(false);
        }
    }

    async function loadIntegrations() {
        try {
            const response = await fetch("/api/integrations", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result: ApiResponse<IntegrationOption[]> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось загрузить интеграции");
            }

            const items = Array.isArray(result.data) ? result.data : [];
            setIntegrations(items);

            if (items.length > 0) {
                setIntegrationId((current) => current || items[0].id);
            }
        } catch {
            // Не блокируем страницу, если интеграции временно не загрузились
        }
    }

    async function loadItemLoadMappings() {
        try {
            setMappingLoading(true);
            setMappingLoadError("");

            const response = await fetch("/api/item-load-mappings", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result: ApiResponse<ItemLoadMapping[]> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось загрузить Item Load Mappings");
            }

            setItemLoadMappings(Array.isArray(result.data) ? result.data : []);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Ошибка загрузки Item Load Mappings";

            setMappingLoadError(message);
        } finally {
            setMappingLoading(false);
        }
    }

    function resetMappingForm() {
        setExternalFieldType("sku");
        setMatchType("exact");
        setExternalValue("");
        setSelectedLoadUnitId("");
        setMultiplier("1");
        setPriority("100");
    }

    function validateMappingForm() {
        if (!integrationId.trim()) {
            return "Интеграция обязательна";
        }

        if (!externalValue.trim()) {
            return "External Value обязателен";
        }

        if (!selectedLoadUnitId.trim()) {
            return "Load Unit обязателен";
        }

        const parsedMultiplier = Number(multiplier);
        const parsedPriority = Number(priority);

        if (!Number.isFinite(parsedMultiplier) || parsedMultiplier <= 0) {
            return "Multiplier должен быть больше 0";
        }

        if (!Number.isFinite(parsedPriority) || parsedPriority < 0) {
            return "Priority должен быть 0 или больше";
        }

        return null;
    }

    async function handleCreateItemLoadMapping() {
        try {
            const validationError = validateMappingForm();

            if (validationError) {
                setMappingFormError(validationError);
                return;
            }

            setMappingSaving(true);
            setMappingFormError("");
            setMappingSuccessMessage("");

            const response = await fetch("/api/item-load-mappings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    integrationId,
                    externalFieldType,
                    matchType,
                    externalValue,
                    loadUnitId: selectedLoadUnitId,
                    multiplier: Number(multiplier),
                    priority: Number(priority),
                }),
            });

            const result: ApiResponse<ItemLoadMapping> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Не удалось создать Item Load Mapping");
            }

            setItemLoadMappings((prev) => [result.data as ItemLoadMapping, ...prev]);
            setMappingSuccessMessage("Item Load Mapping успешно создан");
            resetMappingForm();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Ошибка создания Item Load Mapping";

            setMappingFormError(message);
        } finally {
            setMappingSaving(false);
        }
    }

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
                Настройка функционала
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
                Здесь будут включаться и отключаться модули платформы, а также
                настраиваться параметры отдельных функций и сценариев работы проекта.
            </p>

            <section
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "18px",
                    padding: "20px",
                    background: "#f9fafb",
                    display: "grid",
                    gap: "18px",
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "22px",
                            lineHeight: 1.2,
                            fontWeight: 800,
                            color: "#111827",
                        }}
                    >
                        Load Units
                    </h2>

                    <p
                        style={{
                            marginTop: "8px",
                            marginBottom: 0,
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "#4b5563",
                            maxWidth: "760px",
                        }}
                    >
                        Здесь задаются внутренние единицы нагрузки компании:
                        коробки, пакеты, термобоксы, букеты и другие сущности,
                        которые потом будут использоваться в расчёте вместимости
                        заказа и совместимости с типом курьера.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gap: "14px",
                        maxWidth: "720px",
                    }}
                >
                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="load-unit-name"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Название
                        </label>

                        <input
                            id="load-unit-name"
                            type="text"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                setFormError("");
                            }}
                            placeholder="Например: Box 6 bottles"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="load-unit-code"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Код
                        </label>

                        <input
                            id="load-unit-code"
                            type="text"
                            value={code}
                            onChange={(event) => {
                                setCode(event.target.value);
                                setFormError("");
                            }}
                            placeholder="Например: BOX_6"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="load-unit-description"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Описание
                        </label>

                        <input
                            id="load-unit-description"
                            type="text"
                            value={description}
                            onChange={(event) => {
                                setDescription(event.target.value);
                                setFormError("");
                            }}
                            placeholder="Необязательно"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="load-unit-capacity-points"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Capacity Points
                        </label>

                        <input
                            id="load-unit-capacity-points"
                            type="number"
                            min="1"
                            value={capacityPoints}
                            onChange={(event) => {
                                setCapacityPoints(event.target.value);
                                setFormError("");
                            }}
                            placeholder="Например: 6"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="load-unit-allowed-courier-types"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Allowed Courier Types
                        </label>

                        <input
                            id="load-unit-allowed-courier-types"
                            type="text"
                            value={allowedCourierTypes}
                            onChange={(event) => {
                                setAllowedCourierTypes(event.target.value);
                                setFormError("");
                            }}
                            placeholder="Например: walk,car"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        />
                    </div>

                    {formError ? (
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
                            {formError}
                        </div>
                    ) : null}

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

                    <button
                        type="button"
                        onClick={handleCreateLoadUnit}
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
                        }}
                    >
                        {saving ? "Создание..." : "Создать Load Unit"}
                    </button>
                </div>

                <div
                    style={{
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: "18px",
                        display: "grid",
                        gap: "14px",
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 800,
                            color: "#111827",
                        }}
                    >
                        Список Load Units
                    </h3>

                    {loading ? (
                        <div
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "18px",
                                background: "#ffffff",
                                fontSize: "14px",
                                color: "#4b5563",
                            }}
                        >
                            Загрузка Load Units...
                        </div>
                    ) : loadError ? (
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
                                Не удалось загрузить Load Units
                            </div>
                            <div>{loadError}</div>
                        </div>
                    ) : loadUnits.length === 0 ? (
                        <div
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "18px",
                                background: "#ffffff",
                                fontSize: "14px",
                                color: "#4b5563",
                            }}
                        >
                            Пока нет ни одной единицы нагрузки.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gap: "12px",
                            }}
                        >
                            {loadUnits.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        background: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "16px",
                                        padding: "16px",
                                        display: "grid",
                                        gap: "8px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: "12px",
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: 800,
                                                color: "#111827",
                                            }}
                                        >
                                            {item.name}
                                        </div>

                                        <div
                                            style={{
                                                display: "inline-flex",
                                                padding: "6px 10px",
                                                borderRadius: "999px",
                                                background: "#dbeafe",
                                                color: "#1d4ed8",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {item.capacityPoints} pts
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#4b5563",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Code: <b>{item.code}</b>
                                    </div>

                                    {item.description ? (
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: "#4b5563",
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {item.description}
                                        </div>
                                    ) : null}

                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#4b5563",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Allowed courier types:{" "}
                                        <b>{item.allowedCourierTypes || "Не ограничено"}</b>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "18px",
                    padding: "20px",
                    background: "#f9fafb",
                    display: "grid",
                    gap: "18px",
                    marginTop: "20px",
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "22px",
                            lineHeight: 1.2,
                            fontWeight: 800,
                            color: "#111827",
                        }}
                    >
                        Courier Capacity Rules
                    </h2>

                    <p
                        style={{
                            marginTop: "8px",
                            marginBottom: 0,
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "#4b5563",
                            maxWidth: "760px",
                        }}
                    >
                        Здесь задаются лимиты по типам курьеров: сколько заказов и сколько
                        capacity points может увезти пеший, авто или другой тип курьера.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gap: "14px",
                        maxWidth: "720px",
                    }}
                >
                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="courier-type"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Тип курьера
                        </label>

                        <input
                            id="courier-type"
                            type="text"
                            value={courierType}
                            onChange={(event) => {
                                setCourierType(event.target.value);
                                setCapacityFormError("");
                            }}
                            placeholder="Например: walk или car"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="courier-max-orders"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Max Orders
                        </label>

                        <input
                            id="courier-max-orders"
                            type="number"
                            min="1"
                            value={maxOrders}
                            onChange={(event) => {
                                setMaxOrders(event.target.value);
                                setCapacityFormError("");
                            }}
                            placeholder="Например: 10"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="courier-max-capacity-points"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Max Capacity Points
                        </label>

                        <input
                            id="courier-max-capacity-points"
                            type="number"
                            min="1"
                            value={maxCapacityPoints}
                            onChange={(event) => {
                                setMaxCapacityPoints(event.target.value);
                                setCapacityFormError("");
                            }}
                            placeholder="Например: 8"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        />
                    </div>

                    {capacityFormError ? (
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
                            {capacityFormError}
                        </div>
                    ) : null}

                    {capacitySuccessMessage ? (
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
                            {capacitySuccessMessage}
                        </div>
                    ) : null}

                    <button
                        type="button"
                        onClick={handleCreateCapacityRule}
                        disabled={capacitySaving}
                        style={{
                            height: "44px",
                            borderRadius: "12px",
                            border: "none",
                            background: capacitySaving ? "#9ca3af" : "#2563eb",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: capacitySaving ? "not-allowed" : "pointer",
                        }}
                    >
                        {capacitySaving ? "Создание..." : "Создать Courier Capacity Rule"}
                    </button>
                </div>

                <div
                    style={{
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: "18px",
                        display: "grid",
                        gap: "14px",
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 800,
                            color: "#111827",
                        }}
                    >
                        Список Courier Capacity Rules
                    </h3>

                    {capacityLoading ? (
                        <div
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "18px",
                                background: "#ffffff",
                                fontSize: "14px",
                                color: "#4b5563",
                            }}
                        >
                            Загрузка Courier Capacity Rules...
                        </div>
                    ) : capacityLoadError ? (
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
                                Не удалось загрузить Courier Capacity Rules
                            </div>
                            <div>{capacityLoadError}</div>
                        </div>
                    ) : capacityRules.length === 0 ? (
                        <div
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "18px",
                                background: "#ffffff",
                                fontSize: "14px",
                                color: "#4b5563",
                            }}
                        >
                            Пока нет ни одного правила вместимости.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gap: "12px",
                            }}
                        >
                            {capacityRules.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        background: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "16px",
                                        padding: "16px",
                                        display: "grid",
                                        gap: "8px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: "12px",
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: 800,
                                                color: "#111827",
                                            }}
                                        >
                                            {item.courierType}
                                        </div>

                                        <div
                                            style={{
                                                display: "inline-flex",
                                                padding: "6px 10px",
                                                borderRadius: "999px",
                                                background: "#dbeafe",
                                                color: "#1d4ed8",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {item.maxCapacityPoints} pts
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#4b5563",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Max orders: <b>{item.maxOrders}</b>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "18px",
                    padding: "20px",
                    background: "#f9fafb",
                    display: "grid",
                    gap: "18px",
                    marginTop: "20px",
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "22px",
                            lineHeight: 1.2,
                            fontWeight: 800,
                            color: "#111827",
                        }}
                    >
                        Item Load Mappings
                    </h2>

                    <p
                        style={{
                            marginTop: "8px",
                            marginBottom: 0,
                            fontSize: "14px",
                            lineHeight: 1.6,
                            color: "#4b5563",
                            maxWidth: "760px",
                        }}
                    >
                        Здесь задаются правила, по которым внешние SKU, названия или категории
                        товаров из интеграции будут сопоставляться с внутренними Load Units.
                    </p>
                </div>

                <div
                    style={{
                        display: "grid",
                        gap: "14px",
                        maxWidth: "720px",
                    }}
                >
                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="mapping-integration"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Интеграция
                        </label>

                        <select
                            id="mapping-integration"
                            value={integrationId}
                            onChange={(event) => {
                                setIntegrationId(event.target.value);
                                setMappingFormError("");
                            }}
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        >
                            {integrations.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.provider})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "14px",
                        }}
                    >
                        <div style={{ display: "grid", gap: "8px" }}>
                            <label
                                htmlFor="mapping-external-field-type"
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "#111827",
                                }}
                            >
                                External Field Type
                            </label>

                            <select
                                id="mapping-external-field-type"
                                value={externalFieldType}
                                onChange={(event) => {
                                    setExternalFieldType(event.target.value);
                                    setMappingFormError("");
                                }}
                                style={{
                                    height: "44px",
                                    borderRadius: "12px",
                                    border: "1px solid #d1d5db",
                                    padding: "0 14px",
                                    fontSize: "14px",
                                    color: "#111827",
                                    outline: "none",
                                    background: "#ffffff",
                                }}
                            >
                                <option value="sku">sku</option>
                                <option value="name">name</option>
                                <option value="category">category</option>
                            </select>
                        </div>

                        <div style={{ display: "grid", gap: "8px" }}>
                            <label
                                htmlFor="mapping-match-type"
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "#111827",
                                }}
                            >
                                Match Type
                            </label>

                            <select
                                id="mapping-match-type"
                                value={matchType}
                                onChange={(event) => {
                                    setMatchType(event.target.value);
                                    setMappingFormError("");
                                }}
                                style={{
                                    height: "44px",
                                    borderRadius: "12px",
                                    border: "1px solid #d1d5db",
                                    padding: "0 14px",
                                    fontSize: "14px",
                                    color: "#111827",
                                    outline: "none",
                                    background: "#ffffff",
                                }}
                            >
                                <option value="exact">exact</option>
                                <option value="contains">contains</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="mapping-external-value"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            External Value
                        </label>

                        <input
                            id="mapping-external-value"
                            type="text"
                            value={externalValue}
                            onChange={(event) => {
                                setExternalValue(event.target.value);
                                setMappingFormError("");
                            }}
                            placeholder="Например: WINE_BOX_6"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="mapping-load-unit"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Load Unit
                        </label>

                        <select
                            id="mapping-load-unit"
                            value={selectedLoadUnitId}
                            onChange={(event) => {
                                setSelectedLoadUnitId(event.target.value);
                                setMappingFormError("");
                            }}
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                                background: "#ffffff",
                            }}
                        >
                            {loadUnits.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.capacityPoints} pts)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "14px",
                        }}
                    >
                        <div style={{ display: "grid", gap: "8px" }}>
                            <label
                                htmlFor="mapping-multiplier"
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "#111827",
                                }}
                            >
                                Multiplier
                            </label>

                            <input
                                id="mapping-multiplier"
                                type="number"
                                min="1"
                                value={multiplier}
                                onChange={(event) => {
                                    setMultiplier(event.target.value);
                                    setMappingFormError("");
                                }}
                                placeholder="1"
                                style={{
                                    height: "44px",
                                    borderRadius: "12px",
                                    border: "1px solid #d1d5db",
                                    padding: "0 14px",
                                    fontSize: "14px",
                                    color: "#111827",
                                    outline: "none",
                                    background: "#ffffff",
                                }}
                            />
                        </div>

                        <div style={{ display: "grid", gap: "8px" }}>
                            <label
                                htmlFor="mapping-priority"
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "#111827",
                                }}
                            >
                                Priority
                            </label>

                            <input
                                id="mapping-priority"
                                type="number"
                                min="0"
                                value={priority}
                                onChange={(event) => {
                                    setPriority(event.target.value);
                                    setMappingFormError("");
                                }}
                                placeholder="100"
                                style={{
                                    height: "44px",
                                    borderRadius: "12px",
                                    border: "1px solid #d1d5db",
                                    padding: "0 14px",
                                    fontSize: "14px",
                                    color: "#111827",
                                    outline: "none",
                                    background: "#ffffff",
                                }}
                            />
                        </div>
                    </div>

                    {mappingFormError ? (
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
                            {mappingFormError}
                        </div>
                    ) : null}

                    {mappingSuccessMessage ? (
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
                            {mappingSuccessMessage}
                        </div>
                    ) : null}

                    <button
                        type="button"
                        onClick={handleCreateItemLoadMapping}
                        disabled={mappingSaving}
                        style={{
                            height: "44px",
                            borderRadius: "12px",
                            border: "none",
                            background: mappingSaving ? "#9ca3af" : "#2563eb",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: mappingSaving ? "not-allowed" : "pointer",
                        }}
                    >
                        {mappingSaving ? "Создание..." : "Создать Item Load Mapping"}
                    </button>
                </div>

                <div
                    style={{
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: "18px",
                        display: "grid",
                        gap: "14px",
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 800,
                            color: "#111827",
                        }}
                    >
                        Список Item Load Mappings
                    </h3>

                    {mappingLoading ? (
                        <div
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "18px",
                                background: "#ffffff",
                                fontSize: "14px",
                                color: "#4b5563",
                            }}
                        >
                            Загрузка Item Load Mappings...
                        </div>
                    ) : mappingLoadError ? (
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
                                Не удалось загрузить Item Load Mappings
                            </div>
                            <div>{mappingLoadError}</div>
                        </div>
                    ) : itemLoadMappings.length === 0 ? (
                        <div
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "18px",
                                background: "#ffffff",
                                fontSize: "14px",
                                color: "#4b5563",
                            }}
                        >
                            Пока нет ни одного правила сопоставления.
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gap: "12px",
                            }}
                        >
                            {itemLoadMappings.map((item) => (
                                <div
                                    key={item.id}
                                    style={{
                                        background: "#ffffff",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "16px",
                                        padding: "16px",
                                        display: "grid",
                                        gap: "8px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: "12px",
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: 800,
                                                color: "#111827",
                                            }}
                                        >
                                            {item.externalFieldType}:{` `}{item.externalValue}
                                        </div>

                                        <div
                                            style={{
                                                display: "inline-flex",
                                                padding: "6px 10px",
                                                borderRadius: "999px",
                                                background: "#dbeafe",
                                                color: "#1d4ed8",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {item.matchType} · priority {item.priority}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#4b5563",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Integration: <b>{item.integration.name}</b> ({item.integration.provider})
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#4b5563",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Load Unit: <b>{item.loadUnit.name}</b> ({item.loadUnit.capacityPoints} pts)
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#4b5563",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Multiplier: <b>{item.multiplier}</b>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}