"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import YandexMap from "@/components/map/YandexMap";

type DeliveryZone = {
    id: string;
    name: string;
    color: string;
    polygonJson: string;
    price: string | null;
    priority: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

type ImportedZoneFile = {
    name?: string;
    color?: string;
    price?: string | number | null;
    priority?: number | string;
    polygonJson?: unknown;
    polygon?: unknown;
    coordinates?: unknown;
    points?: unknown;
    type?: unknown;
    geometry?: unknown;
    features?: unknown;
    properties?: unknown;
};

type BulkImportZoneInput = {
    name: string;
    color: string;
    price: string | null;
    priority: number;
    polygonJson: string;
    isActive: boolean;
};

const DEFAULT_POLYGON_JSON = JSON.stringify(
    [
        [55.751244, 37.618423],
        [55.761244, 37.628423],
        [55.741244, 37.638423],
    ],
    null,
    2
);

function isPolygonPoint(value: unknown): value is [number, number] {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        typeof value[0] === "number" &&
        Number.isFinite(value[0]) &&
        typeof value[1] === "number" &&
        Number.isFinite(value[1])
    );
}

function parsePolygonPoints(raw: string): [number, number][] {
    try {
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(isPolygonPoint);
    } catch {
        return [];
    }
}

function extractZoneMetaFromImportedFile(parsed: unknown) {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {
            name: "",
            color: "",
            price: "",
            priority: "",
        };
    }

    const objectValue = parsed as ImportedZoneFile;

    return {
        name: typeof objectValue.name === "string" ? objectValue.name.trim() : "",
        color: typeof objectValue.color === "string" ? objectValue.color.trim() : "",
        price:
            objectValue.price === null || objectValue.price === undefined
                ? ""
                : String(objectValue.price).trim(),
        priority:
            objectValue.priority === null || objectValue.priority === undefined
                ? ""
                : String(objectValue.priority).trim(),
    };
}

function extractPolygonFromImportedFile(data: unknown): [number, number][] | null {
    if (Array.isArray(data) && Array.isArray(data[0])) {
        const points = data.filter(isPolygonPoint);
        return points.length >= 3 ? points : null;
    }

    if (!data || typeof data !== "object") {
        return null;
    }

    const objectValue = data as Record<string, unknown>;

    if (Array.isArray(objectValue.polygon)) {
        const points = objectValue.polygon.filter(isPolygonPoint);
        return points.length >= 3 ? points : null;
    }

    if (Array.isArray(objectValue.polygonJson)) {
        const points = objectValue.polygonJson.filter(isPolygonPoint);
        return points.length >= 3 ? points : null;
    }

    if (Array.isArray(objectValue.coordinates)) {
        const points = objectValue.coordinates.filter(isPolygonPoint);
        return points.length >= 3 ? points : null;
    }

    if (Array.isArray(objectValue.points)) {
        const points = objectValue.points.filter(isPolygonPoint);
        return points.length >= 3 ? points : null;
    }

    if (objectValue.type === "Feature" && objectValue.geometry && typeof objectValue.geometry === "object") {
        const geometry = objectValue.geometry as Record<string, unknown>;
        const coordinates = geometry.coordinates;

        if (
            geometry.type === "Polygon" &&
            Array.isArray(coordinates) &&
            Array.isArray(coordinates[0])
        ) {
            const outerRing = coordinates[0];

            if (Array.isArray(outerRing)) {
                const points = outerRing
                    .filter(
                        (point): point is [number, number] =>
                            Array.isArray(point) &&
                            point.length === 2 &&
                            typeof point[0] === "number" &&
                            Number.isFinite(point[0]) &&
                            typeof point[1] === "number" &&
                            Number.isFinite(point[1])
                    )
                    .map(([lon, lat]) => [lat, lon] as [number, number]);

                return points.length >= 3 ? points : null;
            }
        }
    }

    if (objectValue.type === "FeatureCollection" && Array.isArray(objectValue.features)) {
        const firstFeature = objectValue.features[0];

        if (firstFeature && typeof firstFeature === "object") {
            const feature = firstFeature as Record<string, unknown>;
            const geometry = feature.geometry;

            if (geometry && typeof geometry === "object") {
                const geometryObject = geometry as Record<string, unknown>;
                const coordinates = geometryObject.coordinates;

                if (
                    geometryObject.type === "Polygon" &&
                    Array.isArray(coordinates) &&
                    Array.isArray(coordinates[0])
                ) {
                    const outerRing = coordinates[0];

                    if (Array.isArray(outerRing)) {
                        const points = outerRing
                            .filter(
                                (point): point is [number, number] =>
                                    Array.isArray(point) &&
                                    point.length === 2 &&
                                    typeof point[0] === "number" &&
                                    Number.isFinite(point[0]) &&
                                    typeof point[1] === "number" &&
                                    Number.isFinite(point[1])
                            )
                            .map(([lon, lat]) => [lat, lon] as [number, number]);

                        return points.length >= 3 ? points : null;
                    }
                }
            }
        }
    }

    return null;
}

