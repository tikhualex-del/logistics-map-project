"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type GeneralSettingsData = {
    id: string;
    name: string;
    timezone: string;
    currency: string;
    distanceUnit: string;
    mapProvider: string;
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

type MapStatusRow = {
    id: string;
    rawStatus: string;
    internalStage: string;
    label: string;
    color: string;
    iconUrl: string;
    isVisible: boolean;
};

type IntegrationItem = {
    id: string;
    name: string;
    provider: string;
    isActive?: boolean;
    isDefault?: boolean;
};

type IntegrationMappingItem = {
    id: string;
    integrationId: string;
    orderStatusMapJson: string;
    deliveryTypeMapJson: string;
    warehouseMapJson?: string | null;
    courierMapJson?: string | null;
    mapStatusConfigJson?: string | null;
};

const RAW_TIMEZONE_OPTIONS = [
    "UTC",

    "Europe/London",
    "Europe/Dublin",
    "Europe/Lisbon",
    "Europe/Madrid",
    "Europe/Paris",
    "Europe/Amsterdam",
    "Europe/Brussels",
    "Europe/Luxembourg",
    "Europe/Berlin",
    "Europe/Zurich",
    "Europe/Vienna",
    "Europe/Prague",
    "Europe/Warsaw",
    "Europe/Copenhagen",
    "Europe/Oslo",
    "Europe/Stockholm",
    "Europe/Helsinki",
    "Europe/Athens",
    "Europe/Bucharest",
    "Europe/Sofia",
    "Europe/Belgrade",
    "Europe/Budapest",
    "Europe/Vilnius",
    "Europe/Riga",
    "Europe/Tallinn",
    "Europe/Kyiv",
    "Europe/Chisinau",
    "Europe/Minsk",
    "Europe/Moscow",
    "Europe/Istanbul",

    "Asia/Dubai",
    "Asia/Tbilisi",
    "Asia/Yerevan",
    "Asia/Baku",
    "Asia/Jerusalem",
    "Asia/Riyadh",
    "Asia/Tehran",
    "Asia/Karachi",
    "Asia/Tashkent",
    "Asia/Almaty",
    "Asia/Bishkek",
    "Asia/Dushanbe",
    "Asia/Ashgabat",
    "Asia/Yekaterinburg",
    "Asia/Omsk",
    "Asia/Novosibirsk",
    "Asia/Krasnoyarsk",
    "Asia/Irkutsk",
    "Asia/Yakutsk",
    "Asia/Vladivostok",
    "Asia/Magadan",
    "Asia/Sakhalin",
    "Asia/Kamchatka",
    "Asia/Novokuznetsk",
    "Asia/Kolkata",
    "Asia/Dhaka",
    "Asia/Bangkok",
    "Asia/Jakarta",
    "Asia/Singapore",
    "Asia/Kuala_Lumpur",
    "Asia/Manila",
    "Asia/Hong_Kong",
    "Asia/Shanghai",
    "Asia/Taipei",
    "Asia/Seoul",
    "Asia/Tokyo",

    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Casablanca",

    "America/St_Johns",
    "America/Halifax",
    "America/Toronto",
    "America/Montreal",
    "America/New_York",
    "America/Detroit",
    "America/Chicago",
    "America/Winnipeg",
    "America/Denver",
    "America/Edmonton",
    "America/Phoenix",
    "America/Los_Angeles",
    "America/Vancouver",
    "America/Anchorage",
    "America/Honolulu",
    "America/Mexico_City",
    "America/Bogota",
    "America/Lima",
    "America/Santiago",
    "America/Caracas",
    "America/Sao_Paulo",
    "America/Argentina/Buenos_Aires",

    "Australia/Perth",
    "Australia/Adelaide",
    "Australia/Darwin",
    "Australia/Brisbane",
    "Australia/Sydney",
    "Australia/Melbourne",
    "Pacific/Auckland",
];

const PRIORITY_TIMEZONE_OPTIONS = [
    "UTC",
    "Europe/Moscow",
    "Europe/Chisinau",
    "Europe/Kyiv",
    "Europe/Berlin",
    "Europe/London",
    "Asia/Dubai",
    "Asia/Tbilisi",
    "Asia/Yerevan",
    "America/New_York",
];

