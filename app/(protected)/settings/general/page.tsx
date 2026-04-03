"use client";

import { useEffect, useState } from "react";
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
] as const;


function formatTimezoneLabel(timezone: string) {
    return timezone.replaceAll("_", " / ");
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

    useEffect(() => {
        loadSettings();
    }, []);

    const hasChanges =
        name !== initialName ||
        timezone !== initialTimezone ||
        currency !== initialCurrency ||
        distanceUnit !== initialDistanceUnit ||
        mapProvider !== initialMapProvider;

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
                            border: "1px solid #dbeafe",
                            background: "#eff6ff",
                            color: "#1e3a8a",
                            borderRadius: "16px",
                            padding: "16px",
                            fontSize: "14px",
                            lineHeight: 1.7,
                        }}
                    >
                        На этом шаге сохраняется базовая конфигурация проекта: название компании, часовой пояс, валюта, единицы расстояния и провайдер карты.
                        <br />
                        Выбранный провайдер карты уже используется на странице карты.
                    </div>
                </div>
            )}
        </main>
    );
}