function extractBulkZonesFromImportedFile(parsed: unknown): BulkImportZoneInput[] {
    if (!parsed || typeof parsed !== "object") {
        return [];
    }

    const objectValue = parsed as ImportedZoneFile;

    if (objectValue.type !== "FeatureCollection" || !Array.isArray(objectValue.features)) {
        return [];
    }

    const zones: BulkImportZoneInput[] = [];

    objectValue.features.forEach((feature, index) => {
        if (!feature || typeof feature !== "object") {
            return;
        }

        const featureObject = feature as Record<string, unknown>;
        const geometry =
            featureObject.geometry && typeof featureObject.geometry === "object"
                ? (featureObject.geometry as Record<string, unknown>)
                : null;

        const properties =
            featureObject.properties && typeof featureObject.properties === "object"
                ? (featureObject.properties as Record<string, unknown>)
                : null;

        const coordinates = geometry?.coordinates;

        if (
            geometry?.type !== "Polygon" ||
            !Array.isArray(coordinates) ||
            !Array.isArray(coordinates[0])
        ) {
            return;
        }

        const outerRing = coordinates[0];

        if (!Array.isArray(outerRing)) {
            return;
        }

        const points = outerRing
            .filter(
                (point): point is [number, number] =>
                    Array.isArray(point) &&
                    point.length === 2 &&
                    typeof point[0] === "number" &&
                    Number.isFinite(point[0]) &&
                    typeof point[1] === "number" &&
                    Number.isFinite(point[1])
            )
            .map(([lon, lat]) => [lat, lon] as [number, number]);

        if (points.length < 3) {
            return;
        }

        const nameFromProperties =
            typeof properties?.name === "string"
                ? properties.name.trim()
                : typeof properties?.title === "string"
                    ? properties.title.trim()
                    : typeof properties?.NAME === "string"
                        ? properties.NAME.trim()
                        : "";

        const colorFromProperties =
            typeof properties?.color === "string"
                ? properties.color.trim()
                : typeof properties?.stroke === "string"
                    ? properties.stroke.trim()
                    : "#2563eb";

        const priceFromProperties =
            properties?.price === null || properties?.price === undefined
                ? null
                : String(properties.price).trim();

        const priorityRaw =
            properties?.priority === null || properties?.priority === undefined
                ? 100
                : Number(properties.priority);

        zones.push({
            name: nameFromProperties || `Импортированная зона ${index + 1}`,
            color: colorFromProperties || "#2563eb",
            price: priceFromProperties && priceFromProperties.length > 0 ? priceFromProperties : null,
            priority: Number.isFinite(priorityRaw) ? priorityRaw : 100,
            polygonJson: JSON.stringify(points),
            isActive: true,
        });
    });

    return zones;
}