const sortedTimezoneOptions = [...RAW_TIMEZONE_OPTIONS].sort((a, b) =>
    a.localeCompare(b)
);

const mergedTimezoneOptions = [
    ...PRIORITY_TIMEZONE_OPTIONS,
    ...sortedTimezoneOptions.filter(
        (timezone) => !PRIORITY_TIMEZONE_OPTIONS.includes(timezone)
    ),
];

const TIMEZONE_OPTIONS = Array.from(new Set(mergedTimezoneOptions));
const CURRENCY_OPTIONS = ["RUB", "EUR", "USD"];
const DISTANCE_UNIT_OPTIONS = ["km", "mi"];
const MAP_PROVIDER_OPTIONS = [
    { value: "yandex", label: "Yandex Maps" },
    { value: "2gis", label: "2GIS Maps" },
    { value: "google", label: "Google Maps" },
] as const;

const INTERNAL_STAGE_OPTIONS = [
    { value: "NEW", label: "Новый" },
    { value: "TO_ASSEMBLY", label: "На сборке" },
    { value: "READY_FOR_DELIVERY", label: "Готов к выезду" },
    { value: "IN_DELIVERY", label: "В пути" },
    { value: "DELIVERED", label: "Доставлен" },
    { value: "CANCELLED", label: "Отменен" },
    { value: "RETURNED", label: "Возврат" },
];

const DEFAULT_MAP_STATUS_ROWS: MapStatusRow[] = [
    {
        id: "status-new",
        rawStatus: "new",
        internalStage: "NEW",
        label: "Новый",
        color: "#f59e0b",
        iconUrl: "",
        isVisible: true,
    },
    {
        id: "status-delivering",
        rawStatus: "delivering",
        internalStage: "IN_DELIVERY",
        label: "Доставляется",
        color: "#2563eb",
        iconUrl: "",
        isVisible: true,
    },
    {
        id: "status-complete",
        rawStatus: "complete",
        internalStage: "DELIVERED",
        label: "Выполнен",
        color: "#2bbf8a",
        iconUrl: "",
        isVisible: true,
    },
];

function formatTimezoneLabel(timezone: string) {
    return timezone.replaceAll("_", " / ");
}

function cloneDefaultMapStatusRows(): MapStatusRow[] {
    return DEFAULT_MAP_STATUS_ROWS.map((item) => ({ ...item }));
}

function normalizeLoadedMapStatusRows(input: unknown): MapStatusRow[] {
    if (!Array.isArray(input)) {
        return cloneDefaultMapStatusRows();
    }

    const rows = input.map((item: any, index: number) => ({
        id: String(item?.id || `status-loaded-${index}`),
        rawStatus: String(item?.rawStatus || ""),
        internalStage: String(item?.internalStage || ""),
        label: String(item?.label || ""),
        color: String(item?.color || "#2563eb"),
        iconUrl: String(item?.iconUrl || ""),
        isVisible: item?.isVisible ?? true,
    }));

    return rows.length > 0 ? rows : cloneDefaultMapStatusRows();
}