export default function ZonesPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [toggleLoadingZoneId, setToggleLoadingZoneId] = useState("");
    const [editingZoneId, setEditingZoneId] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState("");
    const [focusedZoneId, setFocusedZoneId] = useState("");
    const [bulkImporting, setBulkImporting] = useState(false);
    const [createDrawMode, setCreateDrawMode] = useState(false);
    const [editDrawMode, setEditDrawMode] = useState(false);

    const [zoneName, setZoneName] = useState("");
    const [zoneColor, setZoneColor] = useState("#2563eb");
    const [zonePrice, setZonePrice] = useState("");
    const [zonePriority, setZonePriority] = useState("100");
    const [zonePolygonJson, setZonePolygonJson] = useState(DEFAULT_POLYGON_JSON);

    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("#2563eb");
    const [editPrice, setEditPrice] = useState("");
    const [editPriority, setEditPriority] = useState("100");
    const [editPolygonJson, setEditPolygonJson] = useState(DEFAULT_POLYGON_JSON);
    const [deletingZoneId, setDeletingZoneId] = useState("");

    async function loadZones() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/settings/routing/zones", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result: ApiResponse<DeliveryZone[]> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !Array.isArray(result.data)) {
                throw new Error(result.message || "Не удалось загрузить зоны");
            }

            setZones(result.data);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка загрузки зон";

            setError(message);
        } finally {
            setLoading(false);
        }
    }

    function validatePolygonText(raw: string): string | null {
        if (!raw.trim()) {
            return "polygonJson обязателен";
        }

        try {
            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed) || parsed.length < 3) {
                return "polygonJson должен содержать массив минимум из 3 точек";
            }
        } catch {
            return "polygonJson должен быть валидным JSON";
        }

        return null;
    }

    async function readJsonFile(file: File): Promise<unknown> {
        const text = await file.text();

        try {
            return JSON.parse(text);
        } catch {
            throw new Error("Файл должен содержать валидный JSON");
        }
    }

    function handleCreateMapClickPoint(point: [number, number]) {
        const currentPoints = parsePolygonPoints(zonePolygonJson);
        const nextPoints = [...currentPoints, point];

        setZonePolygonJson(JSON.stringify(nextPoints, null, 2));
        setCreateError("");
    }

    function handleCreateDraftPointDrag(index: number, point: [number, number]) {
        const currentPoints = parsePolygonPoints(zonePolygonJson);

        if (index < 0 || index >= currentPoints.length) {
            return;
        }

        const nextPoints = [...currentPoints];
        nextPoints[index] = point;

        setZonePolygonJson(JSON.stringify(nextPoints, null, 2));
        setCreateError("");
    }

    function handleClearCreateDraftPoints() {
        setZonePolygonJson(JSON.stringify([], null, 2));
        setCreateError("");
    }

    function handleEditMapClickPoint(point: [number, number]) {
        const currentPoints = parsePolygonPoints(editPolygonJson);
        const nextPoints = [...currentPoints, point];

        setEditPolygonJson(JSON.stringify(nextPoints, null, 2));
        setEditError("");
    }

    function handleEditDraftPointDrag(index: number, point: [number, number]) {
        const currentPoints = parsePolygonPoints(editPolygonJson);

        if (index < 0 || index >= currentPoints.length) {
            return;
        }

        const nextPoints = [...currentPoints];
        nextPoints[index] = point;

        setEditPolygonJson(JSON.stringify(nextPoints, null, 2));
        setEditError("");
    }

    function handleRemoveLastEditDraftPoint() {
        const currentPoints = parsePolygonPoints(editPolygonJson);

        if (currentPoints.length === 0) {
            return;
        }

        const nextPoints = currentPoints.slice(0, -1);

        setEditPolygonJson(JSON.stringify(nextPoints, null, 2));
        setEditError("");
    }

    function handleClearEditDraftPoints() {
        setEditPolygonJson(JSON.stringify([], null, 2));
        setEditError("");
    }

    function handleRemoveLastCreateDraftPoint() {
        const currentPoints = parsePolygonPoints(zonePolygonJson);

        if (currentPoints.length === 0) {
            return;
        }

        const nextPoints = currentPoints.slice(0, -1);

        setZonePolygonJson(JSON.stringify(nextPoints, null, 2));
        setCreateError("");
    }

    async function handleCreateFileImport(event: ChangeEvent<HTMLInputElement>) {
        try {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            const parsed = await readJsonFile(file);

            const bulkZones = extractBulkZonesFromImportedFile(parsed);

            if (bulkZones.length > 1) {
                setBulkImporting(true);
                setCreateError("");

                const response = await fetch("/api/settings/routing/zones", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        zones: bulkZones,
                    }),
                });

                const result: ApiResponse<DeliveryZone[]> = await response.json();

                if (response.status === 401) {
                    router.replace("/login");
                    return;
                }

                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Не удалось импортировать зоны");
                }

                await loadZones();
                return;
            }

            const polygon = extractPolygonFromImportedFile(parsed);

            if (!polygon) {
                throw new Error(
                    "Не удалось найти полигон в файле. Ожидается массив точек [[lat, lon], ...], GeoJSON Polygon или FeatureCollection"
                );
            }

            const meta = extractZoneMetaFromImportedFile(parsed);

            setZonePolygonJson(JSON.stringify(polygon, null, 2));

            if (meta.name) {
                setZoneName(meta.name);
            }

            if (meta.color) {
                setZoneColor(meta.color);
            }

            if (meta.price) {
                setZonePrice(meta.price);
            }

            if (meta.priority) {
                setZonePriority(meta.priority);
            }

            setCreateError("");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Не удалось загрузить файл";

            setCreateError(message);
        } finally {
            setBulkImporting(false);
            event.target.value = "";
        }
    }

    async function handleEditFileImport(event: ChangeEvent<HTMLInputElement>) {
        try {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            const parsed = await readJsonFile(file);
            const polygon = extractPolygonFromImportedFile(parsed);

            if (!polygon) {
                throw new Error(
                    "Не удалось найти полигон в файле. Ожидается массив точек [[lat, lon], ...], GeoJSON Polygon или FeatureCollection"
                );
            }

            const meta = extractZoneMetaFromImportedFile(parsed);

            setEditPolygonJson(JSON.stringify(polygon, null, 2));

            if (meta.name) {
                setEditName(meta.name);
            }

            if (meta.color) {
                setEditColor(meta.color);
            }

            if (meta.price) {
                setEditPrice(meta.price);
            }

            if (meta.priority) {
                setEditPriority(meta.priority);
            }

            setEditError("");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Не удалось загрузить файл";

            setEditError(message);
        } finally {
            event.target.value = "";
        }
    }

    async function handleCreateZone() {
        try {
            if (!zoneName.trim()) {
                setCreateError("Название зоны обязательно");
                return;
            }

            const polygonError = validatePolygonText(zonePolygonJson);

            if (polygonError) {
                setCreateError(polygonError);
                return;
            }

            setCreating(true);
            setCreateError("");

            const response = await fetch("/api/settings/routing/zones", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name: zoneName,
                    color: zoneColor,
                    price: zonePrice.trim() ? zonePrice.trim() : null,
                    priority: Number(zonePriority) || 100,
                    polygonJson: zonePolygonJson,
                    isActive: true,
                }),
            });

            const result: ApiResponse<DeliveryZone> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Не удалось создать зону");
            }

            setZoneName("");
            setZoneColor("#2563eb");
            setZonePrice("");
            setZonePriority("100");
            setZonePolygonJson(DEFAULT_POLYGON_JSON);
            setCreateDrawMode(false);

            await loadZones();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка создания зоны";

            setCreateError(message);
        } finally {
            setCreating(false);
        }
    }

    async function handleToggleZone(zone: DeliveryZone) {
        try {
            setToggleLoadingZoneId(zone.id);
            setError("");

            const response = await fetch("/api/settings/routing/zones", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    id: zone.id,
                    isActive: !zone.isActive,
                }),
            });

            const result: ApiResponse<DeliveryZone> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Не удалось обновить зону");
            }

            setZones((currentZones) =>
                currentZones.map((currentZone) =>
                    currentZone.id === zone.id ? result.data! : currentZone
                )
            );

            if (zone.isActive && focusedZoneId === zone.id) {
                setFocusedZoneId("");
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка обновления зоны";

            setError(message);
        } finally {
            setToggleLoadingZoneId("");
        }
    }

    async function handleDeleteZone(zone: DeliveryZone) {
        const confirmed = window.confirm(
            `Удалить зону "${zone.name}"? Это действие нельзя отменить.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingZoneId(zone.id);
            setError("");

            const response = await fetch("/api/settings/routing/zones", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    id: zone.id,
                }),
            });

            const result: ApiResponse<null> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось удалить зону");
            }

            setZones((currentZones) =>
                currentZones.filter((currentZone) => currentZone.id !== zone.id)
            );

            if (focusedZoneId === zone.id) {
                setFocusedZoneId("");
            }

            if (editingZoneId === zone.id) {
                cancelEditZone();
            }
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка удаления зоны";

            setError(message);
        } finally {
            setDeletingZoneId("");
        }
    }

    function startEditZone(zone: DeliveryZone) {
        setEditingZoneId(zone.id);
        setEditError("");
        setEditName(zone.name);
        setEditColor(zone.color);
        setEditPrice(zone.price ?? "");
        setEditPriority(String(zone.priority));
        setEditPolygonJson(zone.polygonJson);
        setFocusedZoneId(zone.id);
        setEditDrawMode(false);
    }

    function cancelEditZone() {
        setEditingZoneId("");
        setSavingEdit(false);
        setEditError("");
        setEditName("");
        setEditColor("#2563eb");
        setEditPrice("");
        setEditPriority("100");
        setEditPolygonJson(DEFAULT_POLYGON_JSON);
    }

    async function handleSaveEditZone(zoneId: string) {
        try {
            if (!editName.trim()) {
                setEditError("Название зоны обязательно");
                return;
            }

            const polygonError = validatePolygonText(editPolygonJson);

            if (polygonError) {
                setEditError(polygonError);
                return;
            }

            setSavingEdit(true);
            setEditError("");

            const response = await fetch("/api/settings/routing/zones", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    id: zoneId,
                    name: editName,
                    color: editColor,
                    price: editPrice.trim() ? editPrice.trim() : null,
                    priority: Number(editPriority) || 100,
                    polygonJson: editPolygonJson,
                }),
            });

            const result: ApiResponse<DeliveryZone> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success || !result.data) {
                throw new Error(result.message || "Не удалось сохранить изменения зоны");
            }

            setZones((currentZones) =>
                currentZones.map((currentZone) =>
                    currentZone.id === zoneId ? result.data! : currentZone
                )
            );

            setFocusedZoneId(zoneId);
            cancelEditZone();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка сохранения зоны";

            setEditError(message);
        } finally {
            setSavingEdit(false);
        }
    }

    const visibleZonesForMap = useMemo(() => {
        if (!focusedZoneId) {
            return zones;
        }

        return zones.filter((zone) => zone.id === focusedZoneId);
    }, [zones, focusedZoneId]);

    const createDraftPolygonPoints = useMemo(() => {
        return parsePolygonPoints(zonePolygonJson);
    }, [zonePolygonJson]);

    const editDraftPolygonPoints = useMemo(() => {
        return parsePolygonPoints(editPolygonJson);
    }, [editPolygonJson]);

    useEffect(() => {
        loadZones();
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
                Зоны (полигоны)
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
                Здесь настраиваются геозоны, полигоны доставки, ограничения по зонам и стоимость доставки по зонам.
            </p>

            <div
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "16px",
                    background: "#f9fafb",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginBottom: "12px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: "18px",
                                fontWeight: 800,
                                color: "#111827",
                                marginBottom: "6px",
                            }}
                        >
                            Карта зон
                        </div>

                        <div
                            style={{
                                fontSize: "14px",
                                color: "#4b5563",
                                lineHeight: 1.6,
                            }}
                        >
                            {focusedZoneId
                                ? "Сейчас на карте показана одна выбранная зона."
                                : "Сейчас на карте показаны все активные зоны."}
                        </div>
                    </div>

                    {focusedZoneId ? (
                        <button
                            type="button"
                            onClick={() => setFocusedZoneId("")}
                            style={{
                                height: "40px",
                                borderRadius: "12px",
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: "14px",
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: "0 14px",
                            }}
                        >
                            Показать все зоны
                        </button>
                    ) : null}
                </div>

                <div
                    style={{
                        width: "100%",
                        minHeight: "420px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "1px solid #d1d5db",
                        background: "#ffffff",
                    }}
                >
                    <YandexMap
                        orders={[]}
                        routeOrders={[]}
                        routeGroups={[]}
                        mapStatusConfig={[]}
                        deliveryZones={[]}
                        drawMode={createDrawMode}
                        draftPolygonPoints={createDraftPolygonPoints}
                        onMapClickPoint={handleCreateMapClickPoint}
                        onDraftPointDrag={handleCreateDraftPointDrag}
                    />
                </div>
            </div>

            <div
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "16px",
                    background: "#f9fafb",
                    display: "grid",
                    gap: "12px",
                    maxWidth: "860px",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#111827",
                    }}
                >
                    Создать зону
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setEditDrawMode((current) => !current)}
                        style={{
                            height: "40px",
                            borderRadius: "12px",
                            border: "1px solid #d1d5db",
                            background: editDrawMode ? "#eff6ff" : "#ffffff",
                            color: "#111827",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: "0 14px",
                        }}
                    >
                        {editDrawMode ? "Завершить рисование" : "Рисовать на карте"}
                    </button>

                    <button
                        type="button"
                        onClick={handleRemoveLastEditDraftPoint}
                        style={{
                            height: "40px",
                            borderRadius: "12px",
                            border: "1px solid #d1d5db",
                            background: "#ffffff",
                            color: "#111827",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: "0 14px",
                        }}
                    >
                        Удалить последнюю точку
                    </button>

                    <button
                        type="button"
                        onClick={handleClearEditDraftPoints}
                        style={{
                            height: "40px",
                            borderRadius: "12px",
                            border: "1px solid #d1d5db",
                            background: "#ffffff",
                            color: "#111827",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: "0 14px",
                        }}
                    >
                        Очистить точки
                    </button>
                </div>

                <div
                    style={{
                        width: "100%",
                        minHeight: "360px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: editDrawMode ? "2px solid #2563eb" : "1px solid #d1d5db",
                        background: "#ffffff",
                    }}
                >
                    <YandexMap
                        orders={[]}
                        routeOrders={[]}
                        routeGroups={[]}
                        mapStatusConfig={[]}
                        deliveryZones={[]}
                        drawMode={editDrawMode}
                        draftPolygonPoints={editDraftPolygonPoints}
                        onMapClickPoint={handleEditMapClickPoint}
                        onDraftPointDrag={handleEditDraftPointDrag}
                    />
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "12px",
                    }}
                >
                    <input
                        type="text"
                        value={zoneName}
                        onChange={(event) => {
                            setZoneName(event.target.value);
                            setCreateError("");
                        }}
                        placeholder="Название зоны"
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

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#ffffff",
                            border: "1px solid #d1d5db",
                            borderRadius: "12px",
                            padding: "0 12px",
                            height: "44px",
                        }}
                    >
                        <input
                            type="color"
                            value={zoneColor}
                            onChange={(event) => setZoneColor(event.target.value)}
                            style={{
                                width: "28px",
                                height: "28px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                padding: 0,
                            }}
                        />
                        <input
                            type="text"
                            value={zoneColor}
                            onChange={(event) => setZoneColor(event.target.value)}
                            placeholder="#2563eb"
                            style={{
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                color: "#111827",
                                width: "100%",
                                background: "transparent",
                            }}
                        />
                    </div>

                    <input
                        type="text"
                        value={zonePrice}
                        onChange={(event) => setZonePrice(event.target.value)}
                        placeholder="Стоимость (например 500.00)"
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

                    <input
                        type="number"
                        value={zonePriority}
                        onChange={(event) => setZonePriority(event.target.value)}
                        placeholder="Приоритет"
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

                <textarea
                    value={zonePolygonJson}
                    onChange={(event) => {
                        setZonePolygonJson(event.target.value);
                        setCreateError("");
                    }}
                    placeholder='[[55.751244, 37.618423], [55.761244, 37.628423], [55.741244, 37.638423]]'
                    style={{
                        minHeight: "140px",
                        borderRadius: "12px",
                        border: "1px solid #d1d5db",
                        padding: "12px 14px",
                        fontSize: "14px",
                        color: "#111827",
                        outline: "none",
                        background: "#ffffff",
                        resize: "vertical",
                        fontFamily: "monospace",
                    }}
                />

                {createError ? (
                    <div
                        style={{
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            borderRadius: "12px",
                            padding: "12px",
                            fontSize: "14px",
                            lineHeight: 1.6,
                        }}
                    >
                        {createError}
                    </div>
                ) : null}

                <button
                    type="button"
                    onClick={handleCreateZone}
                    disabled={creating || bulkImporting}
                    style={{
                        height: "44px",
                        borderRadius: "12px",
                        border: "none",
                        background: creating || bulkImporting ? "#9ca3af" : "#2563eb",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: 700,
                        cursor: creating || bulkImporting ? "not-allowed" : "pointer",
                        width: "fit-content",
                        padding: "0 16px",
                    }}
                >
                    {creating ? "Создание..." : "Создать зону"}
                </button>
            </div>

            {error ? (
                <div
                    style={{
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        borderRadius: "16px",
                        padding: "16px",
                        fontSize: "14px",
                        lineHeight: 1.6,
                        marginBottom: "16px",
                    }}
                >
                    <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                        Ошибка
                    </div>
                    <div>{error}</div>
                </div>
            ) : null}

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
                    Загрузка зон...
                </div>
            ) : zones.length === 0 ? (
                <div
                    style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        padding: "18px",
                        background: "#f9fafb",
                        fontSize: "14px",
                        color: "#4b5563",
                        lineHeight: 1.6,
                    }}
                >
                    Зон пока нет. Создай первую зону выше.
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gap: "12px",
                        maxWidth: "860px",
                    }}
                >
                    {zones.map((zone) => {
                        const isToggling = toggleLoadingZoneId === zone.id;
                        const isEditing = editingZoneId === zone.id;
                        const isFocused = focusedZoneId === zone.id;
                        const isDeleting = deletingZoneId === zone.id;

                        return (
                            <div
                                key={zone.id}
                                style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "16px",
                                    padding: "16px",
                                    background: "#ffffff",
                                    display: "grid",
                                    gap: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "14px",
                                                height: "14px",
                                                borderRadius: "999px",
                                                background: zone.color,
                                                display: "inline-block",
                                                border: "1px solid #d1d5db",
                                                flexShrink: 0,
                                            }}
                                        />

                                        <div
                                            style={{
                                                fontSize: "18px",
                                                fontWeight: 800,
                                                color: "#111827",
                                            }}
                                        >
                                            {zone.name}
                                        </div>
                                    </div>

                                    <span
                                        style={{
                                            display: "inline-flex",
                                            padding: "6px 10px",
                                            borderRadius: "999px",
                                            background: zone.isActive ? "#dcfce7" : "#f3f4f6",
                                            color: zone.isActive ? "#166534" : "#374151",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {zone.isActive ? "Активна" : "Неактивна"}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                        gap: "12px",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                color: "#6b7280",
                                                textTransform: "uppercase",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Стоимость
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#111827",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {zone.price ?? "Не задана"}
                                        </div>
                                    </div>

                                    <div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                color: "#6b7280",
                                                textTransform: "uppercase",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Приоритет
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#111827",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {zone.priority}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleToggleZone(zone)}
                                        disabled={isToggling || savingEdit}
                                        style={{
                                            height: "40px",
                                            borderRadius: "12px",
                                            border: "1px solid #d1d5db",
                                            background: "#ffffff",
                                            color: "#111827",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            cursor: isToggling || savingEdit ? "not-allowed" : "pointer",
                                            padding: "0 14px",
                                        }}
                                    >
                                        {isToggling
                                            ? "Сохранение..."
                                            : zone.isActive
                                                ? "Отключить"
                                                : "Включить"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => startEditZone(zone)}
                                        disabled={savingEdit}
                                        style={{
                                            height: "40px",
                                            borderRadius: "12px",
                                            border: "1px solid #d1d5db",
                                            background: "#ffffff",
                                            color: "#111827",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            cursor: savingEdit ? "not-allowed" : "pointer",
                                            padding: "0 14px",
                                        }}
                                    >
                                        Редактировать
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFocusedZoneId(isFocused ? "" : zone.id)
                                        }
                                        style={{
                                            height: "40px",
                                            borderRadius: "12px",
                                            border: "1px solid #d1d5db",
                                            background: isFocused ? "#eff6ff" : "#ffffff",
                                            color: "#111827",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            padding: "0 14px",
                                        }}
                                    >
                                        {isFocused ? "Показать все зоны" : "Показать на карте"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteZone(zone)}
                                        disabled={isDeleting || savingEdit}
                                        style={{
                                            height: "40px",
                                            borderRadius: "12px",
                                            border: "1px solid #fecaca",
                                            background: "#ffffff",
                                            color: "#b91c1c",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            cursor: isDeleting || savingEdit ? "not-allowed" : "pointer",
                                            padding: "0 14px",
                                        }}
                                    >
                                        {isDeleting ? "Удаление..." : "Удалить"}
                                    </button>
                                </div>

                                {isEditing ? (
                                    <div
                                        style={{
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "16px",
                                            padding: "16px",
                                            background: "#f9fafb",
                                            display: "grid",
                                            gap: "12px",
                                            marginTop: "4px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: 800,
                                                color: "#111827",
                                            }}
                                        >
                                            Редактирование зоны
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "10px",
                                                flexWrap: "wrap",
                                                alignItems: "center",
                                            }}
                                        >
                                            <label
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    height: "40px",
                                                    padding: "0 14px",
                                                    borderRadius: "12px",
                                                    border: "1px solid #d1d5db",
                                                    background: "#ffffff",
                                                    color: "#111827",
                                                    fontSize: "14px",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Загрузить JSON файл
                                                <input
                                                    type="file"
                                                    accept=".json,.geojson,application/json"
                                                    onChange={handleEditFileImport}
                                                    style={{ display: "none" }}
                                                />
                                            </label>

                                            <div
                                                style={{
                                                    fontSize: "13px",
                                                    color: "#6b7280",
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                Для редактирования загружается один полигон из файла.
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                                gap: "12px",
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(event) => {
                                                    setEditName(event.target.value);
                                                    setEditError("");
                                                }}
                                                placeholder="Название зоны"
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

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    background: "#ffffff",
                                                    border: "1px solid #d1d5db",
                                                    borderRadius: "12px",
                                                    padding: "0 12px",
                                                    height: "44px",
                                                }}
                                            >
                                                <input
                                                    type="color"
                                                    value={editColor}
                                                    onChange={(event) => {
                                                        setEditColor(event.target.value);
                                                        setEditError("");
                                                    }}
                                                    style={{
                                                        width: "28px",
                                                        height: "28px",
                                                        border: "none",
                                                        background: "transparent",
                                                        cursor: "pointer",
                                                        padding: 0,
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    value={editColor}
                                                    onChange={(event) => {
                                                        setEditColor(event.target.value);
                                                        setEditError("");
                                                    }}
                                                    placeholder="#2563eb"
                                                    style={{
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: "14px",
                                                        color: "#111827",
                                                        width: "100%",
                                                        background: "transparent",
                                                    }}
                                                />
                                            </div>

                                            <input
                                                type="text"
                                                value={editPrice}
                                                onChange={(event) => {
                                                    setEditPrice(event.target.value);
                                                    setEditError("");
                                                }}
                                                placeholder="Стоимость (например 500.00)"
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

                                            <input
                                                type="number"
                                                value={editPriority}
                                                onChange={(event) => {
                                                    setEditPriority(event.target.value);
                                                    setEditError("");
                                                }}
                                                placeholder="Приоритет"
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

                                        <textarea
                                            value={editPolygonJson}
                                            onChange={(event) => {
                                                setEditPolygonJson(event.target.value);
                                                setEditError("");
                                            }}
                                            placeholder='[[55.751244, 37.618423], [55.761244, 37.628423], [55.741244, 37.638423]]'
                                            style={{
                                                minHeight: "140px",
                                                borderRadius: "12px",
                                                border: "1px solid #d1d5db",
                                                padding: "12px 14px",
                                                fontSize: "14px",
                                                color: "#111827",
                                                outline: "none",
                                                background: "#ffffff",
                                                resize: "vertical",
                                                fontFamily: "monospace",
                                            }}
                                        />

                                        {editError ? (
                                            <div
                                                style={{
                                                    border: "1px solid #fecaca",
                                                    background: "#fef2f2",
                                                    color: "#b91c1c",
                                                    borderRadius: "12px",
                                                    padding: "12px",
                                                    fontSize: "14px",
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                {editError}
                                            </div>
                                        ) : null}

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEditZone(zone.id)}
                                                disabled={savingEdit}
                                                style={{
                                                    height: "44px",
                                                    borderRadius: "12px",
                                                    border: "none",
                                                    background: savingEdit ? "#9ca3af" : "#2563eb",
                                                    color: "#ffffff",
                                                    fontSize: "14px",
                                                    fontWeight: 700,
                                                    cursor: savingEdit ? "not-allowed" : "pointer",
                                                    padding: "0 16px",
                                                }}
                                            >
                                                {savingEdit ? "Сохранение..." : "Сохранить"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={cancelEditZone}
                                                disabled={savingEdit}
                                                style={{
                                                    height: "44px",
                                                    borderRadius: "12px",
                                                    border: "1px solid #d1d5db",
                                                    background: "#ffffff",
                                                    color: "#111827",
                                                    fontSize: "14px",
                                                    fontWeight: 700,
                                                    cursor: savingEdit ? "not-allowed" : "pointer",
                                                    padding: "0 16px",
                                                }}
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}