export default function GeneralSettingsPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formError, setFormError] = useState("");

    const [name, setName] = useState("");
    const [timezone, setTimezone] = useState("");

    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const [initialName, setInitialName] = useState("");
    const [initialTimezone, setInitialTimezone] = useState("");

    const [currency, setCurrency] = useState("");
    const [initialCurrency, setInitialCurrency] = useState("");
    const [distanceUnit, setDistanceUnit] = useState("");
    const [initialDistanceUnit, setInitialDistanceUnit] = useState("");

    const [mapProvider, setMapProvider] = useState("yandex");
    const [initialMapProvider, setInitialMapProvider] = useState("yandex");

    const [mapStatusRows, setMapStatusRows] = useState<MapStatusRow[]>(
        cloneDefaultMapStatusRows()
    );
    const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
    const [selectedIntegrationId, setSelectedIntegrationId] = useState("");
    const [integrationMappings, setIntegrationMappings] = useState<
        IntegrationMappingItem[]
    >([]);

    async function loadSettings() {
        try {
            setLoading(true);
            setLoadError("");

            const response = await fetch("/api/settings/general", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result: ApiResponse<GeneralSettingsData> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Не удалось загрузить общие настройки");
            }

            const loadedName = result.data.name || "";
            const loadedTimezone = result.data.timezone || "";
            const normalizedTimezone = TIMEZONE_OPTIONS.includes(loadedTimezone)
                ? loadedTimezone
                : "Europe/Moscow";

            const loadedCurrency = result.data.currency || "RUB";
            const loadedDistanceUnit = result.data.distanceUnit || "km";
            const loadedMapProvider = result.data.mapProvider || "yandex";

            const normalizedDistanceUnit = DISTANCE_UNIT_OPTIONS.includes(
                loadedDistanceUnit
            )
                ? loadedDistanceUnit
                : "km";

            const normalizedCurrency = CURRENCY_OPTIONS.includes(loadedCurrency)
                ? loadedCurrency
                : "RUB";

            const normalizedMapProvider = MAP_PROVIDER_OPTIONS.some(
                (option) => option.value === loadedMapProvider
            )
                ? loadedMapProvider
                : "yandex";

            setName(loadedName);
            setTimezone(normalizedTimezone);
            setCurrency(normalizedCurrency);
            setDistanceUnit(normalizedDistanceUnit);
            setMapProvider(normalizedMapProvider);

            setInitialName(loadedName);
            setInitialTimezone(normalizedTimezone);
            setInitialCurrency(normalizedCurrency);
            setInitialDistanceUnit(normalizedDistanceUnit);
            setInitialMapProvider(normalizedMapProvider);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка загрузки общих настроек";

            setLoadError(message);
        } finally {
            setLoading(false);
        }
    }

    function validateForm() {
        if (!name.trim()) {
            return "Название компании не может быть пустым";
        }

        if (!timezone.trim()) {
            return "Часовой пояс обязателен";
        }

        if (!MAP_PROVIDER_OPTIONS.some((option) => option.value === mapProvider)) {
            return "Некорректный провайдер карты";
        }

        return null;
    }

    async function loadIntegrations() {
        try {
            const response = await fetch("/api/integrations", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result = await response.json();

            if (!response.ok || !result.success || !Array.isArray(result.data)) {
                return;
            }

            const items: IntegrationItem[] = result.data.map((item: any) => ({
                id: String(item.id),
                name: String(item.name || ""),
                provider: String(item.provider || ""),
                isActive: Boolean(item.isActive),
                isDefault: Boolean(item.isDefault),
            }));

            setIntegrations(items);

            const defaultIntegration =
                items.find((item) => item.isDefault) || items[0];

            if (defaultIntegration) {
                setSelectedIntegrationId(defaultIntegration.id);
            }
        } catch {
            setIntegrations([]);
            setSelectedIntegrationId("");
        }
    }

    async function loadIntegrationMappings() {
        try {
            const response = await fetch("/api/integration-mappings", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result = await response.json();

            if (!response.ok || !result.success || !Array.isArray(result.data)) {
                setIntegrationMappings([]);
                return;
            }

            const items: IntegrationMappingItem[] = result.data.map((item: any) => ({
                id: String(item.id),
                integrationId: String(item.integrationId),
                orderStatusMapJson: String(item.orderStatusMapJson || ""),
                deliveryTypeMapJson: String(item.deliveryTypeMapJson || ""),
                warehouseMapJson: item.warehouseMapJson ?? null,
                courierMapJson: item.courierMapJson ?? null,
                mapStatusConfigJson: item.mapStatusConfigJson ?? null,
            }));

            setIntegrationMappings(items);
        } catch {
            setIntegrationMappings([]);
        }
    }

    async function handleSave() {
        try {
            const validationError = validateForm();

            if (validationError) {
                setFormError(validationError);
                return;
            }

            setSaving(true);
            setFormError("");
            setSuccessMessage("");

            const response = await fetch("/api/settings/general", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name,
                    timezone,
                    currency,
                    distanceUnit,
                    mapProvider,
                }),
            });

            const result = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось сохранить настройки");
            }

            setInitialName(name);
            setInitialTimezone(timezone);
            setInitialCurrency(currency);
            setInitialDistanceUnit(distanceUnit);
            setInitialMapProvider(mapProvider);
            setSuccessMessage("Настройки успешно сохранены");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка сохранения настроек";

            setFormError(message);
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveMapStatuses() {
        try {
            if (!selectedIntegrationId) {
                setFormError("Сначала выбери интеграцию для статусов карты");
                return;
            }

            const currentMapping = integrationMappings.find(
                (item) => item.integrationId === selectedIntegrationId
            );

            if (!currentMapping) {
                setFormError(
                    "Для выбранной интеграции пока нет mapping. Сначала нужно создать integration mapping."
                );
                return;
            }

            setSaving(true);
            setFormError("");
            setSuccessMessage("");

            const response = await fetch("/api/integration-mappings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    integrationId: selectedIntegrationId,
                    orderStatusMapJson: currentMapping.orderStatusMapJson,
                    deliveryTypeMapJson: currentMapping.deliveryTypeMapJson,
                    warehouseMapJson: currentMapping.warehouseMapJson || "",
                    courierMapJson: currentMapping.courierMapJson || "",
                    mapStatusConfigJson: JSON.stringify(mapStatusRows),
                }),
            });

            const result = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось сохранить статусы карты");
            }

            setSuccessMessage("Статусы карты успешно сохранены");
            await loadIntegrationMappings();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка сохранения статусов карты";

            setFormError(message);
        } finally {
            setSaving(false);
        }
    }

    async function handleUploadIcon(rowId: string, file: File | null) {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/map-status-icons/upload", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(result.message || "Ошибка загрузки файла");
                return;
            }

            const uploadedUrl = result.data.url;

            setMapStatusRows((prev) =>
                prev.map((item) =>
                    item.id === rowId ? { ...item, iconUrl: uploadedUrl } : item
                )
            );
        } catch {
            alert("Ошибка загрузки файла");
        }
    }

    useEffect(() => {
        loadSettings();
        loadIntegrations();
        loadIntegrationMappings();
    }, []);

    useEffect(() => {
        if (!selectedIntegrationId) {
            return;
        }

        const currentMapping = integrationMappings.find(
            (item) => item.integrationId === selectedIntegrationId
        );

        if (!currentMapping?.mapStatusConfigJson) {
            setMapStatusRows(cloneDefaultMapStatusRows());
            return;
        }

        try {
            const parsed = JSON.parse(currentMapping.mapStatusConfigJson);
            setMapStatusRows(normalizeLoadedMapStatusRows(parsed));
        } catch {
            setMapStatusRows(cloneDefaultMapStatusRows());
        }
    }, [selectedIntegrationId, integrationMappings]);

    const hasChanges =
        name !== initialName ||
        timezone !== initialTimezone ||
        currency !== initialCurrency ||
        distanceUnit !== initialDistanceUnit ||
        mapProvider !== initialMapProvider;

    const selectedIntegrationName = useMemo(() => {
        const current = integrations.find((item) => item.id === selectedIntegrationId);
        return current ? `${current.name} (${current.provider})` : "";
    }, [integrations, selectedIntegrationId]);

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
                Общие настройки
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
                Здесь настраиваются базовые параметры компании и проекта.
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
                    Загрузка общих настроек...
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
                        Не удалось загрузить общие настройки
                    </div>
                    <div>{loadError}</div>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gap: "18px",
                        maxWidth: "980px",
                    }}
                >
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        style={{
                            height: "44px",
                            borderRadius: "12px",
                            border: "none",
                            background: saving || !hasChanges ? "#9ca3af" : "#2563eb",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: saving || !hasChanges ? "not-allowed" : "pointer",
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

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="company-name"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Название компании
                        </label>

                        <input
                            id="company-name"
                            type="text"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                setFormError("");
                            }}
                            placeholder="Введите название компании"
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                padding: "0 14px",
                                fontSize: "14px",
                                color: "#111827",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="company-timezone"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Часовой пояс
                        </label>

                        <select
                            id="company-timezone"
                            value={timezone}
                            onChange={(event) => {
                                setTimezone(event.target.value);
                                setFormError("");
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
                            {TIMEZONE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {formatTimezoneLabel(option)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="company-currency"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Валюта
                        </label>

                        <select
                            id="company-currency"
                            value={currency}
                            onChange={(event) => {
                                setCurrency(event.target.value);
                                setFormError("");
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
                            {CURRENCY_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="company-distance-unit"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Единицы расстояния
                        </label>

                        <select
                            id="company-distance-unit"
                            value={distanceUnit}
                            onChange={(event) => {
                                setDistanceUnit(event.target.value);
                                setFormError("");
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
                            {DISTANCE_UNIT_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option === "km" ? "Километры (km)" : "Мили (mi)"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                        <label
                            htmlFor="company-map-provider"
                            style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Провайдер карты
                        </label>

                        <select
                            id="company-map-provider"
                            value={mapProvider}
                            onChange={(event) => {
                                setMapProvider(event.target.value);
                                setFormError("");
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
                            {MAP_PROVIDER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
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

                    <div
                        style={{
                            border: "1px solid #e5e7eb",
                            background: "#f9fafb",
                            borderRadius: "16px",
                            padding: "16px",
                            display: "grid",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "18px",
                                fontWeight: 800,
                                color: "#111827",
                            }}
                        >
                            Настройки статусов карты
                        </div>

                        <div
                            style={{
                                fontSize: "14px",
                                color: "#4b5563",
                                lineHeight: 1.6,
                            }}
                        >
                            Здесь клиент может сопоставлять свои статусы интеграции с отображением на карте: этап системы, название, цвет, иконка и видимость.
                        </div>

                        <div style={{ display: "grid", gap: "8px" }}>
                            <label
                                htmlFor="map-status-integration"
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: "#111827",
                                }}
                            >
                                Интеграция для статусов карты
                            </label>

                            <select
                                id="map-status-integration"
                                value={selectedIntegrationId}
                                onChange={(event) => {
                                    setSelectedIntegrationId(event.target.value);
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
                                {integrations.length === 0 ? (
                                    <option value="">Нет доступных интеграций</option>
                                ) : (
                                    integrations.map((integration) => (
                                        <option key={integration.id} value={integration.id}>
                                            {integration.name} ({integration.provider})
                                            {integration.isDefault ? " — default" : ""}
                                        </option>
                                    ))
                                )}
                            </select>

                            {selectedIntegrationName ? (
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#6b7280",
                                    }}
                                >
                                    Активная интеграция: {selectedIntegrationName}
                                </div>
                            ) : null}
                        </div>

                        <div
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                background: "#ffffff",
                                overflowX: "auto",
                                overflowY: "hidden",
                            }}
                        >
                            <div style={{ minWidth: "1280px" }}>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "150px 180px 190px 190px 340px 130px 110px",
                                        gap: "12px",
                                        padding: "12px 14px",
                                        borderBottom: "1px solid #e5e7eb",
                                        background: "#f8fafc",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        color: "#475569",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>Raw status</div>
                                    <div>Этап системы</div>
                                    <div>Название на карте</div>
                                    <div>Цвет</div>
                                    <div>Иконка</div>
                                    <div>Показывать</div>
                                    <div>Действие</div>
                                </div>

                                <div
                                    style={{
                                        padding: "12px 14px",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMapStatusRows((prev) => [
                                                ...prev,
                                                {
                                                    id: `status-${Date.now()}-${Math.random()
                                                        .toString(36)
                                                        .slice(2, 8)}`,
                                                    rawStatus: "",
                                                    internalStage: "",
                                                    label: "",
                                                    color: "#2563eb",
                                                    iconUrl: "",
                                                    isVisible: true,
                                                },
                                            ]);
                                        }}
                                        style={{
                                            height: "40px",
                                            width: "fit-content",
                                            padding: "0 14px",
                                            borderRadius: "10px",
                                            border: "1px solid #cbd5e1",
                                            background: "#ffffff",
                                            color: "#1d4ed8",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        + Добавить статус
                                    </button>
                                </div>

                                {mapStatusRows.map((row) => (
                                    <div
                                        key={row.id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "150px 180px 190px 190px 340px 130px 110px",
                                            gap: "12px",
                                            padding: "14px",
                                            borderBottom: "1px solid #f1f5f9",
                                            alignItems: "center",
                                            fontSize: "14px",
                                            color: "#111827",
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={row.rawStatus}
                                            onChange={(event) => {
                                                const nextValue = event.target.value;

                                                setMapStatusRows((prev) =>
                                                    prev.map((item) =>
                                                        item.id === row.id
                                                            ? { ...item, rawStatus: nextValue }
                                                            : item
                                                    )
                                                );
                                            }}
                                            placeholder="new"
                                            style={{
                                                height: "38px",
                                                borderRadius: "10px",
                                                border: "1px solid #d1d5db",
                                                padding: "0 12px",
                                                fontSize: "14px",
                                                color: "#111827",
                                                outline: "none",
                                                background: "#ffffff",
                                                width: "100%",
                                                boxSizing: "border-box",
                                            }}
                                        />

                                        <select
                                            value={row.internalStage}
                                            onChange={(event) => {
                                                const nextValue = event.target.value;

                                                setMapStatusRows((prev) =>
                                                    prev.map((item) =>
                                                        item.id === row.id
                                                            ? { ...item, internalStage: nextValue }
                                                            : item
                                                    )
                                                );
                                            }}
                                            style={{
                                                height: "38px",
                                                borderRadius: "10px",
                                                border: "1px solid #d1d5db",
                                                padding: "0 12px",
                                                fontSize: "14px",
                                                color: "#111827",
                                                outline: "none",
                                                background: "#ffffff",
                                                width: "100%",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <option value="">Не выбран</option>
                                            {INTERNAL_STAGE_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>

                                        <input
                                            type="text"
                                            value={row.label}
                                            onChange={(event) => {
                                                setMapStatusRows((prev) =>
                                                    prev.map((item) =>
                                                        item.id === row.id
                                                            ? { ...item, label: event.target.value }
                                                            : item
                                                    )
                                                );
                                            }}
                                            placeholder="Название"
                                            style={{
                                                height: "38px",
                                                borderRadius: "10px",
                                                border: "1px solid #d1d5db",
                                                padding: "0 12px",
                                                fontSize: "14px",
                                                color: "#111827",
                                                outline: "none",
                                                background: "#ffffff",
                                                width: "100%",
                                                boxSizing: "border-box",
                                            }}
                                        />

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                minWidth: 0,
                                            }}
                                        >
                                            <input
                                                type="color"
                                                value={row.color}
                                                onChange={(event) => {
                                                    setMapStatusRows((prev) =>
                                                        prev.map((item) =>
                                                            item.id === row.id
                                                                ? {
                                                                    ...item,
                                                                    color: event.target.value,
                                                                }
                                                                : item
                                                        )
                                                    );
                                                }}
                                                style={{
                                                    width: "42px",
                                                    height: "38px",
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: "8px",
                                                    padding: "2px",
                                                    background: "#ffffff",
                                                    cursor: "pointer",
                                                    flexShrink: 0,
                                                }}
                                            />

                                            <input
                                                type="text"
                                                value={row.color}
                                                onChange={(event) => {
                                                    setMapStatusRows((prev) =>
                                                        prev.map((item) =>
                                                            item.id === row.id
                                                                ? {
                                                                    ...item,
                                                                    color: event.target.value,
                                                                }
                                                                : item
                                                        )
                                                    );
                                                }}
                                                placeholder="#2563eb"
                                                style={{
                                                    height: "38px",
                                                    borderRadius: "10px",
                                                    border: "1px solid #d1d5db",
                                                    padding: "0 12px",
                                                    fontSize: "14px",
                                                    color: "#111827",
                                                    outline: "none",
                                                    background: "#ffffff",
                                                    width: "100%",
                                                    boxSizing: "border-box",
                                                    minWidth: 0,
                                                }}
                                            />
                                        </div>

                                        <div
                                            style={{
                                                display: "grid",
                                                gap: "8px",
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <label
                                                    style={{
                                                        height: "36px",
                                                        padding: "0 12px",
                                                        borderRadius: "10px",
                                                        border: "1px solid #cbd5e1",
                                                        background: "#ffffff",
                                                        color: "#1d4ed8",
                                                        fontSize: "13px",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    Загрузить
                                                    <input
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                        style={{ display: "none" }}
                                                        onChange={async (event) => {
                                                            const file =
                                                                event.target.files?.[0] || null;

                                                            await handleUploadIcon(row.id, file);
                                                            event.target.value = "";
                                                        }}
                                                    />
                                                </label>

                                                <div
                                                    style={{
                                                        width: "36px",
                                                        height: "36px",
                                                        borderRadius: "10px",
                                                        border: "1px solid #d1d5db",
                                                        background: "#ffffff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {row.iconUrl ? (
                                                        <img
                                                            src={row.iconUrl}
                                                            alt=""
                                                            style={{
                                                                width: "20px",
                                                                height: "20px",
                                                                objectFit: "contain",
                                                            }}
                                                        />
                                                    ) : (
                                                        <span
                                                            style={{
                                                                fontSize: "12px",
                                                                color: "#9ca3af",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            —
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <input
                                                type="text"
                                                value={row.iconUrl}
                                                onChange={(event) => {
                                                    setMapStatusRows((prev) =>
                                                        prev.map((item) =>
                                                            item.id === row.id
                                                                ? {
                                                                    ...item,
                                                                    iconUrl: event.target.value,
                                                                }
                                                                : item
                                                        )
                                                    );
                                                }}
                                                placeholder="/uploads/map-status-icons/icon.svg"
                                                style={{
                                                    height: "38px",
                                                    borderRadius: "10px",
                                                    border: "1px solid #d1d5db",
                                                    padding: "0 12px",
                                                    fontSize: "14px",
                                                    color: "#111827",
                                                    outline: "none",
                                                    background: "#ffffff",
                                                    width: "100%",
                                                    boxSizing: "border-box",
                                                    minWidth: 0,
                                                }}
                                            />
                                        </div>

                                        <label
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                fontSize: "14px",
                                                color: "#111827",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={row.isVisible}
                                                onChange={(event) => {
                                                    setMapStatusRows((prev) =>
                                                        prev.map((item) =>
                                                            item.id === row.id
                                                                ? {
                                                                    ...item,
                                                                    isVisible:
                                                                        event.target.checked,
                                                                }
                                                                : item
                                                        )
                                                    );
                                                }}
                                            />
                                            <span>{row.isVisible ? "Да" : "Нет"}</span>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMapStatusRows((prev) =>
                                                    prev.filter((item) => item.id !== row.id)
                                                );
                                            }}
                                            style={{
                                                height: "38px",
                                                borderRadius: "10px",
                                                border: "1px solid #fecaca",
                                                background: "#fef2f2",
                                                color: "#b91c1c",
                                                fontSize: "13px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveMapStatuses}
                            disabled={saving || !selectedIntegrationId}
                            style={{
                                height: "44px",
                                borderRadius: "12px",
                                border: "none",
                                background:
                                    saving || !selectedIntegrationId ? "#9ca3af" : "#2563eb",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: 700,
                                cursor:
                                    saving || !selectedIntegrationId ? "not-allowed" : "pointer",
                                width: "fit-content",
                                padding: "0 16px",
                            }}
                        >
                            {saving ? "Сохранение..." : "Сохранить статусы карты"}
                        </button>
                    </div>

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
                        На этом шаге мы только сохраняем предпочтительный провайдер карты.
                        <br />
                        На следующем шаге подключим использование этой настройки на странице карты.
                    </div>
                </div>
            )}
        </main>
    );
}