"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import YandexMap from "../../../components/map/YandexMap";
import styles from "./page.module.css";

type Order = {
    id: number;
    title: string;
    status: string;
    textAddress?: string | null;
    deliveryTypeCode?: string;
    deliveryTypeName?: string;
    deliveryFrom?: string;
    deliveryTo?: string;
    courierId?: number | null;
    courierName?: string | null;
    coordinates: [number, number] | null;
};

type Courier = {
    id: number | string;
    firstName: string;
    lastName: string;
    fullName: string;
    active: boolean;
};
type AiCourierContext = {
    id: string;
    name: string;
    type: "walk" | "car";
    shiftStart: string;
    shiftEnd: string;
    maxOrders: number;
};
type SavedRoute = {
    id: number;
    date: string | null;
    orders: Order[];
    createdAt: number;
    courierId?: string | null;
    courierName?: string | null;
    status?: "draft" | "assigned";
};

type PlanningMode = "manual" | "auto" | "extend";

type AutoRouteSettings = {
    courierCount: number;
    courierType: "walk" | "car" | "mixed";
    optimizationMode: "sla" | "geo" | "cost";
    maxOrdersPerRoute: number;
};

type AiPlannerPlan = {
    routeCount: number;
    excludeDeliveryTypes: string[];
    optimizationMode: "sla" | "geo" | "cost";
    maxOrdersPerRoute: number;
    prioritizeEarlySlots: boolean;
    notes: string[];
};

type AiPlannerResponse = {
    success: boolean;
    plan: AiPlannerPlan | null;
    error?: string;
};
type AiRouteExplanation = {
    routeId: number;
    title: string;
    summary: string;
    pointsCount: number;
    earliestSlot: string | null;
    latestSlot: string | null;
};

type OrderWithCoordinates = Order & {
    coordinates: [number, number];
};



function hasCoordinates(order: Order): order is OrderWithCoordinates {
    return order.coordinates !== null;
}

function getStatusLabel(status: string) {
    switch (status) {
        case "new":
            return "Новый";
        case "manager-processing":
            return "В работе";
        case "need-contract":
            return "Ожидание оплаты";
        case "call-later":
            return "Перезвонить";
        case "no-product":
            return "Нет в наличии";
        case "send-to-cashboard":
            return "Передано на кассу";
        case "client-confirmed":
            return "Согласовано с клиентом";
        case "special-confirmation":
            return "Специальное согласование";
        case "send-to-assembling":
            return "Передано в комплектацию";
        case "assembling-complete":
            return "Укомплектован";
        case "delivering":
            return "Доставляется";
        case "delivered":
            return "Доставлен";
        case "returned-to-zero":
            return "Возврат с маршрута";
        case "courier-assigned":
            return "Курьер назначен";
        case "complete":
            return "Выполнен";
        case "complete-electro-certificate":
            return "Выполнен: электронный сертификат";
        case "cancel-client":
            return "Отказ от заказа";
        case "cancel-operator":
            return "Отменен";
        case "doubling":
            return "Дублирующий";
        case "test":
            return "Тестовый";
        default:
            return status;
    }
}

function getCleanCardAddress(address?: string | null) {
    if (!address) return "Адрес не указан";

    const parts = address
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length === 0) return "Адрес не указан";

    const isCountryPart = (part: string) => {
        const normalized = part.toLowerCase().replace(/\s+/g, " ").trim();
        return normalized === "россия" || normalized === "рф";
    };

    const isStreetPart = (part: string) => {
        const normalized = part.toLowerCase().trim();
        return /^(ул\.?|улица|пр-?кт\.?|проспект|бул\.?|бульвар|пер\.?|переулок|ш\.?|шоссе|наб\.?|набережная|пл\.?|площадь|пр-д\.?|проезд|аллея|туп\.?|тупик)/i.test(
            normalized
        );
    };

    const isAllowedDetailPart = (part: string) => {
        const normalized = part.toLowerCase().trim();
        return /^(д\.?|дом|стр\.?|строение|корп\.?|корпус|под\.?|подъезд|кв\.?|квартира)/i.test(
            normalized
        );
    };

    const normalizeCityPart = (part: string) => {
        return part.replace(/\bгород\b/gi, "").replace(/\s+/g, " ").trim();
    };

    const filteredParts = parts.filter((part) => !isCountryPart(part));
    const streetIndex = filteredParts.findIndex(isStreetPart);

    if (streetIndex === -1) {
        return filteredParts.join(", ");
    }

    const cityCandidates = filteredParts
        .slice(0, streetIndex)
        .map(normalizeCityPart)
        .filter(Boolean);

    const city =
        cityCandidates.length > 0 ? cityCandidates[cityCandidates.length - 1] : "";

    const street = filteredParts[streetIndex];

    const details = filteredParts
        .slice(streetIndex + 1)
        .filter(isAllowedDetailPart);

    return [city, street, ...details].filter(Boolean).join(", ");
}

const STATUS_OPTIONS = [
    { value: "new", label: "Новый" },
    { value: "client-confirmed", label: "Согласовано с клиентом" },
    { value: "special-confirmation", label: "Специальное согласование" },
    { value: "send-to-assembling", label: "Передано в комплектацию" },
    { value: "assembling-complete", label: "Укомплектован" },
    { value: "courier-assigned", label: "Курьер назначен" },
    { value: "delivering", label: "Доставляется" },
    { value: "complete", label: "Выполнен" },
];

function timeToMinutes(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
    const hours = String(Math.floor(index / 2)).padStart(2, "0");
    const minutes = index % 2 === 0 ? "00" : "30";
    return `${hours}:${minutes}`;
});

export default function HomePage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
    const statusButtonRef = useRef<HTMLButtonElement | null>(null);
    const statusDropdownRef = useRef<HTMLDivElement | null>(null);
    const [statusDropdownPosition, setStatusDropdownPosition] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [activeSavedRouteId, setActiveSavedRouteId] = useState<number | null>(
        null
    );
    const [routeOrders, setRouteOrders] = useState<Order[]>([]);
    const [draggedSavedRouteOrderId, setDraggedSavedRouteOrderId] = useState<
        number | null
    >(null);

    const [deliveryDate, setDeliveryDate] = useState(
        searchParams.get("deliveryDate") || ""
    );
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [timeRangeFrom, setTimeRangeFrom] = useState("");
    const [timeRangeTo, setTimeRangeTo] = useState("");

    const [currentSavedRouteIndex, setCurrentSavedRouteIndex] = useState(0);
    const [selectedCourierId, setSelectedCourierId] = useState<string>("all");
    const [deliveryPanelTab, setDeliveryPanelTab] = useState<
        "express" | "planned"
    >("planned");

    const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);


    const [planningMode, setPlanningMode] = useState<PlanningMode>("manual");
    const [extendTargetRouteId, setExtendTargetRouteId] = useState<number | null>(
        null
    );

    const [showAutoPlanner, setShowAutoPlanner] = useState(false);
    const [autoRouteSettings, setAutoRouteSettings] =
        useState<AutoRouteSettings>({
            courierCount: 2,
            courierType: "car",
            optimizationMode: "sla",
            maxOrdersPerRoute: 10,
        });

    const [aiPrompt, setAiPrompt] = useState("");
    const [aiPlannerLoading, setAiPlannerLoading] = useState(false);
    const [aiPlannerResult, setAiPlannerResult] = useState<AiPlannerResponse | null>(null);
    const [aiRouteExplanations, setAiRouteExplanations] = useState<AiRouteExplanation[]>([]);
    const [isAiPlannerOpen, setIsAiPlannerOpen] = useState(false);

    const WAREHOUSE = {
        name: "Склад",
        coordinates: [55.816252, 37.503909] as [number, number],
    };
    const ROUTE_COLORS = [
        "#2563eb",
        "#16a34a",
        "#dc2626",
        "#9333ea",
        "#ea580c",
        "#0891b2",
        "#ca8a04",
        "#4f46e5",
    ];

    const AI_COURIERS_CONTEXT: AiCourierContext[] = [
        {
            id: "car_1",
            name: "Авто 1",
            type: "car",
            shiftStart: "09:00",
            shiftEnd: "18:00",
            maxOrders: 10,
        },
        {
            id: "car_2",
            name: "Авто 2",
            type: "car",
            shiftStart: "10:00",
            shiftEnd: "19:00",
            maxOrders: 10,
        },
        {
            id: "walk_1",
            name: "Пеший 1",
            type: "walk",
            shiftStart: "10:00",
            shiftEnd: "17:00",
            maxOrders: 5,
        },
    ];

    const AI_BUSINESS_RULES = [
        "express-delivery must not be mixed with planned courier orders",
        "walk couriers should not be overloaded with far or too many orders",
        "orders with early delivery windows should be prioritized when requested",
        "courier shifts must be respected when suggesting route strategy",
    ];

    const AI_PLANNER_TEMPLATES = [
        {
            id: "morning-priority",
            title: "Утренние в приоритете",
            text: "Построй 3 маршрута, без срочных, ранние слоты в приоритете",
        },
        {
            id: "geo-compact",
            title: "Компактно по районам",
            text: "Построй 2 маршрута, сгруппируй заказы компактно по районам",
        },
        {
            id: "min-cost",
            title: "Минимум маршрутов",
            text: "Построй минимальное количество маршрутов без срочных доставок",
        },
        {
            id: "max-6",
            title: "Лимит 6 точек",
            text: "Построй маршруты, максимум 6 заказов в каждом маршруте",
        },
        {
            id: "no-express",
            title: "Исключить срочные",
            text: "Построй маршруты только по плановым заказам, срочные не трогай",
        },
        {
            id: "sla-focus",
            title: "Фокус на SLA",
            text: "Построй маршруты с упором на соблюдение временных окон доставки",
        },
    ];


    async function handleLogout() {
        try {
            setLogoutLoading(true);

            const res = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                alert("Не удалось выйти из системы");
                return;
            }

            router.replace("/login");
        } catch {
            alert("Ошибка при выходе из системы");
        } finally {
            setLogoutLoading(false);
        }
    }

    function getDeliveryCardAccentColor(
        order: Order,
        activeTab: "express" | "planned"
    ) {
        if (order.status === "complete") {
            return "#2bbf8a";
        }

        if (activeTab === "express") {
            return "#dc2626";
        }

        switch (order.status) {
            case "special-confirmation":
                return "#f08a24";
            case "need-contract":
                return "#f0a51f";
            case "delivering":
            case "courier-assigned":
                return "#2563eb";
            case "send-to-assembling":
                return "#8b5cf6";
            case "assembling-complete":
                return "#1d4ed8";
            default:
                return "#6b7280";
        }
    }

    function handleDeliveryDateChange(nextDate: string) {
        setDeliveryDate(nextDate);
        setSelectedOrders([]);
        setRouteOrders([]);
        setSavedRoutes([]);
        setActiveSavedRouteId(null);
        setCurrentSavedRouteIndex(0);
        setDeliveryPanelTab("planned");
        setPlanningMode("manual");
        setExtendTargetRouteId(null);
        setShowAutoPlanner(false);

        const params = new URLSearchParams(searchParams.toString());

        if (nextDate) {
            params.set("deliveryDate", nextDate);
        } else {
            params.delete("deliveryDate");
        }

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
    }

    function getDeliveryCardBadgeLabel(
        _order: Order,
        activeTab: "express" | "planned"
    ) {
        if (activeTab === "express") {
            return "СРОЧНАЯ ДОСТАВКА";
        }
        return null;
    }

    function getCourierTypeDefaultLimit(type: AutoRouteSettings["courierType"]) {
        switch (type) {
            case "walk":
                return 6;
            case "car":
                return 12;
            case "mixed":
                return 8;
            default:
                return 10;
        }
    }

    function getOrderTimeStart(order: Order) {
        if (!order.deliveryFrom) return 9999;
        return timeToMinutes(order.deliveryFrom);
    }

    function getDistanceKm(from: [number, number], to: [number, number]) {
        const toRad = (value: number) => (value * Math.PI) / 180;

        const lat1 = from[0];
        const lon1 = from[1];
        const lat2 = to[0];
        const lon2 = to[1];

        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function getAngleFromWarehouse(order: Order) {
        if (!order.coordinates) return 0;

        const dy = order.coordinates[0] - WAREHOUSE.coordinates[0];
        const dx = order.coordinates[1] - WAREHOUSE.coordinates[1];

        return Math.atan2(dy, dx);
    }

    function sortOrdersForAutoRouting(
        sourceOrders: Order[],
        mode: AutoRouteSettings["optimizationMode"]
    ) {
        const ordersCopy = [...sourceOrders];

        if (mode === "sla") {
            return ordersCopy.sort((a, b) => {
                const timeDiff = getOrderTimeStart(a) - getOrderTimeStart(b);
                if (timeDiff !== 0) return timeDiff;

                const angleDiff = getAngleFromWarehouse(a) - getAngleFromWarehouse(b);
                if (angleDiff !== 0) return angleDiff;

                const aDistance = a.coordinates
                    ? getDistanceKm(WAREHOUSE.coordinates, a.coordinates)
                    : 0;
                const bDistance = b.coordinates
                    ? getDistanceKm(WAREHOUSE.coordinates, b.coordinates)
                    : 0;

                return aDistance - bDistance;
            });
        }

        if (mode === "geo") {
            return ordersCopy.sort((a, b) => {
                const angleDiff = getAngleFromWarehouse(a) - getAngleFromWarehouse(b);
                if (angleDiff !== 0) return angleDiff;

                const aDistance = a.coordinates
                    ? getDistanceKm(WAREHOUSE.coordinates, a.coordinates)
                    : 0;
                const bDistance = b.coordinates
                    ? getDistanceKm(WAREHOUSE.coordinates, b.coordinates)
                    : 0;

                if (aDistance !== bDistance) return aDistance - bDistance;

                return getOrderTimeStart(a) - getOrderTimeStart(b);
            });
        }

        return ordersCopy.sort((a, b) => {
            const angleDiff = getAngleFromWarehouse(a) - getAngleFromWarehouse(b);
            if (angleDiff !== 0) return angleDiff;

            return getOrderTimeStart(a) - getOrderTimeStart(b);
        });
    }

    function orderRouteByNearestNeighbor(routeOrdersInput: Order[]) {
        if (routeOrdersInput.length <= 2) return routeOrdersInput;

        const remaining = [...routeOrdersInput];
        const result: Order[] = [];
        let currentPoint = WAREHOUSE.coordinates;

        while (remaining.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = Infinity;

            remaining.forEach((order, index) => {
                if (!order.coordinates) return;

                const distance = getDistanceKm(currentPoint, order.coordinates);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = index;
                }
            });

            const [nextOrder] = remaining.splice(nearestIndex, 1);
            result.push(nextOrder);

            if (nextOrder.coordinates) {
                currentPoint = nextOrder.coordinates;
            }
        }

        return result;
    }

    function buildSlaBuckets(
        sortedOrders: Order[],
        routeCount: number,
        maxOrdersPerRoute: number
    ) {
        const buckets: Order[][] = Array.from({ length: routeCount }, () => []);

        let pointer = 0;

        sortedOrders.forEach((order) => {
            let attempts = 0;

            while (
                attempts < routeCount &&
                buckets[pointer].length >= maxOrdersPerRoute
            ) {
                pointer = (pointer + 1) % routeCount;
                attempts += 1;
            }

            if (attempts >= routeCount) {
                return;
            }

            buckets[pointer].push(order);
            pointer = (pointer + 1) % routeCount;
        });

        return buckets;
    }

    function buildSequentialBuckets(
        sortedOrders: Order[],
        routeCount: number,
        maxOrdersPerRoute: number
    ) {
        const buckets: Order[][] = Array.from({ length: routeCount }, () => []);

        sortedOrders.forEach((order, index) => {
            const bucketIndex = Math.min(
                Math.floor(index / maxOrdersPerRoute),
                routeCount - 1
            );

            buckets[bucketIndex].push(order);
        });

        return buckets;
    }

    function buildAutoRouteDrafts(
        sourceOrders: Order[],
        settings: AutoRouteSettings
    ) {
        if (sourceOrders.length === 0) return [];

        const hardLimit = getCourierTypeDefaultLimit(settings.courierType);
        const maxOrdersPerRoute = Math.max(
            1,
            Math.min(settings.maxOrdersPerRoute, hardLimit)
        );

        const sanitizedOrders = sourceOrders.filter(
            (order) => order.deliveryTypeCode !== "express-delivery"
        );

        if (sanitizedOrders.length === 0) return [];

        const sorted = sortOrdersForAutoRouting(
            sanitizedOrders,
            settings.optimizationMode
        );

        const requiredRouteCountByCapacity = Math.max(
            1,
            Math.ceil(sorted.length / maxOrdersPerRoute)
        );

        const requestedRouteCount =
            settings.optimizationMode === "cost"
                ? requiredRouteCountByCapacity
                : Math.max(1, settings.courierCount);

        const routeCount = Math.min(
            Math.max(requestedRouteCount, requiredRouteCountByCapacity),
            sorted.length
        );

        const buckets =
            settings.optimizationMode === "sla"
                ? buildSlaBuckets(sorted, routeCount, maxOrdersPerRoute)
                : buildSequentialBuckets(sorted, routeCount, maxOrdersPerRoute);

        return buckets
            .filter((bucket) => bucket.length > 0)
            .map((bucket, index) => {
                const orderedBucket =
                    settings.optimizationMode === "sla"
                        ? [...bucket].sort(
                            (a, b) => getOrderTimeStart(a) - getOrderTimeStart(b)
                        )
                        : orderRouteByNearestNeighbor(bucket);

                const routeTimestamp = Date.now() + index;

                return {
                    id: routeTimestamp,
                    date: deliveryDate || null,
                    orders: orderedBucket,
                    createdAt: routeTimestamp,
                    status: "draft" as const,
                };
            });
    }

    function findRouteContainingOrder(
        orderId: number,
        excludedRouteId?: number | null
    ) {
        return savedRoutes.find((route) => {
            if (excludedRouteId && route.id === excludedRouteId) {
                return false;
            }

            return route.orders.some((order) => order.id === orderId);
        });
    }

    useEffect(() => {
        const urlDate = searchParams.get("deliveryDate") || "";

        setDeliveryDate((prev) => (prev === urlDate ? prev : urlDate));
    }, [searchParams]);

    async function loadOrders(date?: string) {
        try {
            setLoading(true);
            setError(null);

            let url = "/api/map/orders";
            if (date) {
                url += `?deliveryDate=${date}`;
            }

            const response = await fetch(url, {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || "Ошибка загрузки заказов");
                setOrders([]);
                return;
            }

            setOrders(data.orders || []);
        } catch {
            setError("Не удалось загрузить заказы");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setSelectedOrders([]);
        setRouteOrders([]);
        setSavedRoutes([]);
        setActiveSavedRouteId(null);
        setCurrentSavedRouteIndex(0);
        setDeliveryPanelTab("planned");
        setPlanningMode("manual");
        setExtendTargetRouteId(null);
        setShowAutoPlanner(false);

        if (!deliveryDate) {
            setOrders([]);
            setLoading(false);
            return;
        }

        loadOrders(deliveryDate);
    }, [deliveryDate]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node | null;

            if (!isStatusFilterOpen || !target) return;

            const clickedInsideButton =
                statusButtonRef.current?.contains(target) ?? false;
            const clickedInsideDropdown =
                statusDropdownRef.current?.contains(target) ?? false;

            if (!clickedInsideButton && !clickedInsideDropdown) {
                setIsStatusFilterOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isStatusFilterOpen]);

    function toggleOrder(orderId: number) {
        setSelectedOrders((prev) => {
            if (prev.includes(orderId)) {
                return prev.filter((id) => id !== orderId);
            }
            return [...prev, orderId];
        });
    }

    function reorderSavedRouteOrders(
        routeId: number,
        draggedId: number,
        targetId: number
    ) {
        if (draggedId === targetId) return;

        setSavedRoutes((prev) => {
            let nextOrdersForActiveRoute: Order[] | null = null;

            const nextRoutes = prev.map((route) => {
                if (route.id !== routeId) return route;

                const draggedIndex = route.orders.findIndex(
                    (order) => order.id === draggedId
                );
                const targetIndex = route.orders.findIndex(
                    (order) => order.id === targetId
                );

                if (draggedIndex === -1 || targetIndex === -1) return route;

                const nextOrders = [...route.orders];
                const [draggedItem] = nextOrders.splice(draggedIndex, 1);
                nextOrders.splice(targetIndex, 0, draggedItem);

                nextOrdersForActiveRoute = nextOrders;

                return {
                    ...route,
                    orders: nextOrders,
                };
            });

            if (nextOrdersForActiveRoute && activeSavedRouteId === routeId) {
                setRouteOrders(nextOrdersForActiveRoute);
            }

            return nextRoutes;
        });
    }

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const statusMatch =
                selectedStatuses.length === 0 ||
                selectedStatuses.includes(order.status);

            let timeRangeMatch = true;

            if (timeRangeFrom || timeRangeTo) {
                if (!order.deliveryFrom || !order.deliveryTo) {
                    timeRangeMatch = false;
                } else {
                    const orderFrom = timeToMinutes(order.deliveryFrom);
                    const orderTo = timeToMinutes(order.deliveryTo);
                    const filterFrom = timeRangeFrom
                        ? timeToMinutes(timeRangeFrom)
                        : null;
                    const filterTo = timeRangeTo ? timeToMinutes(timeRangeTo) : null;

                    if (filterFrom !== null && orderFrom < filterFrom) {
                        timeRangeMatch = false;
                    }

                    if (filterTo !== null && orderTo > filterTo) {
                        timeRangeMatch = false;
                    }
                }
            }

            const courierMatch =
                selectedCourierId === "all" ||
                String(order.courierId || "") === selectedCourierId;

            return statusMatch && timeRangeMatch && courierMatch;
        });
    }, [
        orders,
        selectedStatuses,
        timeRangeFrom,
        timeRangeTo,
        selectedCourierId,
    ]);

    const expressOrders = useMemo(() => {
        return filteredOrders.filter(
            (order) => order.deliveryTypeCode === "express-delivery"
        );
    }, [filteredOrders]);

    const plannedOrdersForPanel = useMemo(() => {
        return filteredOrders.filter(
            (order) => order.deliveryTypeCode === "courier"
        );
    }, [filteredOrders]);

    const deliveryPanelOrders = useMemo(() => {
        return deliveryPanelTab === "express"
            ? expressOrders
            : plannedOrdersForPanel;
    }, [deliveryPanelTab, expressOrders, plannedOrdersForPanel]);

    const activeTabOrders = useMemo(() => {
        return deliveryPanelOrders;
    }, [deliveryPanelOrders]);

    const sortedDeliveryPanelOrders = useMemo(() => {
        const selected = deliveryPanelOrders.filter((order) =>
            selectedOrders.includes(order.id)
        );
        const notSelected = deliveryPanelOrders.filter(
            (order) => !selectedOrders.includes(order.id)
        );

        return [...selected, ...notSelected];
    }, [deliveryPanelOrders, selectedOrders]);

    const selectedRegularOrders = activeTabOrders.filter((order) =>
        selectedOrders.includes(order.id)
    );

    const couriers = useMemo(() => {
        const map = new Map<string, string>();

        orders.forEach((order) => {
            if (order.courierId && order.courierName) {
                map.set(String(order.courierId), order.courierName);
            }
        });

        return Array.from(map.entries()).map(([id, name]) => ({
            id,
            name,
        }));
    }, [orders]);

    const mapRouteGroups = useMemo(() => {
        return savedRoutes.map((route, index) => ({
            id: String(route.id),
            name: `Маршрут #${String(route.id).slice(-4)}`,
            color: ROUTE_COLORS[index % ROUTE_COLORS.length],
            orders: route.orders.filter(hasCoordinates).map((order) => ({
                id: order.id,
                title: order.title,
                status: order.status,
                textAddress: order.textAddress ?? null,
                coordinates: order.coordinates,
                deliveryFrom: order.deliveryFrom,
                deliveryTo: order.deliveryTo,
                courierName: order.courierName ?? null,
                deliveryTypeCode: order.deliveryTypeCode,
            })),
        }));
    }, [savedRoutes]);

    const activeMapRouteGroupId =
        activeSavedRouteId !== null ? String(activeSavedRouteId) : "all";

    const currentSavedRoute =
        savedRoutes.length > 0 ? savedRoutes[currentSavedRouteIndex] : null;

    const currentRouteCompletedCount = currentSavedRoute
        ? currentSavedRoute.orders.filter((order) => order.status === "complete")
            .length
        : 0;

    const currentRouteProgressPercent =
        currentSavedRoute && currentSavedRoute.orders.length > 0
            ? Math.round(
                (currentRouteCompletedCount / currentSavedRoute.orders.length) * 100
            )
            : 0;

    function buildAndSaveRoute() {
        if (selectedRegularOrders.length === 0) return;

        const conflictedOrders = selectedRegularOrders.filter((order) =>
            savedRoutes.some((route) =>
                route.orders.some((routeOrder) => routeOrder.id === order.id)
            )
        );

        if (conflictedOrders.length > 0) {
            alert(
                `Некоторые выбранные заказы уже находятся в других маршрутах: ${conflictedOrders
                    .map((order) => order.title.replace("Заказ #", "№"))
                    .join(", ")}`
            );
            return;
        }

        const newRoute: SavedRoute = {
            id: Date.now(),
            date: deliveryDate || null,
            orders: [...selectedRegularOrders],
            createdAt: Date.now(),
            status: "draft",
        };

        setSavedRoutes((prev) => {
            const next = [newRoute, ...prev];
            setCurrentSavedRouteIndex(0);
            return next;
        });

        setActiveSavedRouteId(newRoute.id);
        setRouteOrders([...selectedRegularOrders]);
        setSelectedOrders([]);
    }

    function saveCurrentRouteDraft() {
        if (routeOrders.length === 0) return;

        if (!currentSavedRoute) {
            const newRoute: SavedRoute = {
                id: Date.now(),
                date: deliveryDate || null,
                orders: [...routeOrders],
                createdAt: Date.now(),
                status: "draft",
            };

            setSavedRoutes((prev) => {
                const next = [newRoute, ...prev];
                setCurrentSavedRouteIndex(0);
                return next;
            });

            setActiveSavedRouteId(newRoute.id);
            setPlanningMode("manual");
            setExtendTargetRouteId(null);
            return;
        }

        setSavedRoutes((prev) =>
            prev.map((route) =>
                route.id === currentSavedRoute.id
                    ? {
                        ...route,
                        orders: [...routeOrders],
                        status: "draft",
                    }
                    : route
            )
        );
    }

    function buildRouteAutomatically() {
        if (selectedRegularOrders.length === 0) return;

        const conflictedOrders = selectedRegularOrders.filter((order) =>
            savedRoutes.some((route) =>
                route.orders.some((routeOrder) => routeOrder.id === order.id)
            )
        );

        if (conflictedOrders.length > 0) {
            alert(
                `Некоторые выбранные заказы уже находятся в других маршрутах: ${conflictedOrders
                    .map((order) => order.title.replace("Заказ #", "№"))
                    .join(", ")}`
            );
            return;
        }

        const nextRoutes = buildAutoRouteDrafts(
            selectedRegularOrders,
            autoRouteSettings
        );

        if (nextRoutes.length === 0) return;

        setSavedRoutes((prev) => [...nextRoutes, ...prev]);
        setCurrentSavedRouteIndex(0);
        setActiveSavedRouteId(nextRoutes[0].id);
        setRouteOrders(nextRoutes[0].orders);
        setPlanningMode("auto");
        setExtendTargetRouteId(null);
        setSelectedOrders([]);
        setShowAutoPlanner(false);
    }

    function startExtendRoute(routeId: number) {
        const targetRoute = savedRoutes.find((route) => route.id === routeId);
        if (!targetRoute) return;

        setExtendTargetRouteId(routeId);
        setActiveSavedRouteId(routeId);
        setRouteOrders(targetRoute.orders);
        setSelectedOrders([]);
        setPlanningMode("extend");
        setShowAutoPlanner(false);

        const targetIndex = savedRoutes.findIndex((route) => route.id === routeId);
        if (targetIndex >= 0) {
            setCurrentSavedRouteIndex(targetIndex);
        }
    }

    function addSelectedOrdersToExtendRoute() {
        if (!extendTargetRouteId) return;
        if (selectedRegularOrders.length === 0) return;

        const targetRoute = savedRoutes.find(
            (route) => route.id === extendTargetRouteId
        );
        if (!targetRoute) return;

        const existingIds = new Set(targetRoute.orders.map((order) => order.id));

        const conflictedOrders = selectedRegularOrders.filter((order) => {
            if (existingIds.has(order.id)) return false;

            return savedRoutes.some(
                (route) =>
                    route.id !== extendTargetRouteId &&
                    route.orders.some((routeOrder) => routeOrder.id === order.id)
            );
        });

        if (conflictedOrders.length > 0) {
            const message = conflictedOrders
                .map((order) => {
                    const route = findRouteContainingOrder(order.id, extendTargetRouteId);
                    const routeLabel = route
                        ? `маршруте #${route.id.toString().slice(-4)}`
                        : "другом маршруте";
                    return `${order.title.replace("Заказ #", "№")} уже в ${routeLabel}`;
                })
                .join("\n");

            alert(message);
            return;
        }

        const newOrders = selectedRegularOrders.filter(
            (order) => !existingIds.has(order.id)
        );

        if (newOrders.length === 0) return;

        const updatedOrders = [...targetRoute.orders, ...newOrders];

        setSavedRoutes((prev) =>
            prev.map((route) =>
                route.id === extendTargetRouteId
                    ? {
                        ...route,
                        orders: updatedOrders,
                        status: "draft",
                    }
                    : route
            )
        );

        if (activeSavedRouteId === extendTargetRouteId) {
            setRouteOrders(updatedOrders);
        }

        setSelectedOrders([]);
    }

    function removeOrderFromRoute(routeId: number, orderId: number) {
        setSavedRoutes((prev) => {
            const nextRoutes = prev
                .map((route) => {
                    if (route.id !== routeId) return route;

                    const nextOrders = route.orders.filter((order) => order.id !== orderId);

                    if (nextOrders.length === 0) {
                        return null;
                    }

                    return {
                        ...route,
                        orders: nextOrders,
                    };
                })
                .filter(Boolean) as SavedRoute[];

            const removedRouteIndex = prev.findIndex((route) => route.id === routeId);
            const updatedRoute = nextRoutes.find((route) => route.id === routeId);

            if (!updatedRoute) {
                setRouteOrders([]);
                setActiveSavedRouteId(null);
                setExtendTargetRouteId((current) => (current === routeId ? null : current));
                setPlanningMode("manual");

                if (nextRoutes.length === 0) {
                    setCurrentSavedRouteIndex(0);
                } else {
                    const safeIndex =
                        removedRouteIndex >= nextRoutes.length
                            ? nextRoutes.length - 1
                            : Math.max(0, removedRouteIndex);

                    setCurrentSavedRouteIndex(safeIndex);
                }

                return nextRoutes;
            }

            if (activeSavedRouteId === routeId) {
                setRouteOrders(updatedRoute.orders);
            }

            return nextRoutes;
        });
    }

    function showPrevSavedRoute() {
        if (savedRoutes.length === 0) return;

        const nextIndex =
            currentSavedRouteIndex === 0
                ? savedRoutes.length - 1
                : currentSavedRouteIndex - 1;

        setCurrentSavedRouteIndex(nextIndex);
        setActiveSavedRouteId(savedRoutes[nextIndex].id);
        setRouteOrders(savedRoutes[nextIndex].orders);
        setSelectedOrders(savedRoutes[nextIndex].orders.map((order) => order.id));
    }

    function showNextSavedRoute() {
        if (savedRoutes.length === 0) return;

        const nextIndex =
            currentSavedRouteIndex === savedRoutes.length - 1
                ? 0
                : currentSavedRouteIndex + 1;

        setCurrentSavedRouteIndex(nextIndex);
        setActiveSavedRouteId(savedRoutes[nextIndex].id);
        setRouteOrders(savedRoutes[nextIndex].orders);
        setSelectedOrders(savedRoutes[nextIndex].orders.map((order) => order.id));
    }

    function toggleStatusDropdown() {
        if (!isStatusFilterOpen && statusButtonRef.current) {
            const rect = statusButtonRef.current.getBoundingClientRect();

            setStatusDropdownPosition({
                top: rect.bottom + 8,
                left: rect.left,
                width: 280,
            });
        }

        setIsStatusFilterOpen((prev) => !prev);
    }

    function applyAiTemplate(templateText: string) {
        setAiPrompt(templateText);
    }

    function appendAiTemplate(templateText: string) {
        setAiPrompt((prev) => {
            const current = prev.trim();

            if (!current) return templateText;

            return `${current}. ${templateText}`;
        });
    }

    async function handleAiPlannerAnalyze() {
        if (!aiPrompt.trim()) {
            alert("Сначала напиши инструкцию для AI Planner");
            return;
        }

        if (selectedRegularOrders.length === 0) {
            alert("Сначала выбери заказы, для которых нужно построить AI-план");
            return;
        }

        try {
            setAiPlannerLoading(true);
            setAiPlannerResult(null);

            const res = await fetch("/api/route-ai/plan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    deliveryDate,
                    orders: selectedRegularOrders,
                    couriers: AI_COURIERS_CONTEXT,
                    businessRules: AI_BUSINESS_RULES,
                    warehouse: WAREHOUSE,
                }),
            });

            const data = await res.json();

            setAiPlannerResult(data);
        } catch {
            setAiPlannerResult({
                success: false,
                plan: null,
                error: "Ошибка запроса к серверу",
            });
        } finally {
            setAiPlannerLoading(false);
        }
    }

    function buildAiRouteExplanations(
        routes: SavedRoute[],
        plan: AiPlannerPlan
    ): AiRouteExplanation[] {
        return routes.map((route, index) => {
            const slots = route.orders
                .map((order) => ({
                    from: order.deliveryFrom || null,
                    to: order.deliveryTo || null,
                }))
                .filter((slot) => slot.from || slot.to);

            const earliestSlot =
                slots.length > 0
                    ? slots
                        .map((slot) => slot.from)
                        .filter(Boolean)
                        .sort()[0] || null
                    : null;

            const latestSlot =
                slots.length > 0
                    ? slots
                        .map((slot) => slot.to)
                        .filter(Boolean)
                        .sort()
                        .slice(-1)[0] || null
                    : null;

            const summaryParts: string[] = [];

            summaryParts.push(
                `Маршрут ${index + 1} содержит ${route.orders.length} ${route.orders.length === 1 ? "точку" : route.orders.length < 5 ? "точки" : "точек"
                }`
            );

            if (plan.prioritizeEarlySlots && earliestSlot) {
                summaryParts.push(`учтён приоритет ранних слотов, старт с окна ${earliestSlot}`);
            }

            if (plan.optimizationMode === "geo") {
                summaryParts.push("заказы сгруппированы более компактно по географии");
            }

            if (plan.optimizationMode === "cost") {
                summaryParts.push("маршрут собран с упором на сокращение количества рейсов");
            }

            if (plan.optimizationMode === "sla") {
                summaryParts.push("маршрут собран с упором на соблюдение временных окон");
            }

            if (route.orders.length >= plan.maxOrdersPerRoute) {
                summaryParts.push(
                    `маршрут заполнен близко к лимиту ${plan.maxOrdersPerRoute} заказов`
                );
            }

            if (
                plan.excludeDeliveryTypes.includes("express-delivery")
            ) {
                summaryParts.push("срочные доставки исключены из расчёта");
            }

            return {
                routeId: route.id,
                title: `Маршрут #${String(route.id).slice(-4)}`,
                summary: summaryParts.join(". ") + ".",
                pointsCount: route.orders.length,
                earliestSlot,
                latestSlot,
            };
        });
    }

    function applyAiPlannerPlan() {
        if (!aiPlannerResult?.success || !aiPlannerResult.plan) {
            return;
        }

        const plan = aiPlannerResult.plan;

        // 1. Берём текущие выбранные заказы
        let sourceOrders = [...selectedRegularOrders];

        if (sourceOrders.length === 0) {
            alert("Сначала выбери заказы, для которых нужно применить AI-план");
            return;
        }

        // 2. Исключаем типы доставок, которые AI попросил не учитывать
        if (plan.excludeDeliveryTypes.length > 0) {
            sourceOrders = sourceOrders.filter(
                (order) =>
                    !plan.excludeDeliveryTypes.includes(order.deliveryTypeCode || "")
            );
        }

        if (sourceOrders.length === 0) {
            alert("После применения AI-фильтров не осталось заказов для построения");
            return;
        }

        // 3. Проверяем, не лежат ли эти заказы уже в других маршрутах
        const conflictedOrders = sourceOrders.filter((order) =>
            savedRoutes.some((route) =>
                route.orders.some((routeOrder) => routeOrder.id === order.id)
            )
        );

        if (conflictedOrders.length > 0) {
            alert(
                `Некоторые заказы уже находятся в других маршрутах: ${conflictedOrders
                    .map((order) => order.title.replace("Заказ #", "№"))
                    .join(", ")}`
            );
            return;
        }

        // 4. Собираем настройки для текущего движка автопостроения
        const nextAutoSettings: AutoRouteSettings = {
            courierCount: plan.routeCount,
            courierType: autoRouteSettings.courierType, // пока оставляем текущий тип курьера
            optimizationMode: plan.prioritizeEarlySlots ? "sla" : plan.optimizationMode,
            maxOrdersPerRoute: plan.maxOrdersPerRoute,
        };

        // 5. Обновляем UI-состояние настроек
        setAutoRouteSettings(nextAutoSettings);
        setPlanningMode("auto");
        setShowAutoPlanner(true);
        setExtendTargetRouteId(null);

        // 6. Строим маршруты через уже существующую функцию
        const nextRoutes = buildAutoRouteDrafts(sourceOrders, nextAutoSettings);

        if (nextRoutes.length === 0) {
            alert("Не удалось построить маршруты по AI-плану");
            return;
        }

        const nextExplanations = buildAiRouteExplanations(nextRoutes, plan);
        setAiRouteExplanations(nextExplanations);

        // 7. Сохраняем маршруты и активируем первый
        setSavedRoutes((prev) => [...nextRoutes, ...prev]);
        setCurrentSavedRouteIndex(0);
        setActiveSavedRouteId(nextRoutes[0].id);
        setRouteOrders(nextRoutes[0].orders);

        // 8. Снимаем текущее выделение заказов, так как они уже ушли в маршруты
        setSelectedOrders([]);
    }

    const emptyStateOverlay = !deliveryDate ? (
        <div
            style={{
                position: "absolute",
                top: "88px",
                left: "104px",
                zIndex: 45,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    background: "rgba(255,255,255,0.92)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
                    padding: "14px 16px",
                    minWidth: "250px",
                    maxWidth: "320px",
                    backdropFilter: "blur(10px)",
                }}
            >
                <div
                    style={{
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "#111827",
                        marginBottom: "6px",
                    }}
                >
                    Select delivery date
                </div>

                <div
                    style={{
                        fontSize: "13px",
                        lineHeight: 1.45,
                        color: "#4b5563",
                    }}
                >
                    After selecting a date, orders and route controls will appear.
                </div>
            </div>
        </div>
    ) : null;

    const BellIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 5a4 4 0 0 0-4 4v1.4c0 .9-.3 1.8-.8 2.5l-1 1.4c-.5.8 0 1.7 1 1.7h9.6c1 0 1.5-.9 1-1.7l-1-1.4a4.4 4.4 0 0 1-.8-2.5V9a4 4 0 0 0-4-4Z"
                stroke="#4b5563"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M10 18a2 2 0 0 0 4 0"
                stroke="#4b5563"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );

    function ClockIcon() {
        return (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="#374151" />
                <path
                    d="M12 7.5V12L15.5 14"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    function FilterClockIcon() {
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" stroke="#4b5563" strokeWidth="2" />
                <path
                    d="M12 7.5V12L15 13.8"
                    stroke="#4b5563"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    const controlsBar = (
        <div
            style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: "8px",
                alignItems: "center",
                minWidth: "max-content",
                pointerEvents: "auto",
            }}
        >
            <div style={{ position: "relative", flex: "0 0 auto" }}>
                <button
                    ref={statusButtonRef}
                    type="button"
                    onClick={toggleStatusDropdown}
                    style={{
                        height: "32px",
                        width: "118px",
                        padding: selectedStatuses.length > 0 ? "0 26px 0 12px" : "0 12px",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        background: "#f8fafc",
                        color: "#111827",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "flex",
                        alignItems: "center",
                        boxSizing: "border-box",
                    }}
                >
                    Статус: {selectedStatuses.length === 0 ? "Все" : `${selectedStatuses.length}`}
                </button>

                {selectedStatuses.length > 0 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStatuses([]);
                            setSelectedOrders([]);
                            setRouteOrders([]);
                            setActiveSavedRouteId(null);
                        }}
                        style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "14px",
                            height: "14px",
                            border: "none",
                            background: "transparent",
                            color: "#6b7280",
                            fontSize: "11px",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label="Сбросить статус"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div
                style={{
                    position: "relative",
                    width: "196px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: timeRangeFrom || timeRangeTo ? "0 26px 0 10px" : "0 10px",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                    boxSizing: "border-box",
                    flex: "0 0 auto",
                }}
            >
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <FilterClockIcon />
                </span>

                <select
                    value={timeRangeFrom}
                    onChange={(e) => {
                        setTimeRangeFrom(e.target.value);
                        setSelectedOrders([]);
                        setRouteOrders([]);
                        setActiveSavedRouteId(null);
                    }}
                    style={{
                        height: "20px",
                        width: "58px",
                        border: "none",
                        background: "transparent",
                        color: "#111827",
                        fontSize: "13px",
                        outline: "none",
                        flexShrink: 0,
                    }}
                >
                    <option value="">с</option>
                    {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                            {time}
                        </option>
                    ))}
                </select>

                <span style={{ color: "#9ca3af", fontSize: "13px", flexShrink: 0 }}>—</span>

                <select
                    value={timeRangeTo}
                    onChange={(e) => {
                        setTimeRangeTo(e.target.value);
                        setSelectedOrders([]);
                        setRouteOrders([]);
                        setActiveSavedRouteId(null);
                    }}
                    style={{
                        height: "20px",
                        width: "58px",
                        border: "none",
                        background: "transparent",
                        color: "#111827",
                        fontSize: "13px",
                        outline: "none",
                        flexShrink: 0,
                    }}
                >
                    <option value="">до</option>
                    {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                            {time}
                        </option>
                    ))}
                </select>

                {(timeRangeFrom || timeRangeTo) && (
                    <button
                        type="button"
                        onClick={() => {
                            setTimeRangeFrom("");
                            setTimeRangeTo("");
                            setSelectedOrders([]);
                            setRouteOrders([]);
                            setActiveSavedRouteId(null);
                        }}
                        style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "14px",
                            height: "14px",
                            border: "none",
                            background: "transparent",
                            color: "#6b7280",
                            fontSize: "11px",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label="Сбросить интервал"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div style={{ position: "relative", flex: "0 0 auto" }}>
                <select
                    value={selectedCourierId}
                    onChange={(e) => {
                        setSelectedCourierId(e.target.value);
                        setSelectedOrders([]);
                        setRouteOrders([]);
                        setActiveSavedRouteId(null);
                    }}
                    style={{
                        height: "32px",
                        width: "128px",
                        padding: selectedCourierId !== "all" ? "0 26px 0 12px" : "0 12px",
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        background: "#f8fafc",
                        color: "#111827",
                        fontSize: "13px",
                        fontWeight: 600,
                        outline: "none",
                        appearance: "none",
                        boxSizing: "border-box",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    <option value="all">Курьер: Все</option>
                    {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>
                            {courier.name}
                        </option>
                    ))}
                </select>

                {selectedCourierId !== "all" && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCourierId("all");
                            setSelectedOrders([]);
                            setRouteOrders([]);
                            setActiveSavedRouteId(null);
                        }}
                        style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "14px",
                            height: "14px",
                            border: "none",
                            background: "transparent",
                            color: "#6b7280",
                            fontSize: "11px",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label="Сбросить курьера"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );


    const statusDropdownOverlay =
        isStatusFilterOpen && statusDropdownPosition ? (
            <div
                ref={statusDropdownRef}
                style={{
                    position: "fixed",
                    top: `${statusDropdownPosition.top}px`,
                    left: `${statusDropdownPosition.left}px`,
                    width: `${statusDropdownPosition.width}px`,
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "12px",
                    maxHeight: "280px",
                    overflowY: "auto",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 12px 28px rgba(15,23,42,0.16)",
                    zIndex: 300,
                }}
            >
                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "10px",
                        cursor: "pointer",
                        color: "#111827",
                        fontSize: "14px",
                        fontWeight: 600,
                    }}
                >
                    <input
                        type="checkbox"
                        checked={selectedStatuses.length === 0}
                        onChange={() => {
                            setSelectedStatuses([]);
                            setSelectedOrders([]);
                            setRouteOrders([]);
                            setActiveSavedRouteId(null);
                        }}
                    />
                    <span>Все статусы</span>
                </label>

                {STATUS_OPTIONS.map((status) => {
                    const checked = selectedStatuses.includes(status.value);

                    return (
                        <label
                            key={status.value}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px",
                                cursor: "pointer",
                                color: "#111827",
                                fontSize: "14px",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                    if (checked) {
                                        setSelectedStatuses((prev) =>
                                            prev.filter((s) => s !== status.value)
                                        );
                                    } else {
                                        setSelectedStatuses((prev) => [...prev, status.value]);
                                    }

                                    setSelectedOrders([]);
                                    setRouteOrders([]);
                                    setActiveSavedRouteId(null);
                                }}
                            />
                            <span>{status.label}</span>
                        </label>
                    );
                })}
            </div>
        ) : null;

    const mapFiltersOverlay = deliveryDate ? (
        <div
            style={{
                position: "absolute",
                top: "82px",
                left: "88px",
                right: "426px",
                zIndex: 70,
                pointerEvents: "none",
                display: "flex",
                justifyContent: "flex-end",
            }}
        >
            <div
                style={{
                    background: "rgba(255,255,255,0.94)",
                    border: "1px solid rgba(229,231,235,0.9)",
                    borderRadius: "16px",
                    boxShadow: "0 10px 24px rgba(15,23,42,0.10)",
                    backdropFilter: "blur(10px)",
                    padding: "10px 12px",
                    pointerEvents: "auto",
                    maxWidth: "100%",
                    overflowX: "auto",
                }}
            >
                {controlsBar}
            </div>
        </div>
    ) : null;

    const rightColumn = (
        <div
            style={{
                height: "100%",
                display: "grid",
                gridTemplateRows: "auto auto minmax(0, 1fr) auto",
                background: "rgba(249,250,251,0.96)",
                borderLeft: "1px solid #e5e7eb",
                boxShadow: "-12px 0 28px rgba(15, 23, 42, 0.06)",
                backdropFilter: "blur(8px)",
                padding: "56px 20px 18px 20px",
                boxSizing: "border-box",
                gap: "14px",
                borderRadius: "0",
            }}
        >
            <div style={{ display: "flex", justifyContent: "center" }}>
                <div
                    style={{
                        display: "grid",
                        justifyItems: "center",
                        width: "100%",
                        textAlign: "center",
                        gap: "12px",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "28px",
                            lineHeight: 1.1,
                            fontWeight: 700,
                            color: "#111827",
                        }}
                    >
                        Доставки
                    </h2>

                    <div
                        style={{
                            display: "inline-grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "4px",
                            background: "#f3f4f6",
                            borderRadius: "10px",
                            padding: "4px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setDeliveryPanelTab("planned");
                                setSelectedOrders([]);
                                setRouteOrders([]);
                                setActiveSavedRouteId(null);
                            }}
                            style={{
                                height: "28px",
                                minWidth: "88px",
                                border: "none",
                                borderRadius: "8px",
                                background:
                                    deliveryPanelTab === "planned" ? "#ffffff" : "transparent",
                                color:
                                    deliveryPanelTab === "planned" ? "#2563eb" : "#4b5563",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            ПЛАНОВЫЕ
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setDeliveryPanelTab("express");
                                setSelectedOrders([]);
                                setRouteOrders([]);
                                setActiveSavedRouteId(null);
                            }}
                            style={{
                                height: "28px",
                                minWidth: "88px",
                                border: "none",
                                borderRadius: "8px",
                                background:
                                    deliveryPanelTab === "express" ? "#ffffff" : "transparent",
                                color:
                                    deliveryPanelTab === "express" ? "#2563eb" : "#4b5563",
                                fontSize: "11px",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            СРОЧНЫЕ
                        </button>
                    </div>
                </div>
            </div>

            <div
                style={{
                    background: "#ffffff",
                    border: "1px solid #eceff3",
                    borderRadius: "14px",
                    padding: "12px 8px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        padding: "4px 8px",
                        borderRight: "1px solid #eef2f7",
                    }}
                >
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                        Всего
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                        {activeTabOrders.length}
                    </div>
                </div>

                <div style={{ textAlign: "center", padding: "4px 8px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                        Выбрано
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#2563eb" }}>
                        {selectedOrders.length}
                    </div>
                </div>
            </div>

            <div
                style={{
                    minHeight: 0,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    paddingRight: "2px",
                }}
            >
                {sortedDeliveryPanelOrders.length === 0 ? (
                    <div
                        style={{
                            background: "#ffffff",
                            border: "1px solid #eceff3",
                            borderRadius: "14px",
                            padding: "16px",
                            color: "#6b7280",
                            fontSize: "14px",
                        }}
                    >
                        {deliveryPanelTab === "express"
                            ? "Срочных доставок нет"
                            : "Плановых доставок нет"}
                    </div>
                ) : (
                    sortedDeliveryPanelOrders.map((order) => {
                        const accentColor = getDeliveryCardAccentColor(order, deliveryPanelTab);
                        const badgeLabel = getDeliveryCardBadgeLabel(order, deliveryPanelTab);
                        const isSelected = selectedOrders.includes(order.id);

                        return (
                            <div
                                key={order.id}
                                style={{
                                    position: "relative",
                                    background: isSelected ? "#eff6ff" : "#ffffff",
                                    border: isSelected ? "2px solid #2563eb" : "1px solid #eceff3",
                                    borderRadius: "14px",
                                    padding: "14px 14px 14px 16px",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                    minHeight: "112px",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    boxShadow: isSelected
                                        ? "0 6px 18px rgba(37,99,235,0.18)"
                                        : "none",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        width: "4px",
                                        background: accentColor,
                                    }}
                                />

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        gap: "10px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "14px",
                                            color: "#111827",
                                            lineHeight: 1.25,
                                        }}
                                    >
                                        {order.title.replace("Заказ #", "№")}
                                    </div>

                                    {badgeLabel ? (
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                color: accentColor,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {badgeLabel}
                                        </div>
                                    ) : null}
                                </div>

                                <div
                                    style={{
                                        fontSize: "13px",
                                        color: "#4b5563",
                                        marginBottom: "10px",
                                        lineHeight: 1.35,
                                    }}
                                >
                                    {getCleanCardAddress(order.textAddress)}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "10px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            fontSize: "12px",
                                            color: "#6b7280",
                                        }}
                                    >
                                        <ClockIcon />
                                        <span>
                                            {order.deliveryFrom && order.deliveryTo
                                                ? `${order.deliveryFrom} - ${order.deliveryTo}`
                                                : "Слот не указан"}
                                        </span>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: accentColor,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {getStatusLabel(order.status)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div style={{ display: "grid", gap: "10px", paddingTop: "4px" }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        gap: "8px",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setIsAiPlannerOpen(true)}
                        style={{
                            height: "40px",
                            border: "none",
                            borderRadius: "12px",
                            background: "#e5e7eb",
                            color: "#374151",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        ИИ помощник
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setPlanningMode("manual");
                            setExtendTargetRouteId(null);
                            setSelectedOrders([]);
                            setRouteOrders([]);
                            setActiveSavedRouteId(null);
                            setShowAutoPlanner(false);
                            setAiRouteExplanations([]);
                        }}
                        disabled={selectedRegularOrders.length === 0}
                        style={{
                            height: "40px",
                            border: "none",
                            borderRadius: "12px",
                            background: planningMode === "manual" ? "#0f4bb8" : "#e5e7eb",
                            color: planningMode === "manual" ? "#ffffff" : "#374151",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor:
                                selectedRegularOrders.length === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        Ручной
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setPlanningMode("auto");
                            setExtendTargetRouteId(null);
                            setActiveSavedRouteId(null);
                            setShowAutoPlanner((prev) => !prev);
                        }}
                        disabled={selectedRegularOrders.length === 0}
                        style={{
                            height: "40px",
                            border: "none",
                            borderRadius: "12px",
                            background: planningMode === "auto" ? "#0f4bb8" : "#e5e7eb",
                            color: planningMode === "auto" ? "#ffffff" : "#374151",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor:
                                selectedRegularOrders.length === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        Авто
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setShowAutoPlanner(false);
                            if (savedRoutes.length === 0) return;
                            if (extendTargetRouteId) {
                                setPlanningMode("extend");
                                return;
                            }
                            startExtendRoute(savedRoutes[0].id);
                        }}
                        disabled={savedRoutes.length === 0}
                        style={{
                            height: "40px",
                            border: "none",
                            borderRadius: "12px",
                            background: planningMode === "extend" ? "#0f4bb8" : "#e5e7eb",
                            color: planningMode === "extend" ? "#ffffff" : "#374151",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: savedRoutes.length === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        Доплан.
                    </button>
                </div>

                {showAutoPlanner && planningMode === "auto" && (
                    <div
                        style={{
                            border: "1px solid #dbe3f0",
                            borderRadius: "14px",
                            background: "#f8fafc",
                            padding: "12px",
                            display: "grid",
                            gap: "10px",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            Настройки автопостроения
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "10px",
                            }}
                        >
                            <label style={{ display: "grid", gap: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#4b5563", fontWeight: 600 }}>
                                    Кол-во маршрутов
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={autoRouteSettings.courierCount}
                                    onChange={(e) =>
                                        setAutoRouteSettings((prev) => ({
                                            ...prev,
                                            courierCount: Math.max(1, Number(e.target.value) || 1),
                                        }))
                                    }
                                    style={{
                                        height: "36px",
                                        borderRadius: "10px",
                                        border: "1px solid #d1d5db",
                                        padding: "0 10px",
                                        fontSize: "13px",
                                        outline: "none",
                                        background: "#ffffff",
                                        color: "#111827",
                                        WebkitTextFillColor: "#111827",
                                    }}
                                />
                            </label>

                            <label style={{ display: "grid", gap: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#4b5563", fontWeight: 600 }}>
                                    Макс. заказов
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={autoRouteSettings.maxOrdersPerRoute}
                                    onChange={(e) =>
                                        setAutoRouteSettings((prev) => ({
                                            ...prev,
                                            maxOrdersPerRoute: Math.max(1, Number(e.target.value) || 1),
                                        }))
                                    }
                                    style={{
                                        height: "36px",
                                        borderRadius: "10px",
                                        border: "1px solid #d1d5db",
                                        padding: "0 10px",
                                        fontSize: "13px",
                                        outline: "none",
                                        background: "#ffffff",
                                        color: "#111827",
                                        WebkitTextFillColor: "#111827",
                                    }}
                                />
                            </label>
                        </div>

                        <label style={{ display: "grid", gap: "4px" }}>
                            <span style={{ fontSize: "12px", color: "#4b5563", fontWeight: 600 }}>
                                Тип курьера
                            </span>
                            <select
                                value={autoRouteSettings.courierType}
                                onChange={(e) => {
                                    const nextType = e.target.value as AutoRouteSettings["courierType"];
                                    const nextLimit = getCourierTypeDefaultLimit(nextType);

                                    setAutoRouteSettings((prev) => ({
                                        ...prev,
                                        courierType: nextType,
                                        maxOrdersPerRoute: Math.min(prev.maxOrdersPerRoute, nextLimit),
                                    }));
                                }}
                                style={{
                                    height: "36px",
                                    borderRadius: "10px",
                                    border: "1px solid #d1d5db",
                                    padding: "0 10px",
                                    fontSize: "13px",
                                    outline: "none",
                                    background: "#ffffff",
                                    color: "#111827",
                                    WebkitTextFillColor: "#111827",
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    MozAppearance: "none",
                                }}
                            >
                                <option value="car">Водители</option>
                                <option value="walk">Пешие</option>
                                <option value="mixed">Смешанный</option>
                            </select>
                        </label>

                        <label style={{ display: "grid", gap: "4px" }}>
                            <span style={{ fontSize: "12px", color: "#4b5563", fontWeight: 600 }}>
                                Режим оптимизации
                            </span>
                            <select
                                value={autoRouteSettings.optimizationMode}
                                onChange={(e) =>
                                    setAutoRouteSettings((prev) => ({
                                        ...prev,
                                        optimizationMode:
                                            e.target.value as AutoRouteSettings["optimizationMode"],
                                    }))
                                }
                                style={{
                                    height: "36px",
                                    borderRadius: "10px",
                                    border: "1px solid #d1d5db",
                                    padding: "0 10px",
                                    fontSize: "13px",
                                    outline: "none",
                                    background: "#ffffff",
                                    color: "#111827",
                                    WebkitTextFillColor: "#111827",
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    MozAppearance: "none",
                                }}
                            >
                                <option value="sla">Успеть в слоты</option>
                                <option value="geo">Компактно по районам</option>
                                <option value="cost">Минимум стоимости</option>
                            </select>
                        </label>

                        <button
                            type="button"
                            onClick={buildRouteAutomatically}
                            disabled={selectedRegularOrders.length === 0}
                            style={{
                                width: "100%",
                                height: "42px",
                                border: "none",
                                borderRadius: "12px",
                                background:
                                    selectedRegularOrders.length === 0 ? "#93c5fd" : "#0f4bb8",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: 700,
                                cursor:
                                    selectedRegularOrders.length === 0 ? "not-allowed" : "pointer",
                            }}
                        >
                            Построить автоматически
                        </button>
                    </div>
                )}

                {planningMode === "extend" && extendTargetRouteId ? (
                    <button
                        type="button"
                        onClick={addSelectedOrdersToExtendRoute}
                        disabled={selectedRegularOrders.length === 0}
                        style={{
                            width: "100%",
                            height: "44px",
                            border: "none",
                            borderRadius: "12px",
                            background:
                                selectedRegularOrders.length === 0 ? "#93c5fd" : "#0f4bb8",
                            color: "#ffffff",
                            fontSize: "15px",
                            fontWeight: 700,
                            cursor:
                                selectedRegularOrders.length === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        Добавить в маршрут
                    </button>
                ) : (
                    <button
                        onClick={buildAndSaveRoute}
                        disabled={
                            deliveryPanelTab === "express" || selectedRegularOrders.length === 0
                        }
                        style={{
                            width: "100%",
                            height: "44px",
                            border: "none",
                            borderRadius: "12px",
                            background:
                                deliveryPanelTab === "express" || selectedRegularOrders.length === 0
                                    ? "#93c5fd"
                                    : "#0f4bb8",
                            color: "#ffffff",
                            fontSize: "15px",
                            fontWeight: 700,
                            cursor:
                                deliveryPanelTab === "express" || selectedRegularOrders.length === 0
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        Построить маршрут
                    </button>
                )}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                    }}
                >
                    <button
                        type="button"
                        onClick={saveCurrentRouteDraft}
                        disabled={routeOrders.length === 0}
                        style={{
                            width: "100%",
                            height: "40px",
                            border: "none",
                            borderRadius: "12px",
                            background: routeOrders.length === 0 ? "#e5e7eb" : "#dbeafe",
                            color: routeOrders.length === 0 ? "#9ca3af" : "#1d4ed8",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: routeOrders.length === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        Сохранить
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setPlanningMode("manual");
                            setExtendTargetRouteId(null);
                            setSelectedOrders([]);
                            setRouteOrders([]);
                            setActiveSavedRouteId(null);
                            setShowAutoPlanner(false);
                        }}
                        style={{
                            width: "100%",
                            height: "40px",
                            border: "none",
                            borderRadius: "12px",
                            background: "#e5e7eb",
                            color: "#4b5563",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Очистить
                    </button>
                </div>
            </div>
        </div>
    );

    const rightOverlay = (
        <div
            style={{
                position: "absolute",
                top: "84px",
                right: "16px",
                bottom: "16px",
                width: "390px",
                zIndex: 60,
                pointerEvents: "auto",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {rightColumn}
        </div>
    );

    const aiPlannerModal = isAiPlannerOpen ? (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.35)",
                zIndex: 500,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: "72px",
                paddingLeft: "24px",
                paddingRight: "24px",
                paddingBottom: "24px",
            }}
            onClick={() => setIsAiPlannerOpen(false)}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "900px",
                    maxHeight: "82vh",
                    overflowY: "auto",
                    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                    borderRadius: "24px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 24px 80px rgba(15,23,42,0.25)",
                    padding: "24px",
                    display: "grid",
                    gap: "16px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gap: "6px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "24px",
                                fontWeight: 900,
                                color: "#111827",
                            }}
                        >
                            AI Planner
                        </div>

                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                height: "28px",
                                padding: "0 10px",
                                borderRadius: "999px",
                                background: "#dbeafe",
                                color: "#1d4ed8",
                                fontSize: "12px",
                                fontWeight: 800,
                            }}
                        >
                            Dispatcher Assistant
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: "14px",
                            color: "#6b7280",
                            lineHeight: 1.5,
                            maxWidth: "720px",
                        }}
                    >
                        Напиши задачу обычным языком или выбери готовый шаблон. AI преобразует её в понятный план маршрутизации и объяснит результат.
                    </div>
                </div>

                <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Например: Построй 3 маршрута, без срочных, ранние слоты в приоритете"
                    style={{
                        width: "100%",
                        minHeight: "120px",
                        resize: "vertical",
                        borderRadius: "14px",
                        border: "1px solid #d1d5db",
                        padding: "14px 16px",
                        fontSize: "14px",
                        lineHeight: 1.5,
                        outline: "none",
                        boxSizing: "border-box",
                        color: "#111827",
                        background: "#ffffff",
                    }}
                />
                <div
                    style={{
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
                                fontSize: "14px",
                                fontWeight: 800,
                                color: "#111827",
                            }}
                        >
                            Быстрые шаблоны
                        </div>

                        <div
                            style={{
                                fontSize: "12px",
                                color: "#6b7280",
                            }}
                        >
                            Нажми, чтобы сразу подставить готовую команду
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "10px",
                        }}
                    >
                        {AI_PLANNER_TEMPLATES.map((template) => (
                            <div
                                key={template.id}
                                style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "14px",
                                    background: "#ffffff",
                                    padding: "12px",
                                    display: "grid",
                                    gap: "10px",
                                    boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: 800,
                                        color: "#111827",
                                    }}
                                >
                                    {template.title}
                                </div>

                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#4b5563",
                                        lineHeight: 1.45,
                                        minHeight: "52px",
                                    }}
                                >
                                    {template.text}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => applyAiTemplate(template.text)}
                                        style={{
                                            flex: 1,
                                            height: "36px",
                                            border: "none",
                                            borderRadius: "10px",
                                            background: "#dbeafe",
                                            color: "#1d4ed8",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Использовать
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => appendAiTemplate(template.text)}
                                        style={{
                                            flex: 1,
                                            height: "36px",
                                            border: "none",
                                            borderRadius: "10px",
                                            background: "#f3f4f6",
                                            color: "#374151",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Добавить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={handleAiPlannerAnalyze}
                        disabled={aiPlannerLoading || !aiPrompt.trim()}
                        style={{
                            minWidth: "180px",
                            height: "44px",
                            border: "none",
                            borderRadius: "12px",
                            background:
                                aiPlannerLoading || !aiPrompt.trim() ? "#93c5fd" : "#0f4bb8",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor:
                                aiPlannerLoading || !aiPrompt.trim() ? "not-allowed" : "pointer",
                        }}
                    >
                        {aiPlannerLoading ? "Разбираем..." : "Разобрать запрос"}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setAiPrompt("");
                            setAiPlannerResult(null);
                            setAiRouteExplanations([]);
                        }}
                        style={{
                            minWidth: "140px",
                            height: "44px",
                            border: "none",
                            borderRadius: "12px",
                            background: "#e5e7eb",
                            color: "#374151",
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Очистить
                    </button>
                </div>

                {aiPlannerResult && (
                    <div
                        style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            background: "#f8fafc",
                            padding: "16px",
                            display: "grid",
                            gap: "10px",
                        }}
                    >
                        {!aiPlannerResult.success || !aiPlannerResult.plan ? (
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#b91c1c",
                                    fontWeight: 600,
                                    lineHeight: 1.45,
                                }}
                            >
                                {aiPlannerResult.error || "AI не смог разобрать запрос"}
                            </div>
                        ) : (
                            <>
                                <div
                                    style={{
                                        fontSize: "15px",
                                        fontWeight: 800,
                                        color: "#111827",
                                    }}
                                >
                                    Что понял AI
                                </div>

                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    Маршрутов: <strong>{aiPlannerResult.plan.routeCount}</strong>
                                </div>

                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    Режим: <strong>{aiPlannerResult.plan.optimizationMode}</strong>
                                </div>

                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    Макс. заказов в маршруте:{" "}
                                    <strong>{aiPlannerResult.plan.maxOrdersPerRoute}</strong>
                                </div>

                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    Исключить срочные:{" "}
                                    <strong>
                                        {aiPlannerResult.plan.excludeDeliveryTypes.includes("express-delivery")
                                            ? "Да"
                                            : "Нет"}
                                    </strong>
                                </div>

                                <div style={{ fontSize: "14px", color: "#374151" }}>
                                    Приоритет ранних слотов:{" "}
                                    <strong>
                                        {aiPlannerResult.plan.prioritizeEarlySlots ? "Да" : "Нет"}
                                    </strong>
                                </div>

                                {aiPlannerResult.plan.notes.length > 0 && (
                                    <div
                                        style={{
                                            display: "grid",
                                            gap: "6px",
                                            marginTop: "4px",
                                        }}
                                    >
                                        {aiPlannerResult.plan.notes.map((note, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    fontSize: "13px",
                                                    color: "#6b7280",
                                                    lineHeight: 1.45,
                                                }}
                                            >
                                                • {note}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={applyAiPlannerPlan}
                                    style={{
                                        width: "100%",
                                        height: "46px",
                                        border: "none",
                                        borderRadius: "12px",
                                        background: "#dbeafe",
                                        color: "#1d4ed8",
                                        fontSize: "15px",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        marginTop: "6px",
                                    }}
                                >
                                    Применить план
                                </button>

                                {aiRouteExplanations.length > 0 && (
                                    <div
                                        style={{
                                            marginTop: "8px",
                                            display: "grid",
                                            gap: "10px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: 800,
                                                color: "#111827",
                                            }}
                                        >
                                            Как AI объясняет результат
                                        </div>

                                        {aiRouteExplanations.map((item) => (
                                            <div
                                                key={item.routeId}
                                                style={{
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "12px",
                                                    background: "#ffffff",
                                                    padding: "12px",
                                                    display: "grid",
                                                    gap: "8px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: "14px",
                                                        fontWeight: 800,
                                                        color: "#111827",
                                                    }}
                                                >
                                                    {item.title}
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: "13px",
                                                        color: "#4b5563",
                                                        lineHeight: 1.5,
                                                    }}
                                                >
                                                    {item.summary}
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#6b7280",
                                                    }}
                                                >
                                                    Точек: <strong>{item.pointsCount}</strong>
                                                    {item.earliestSlot ? ` · от ${item.earliestSlot}` : ""}
                                                    {item.latestSlot ? ` до ${item.latestSlot}` : ""}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    ) : null;

    const routesBar =
        deliveryDate && deliveryPanelTab === "planned" && savedRoutes.length > 0 ? (
            <div
                style={{
                    position: "absolute",
                    left: "96px",
                    right: "426px",
                    bottom: "204px",
                    zIndex: 41,
                    pointerEvents: "auto",
                }}
            >
                <div
                    style={{
                        background: "rgba(255,255,255,0.94)",
                        border: "1px solid rgba(229,231,235,0.95)",
                        borderRadius: "16px",
                        boxShadow: "0 10px 24px rgba(15,23,42,0.10)",
                        backdropFilter: "blur(10px)",
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        overflowX: "auto",
                    }}
                >
                    <div
                        style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#6b7280",
                            whiteSpace: "nowrap",
                            marginRight: "4px",
                        }}
                    >
                        Маршруты на дату:
                    </div>

                    {savedRoutes.map((route) => {
                        const isActive = route.id === extendTargetRouteId;

                        return (
                            <button
                                key={route.id}
                                type="button"
                                onClick={() => startExtendRoute(route.id)}
                                style={{
                                    border: isActive ? "2px solid #2563eb" : "1px solid #dbe3f0",
                                    background: isActive ? "#eff6ff" : "#ffffff",
                                    color: isActive ? "#1d4ed8" : "#374151",
                                    borderRadius: "10px",
                                    padding: "8px 10px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                }}
                            >
                                #{route.id.toString().slice(-4)} · {route.orders.length} т.
                            </button>
                        );
                    })}
                </div>
            </div>
        ) : null;

    const bottomOverlay = (
        <div
            style={{
                position: "absolute",
                left: "96px",
                right: "426px",
                bottom: "16px",
                zIndex: 40,
                pointerEvents: "auto",
            }}
        >
            <div
                style={{
                    background: "rgba(255,255,255,0.94)",
                    border: "1px solid rgba(229,231,235,0.95)",
                    borderRadius: "18px",
                    boxShadow: "0 14px 36px rgba(15,23,42,0.12)",
                    backdropFilter: "blur(10px)",
                    padding: "12px 14px",
                    minHeight: "112px",
                    maxHeight: "180px",
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateRows: "auto minmax(0, 1fr)",
                    gap: "8px",
                }}
            >
                {savedRoutes.length === 0 || !currentSavedRoute ? (
                    <div
                        style={{
                            height: "100%",
                            minHeight: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            color: "#6b7280",
                            fontSize: "14px",
                            fontWeight: 500,
                            padding: "16px",
                        }}
                    >
                        No active routes yet
                    </div>
                ) : (
                    <>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "36px minmax(0, 1fr) 36px",
                                gap: "8px",
                                alignItems: "center",
                            }}
                        >
                            <button
                                onClick={showPrevSavedRoute}
                                style={{
                                    border: "1px solid #d1d5db",
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                    fontWeight: 800,
                                    color: "#111827",
                                    width: "36px",
                                    minWidth: "36px",
                                    height: "44px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                title="Previous route"
                            >
                                ←
                            </button>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "minmax(220px, 1fr) 240px",
                                    gap: "16px",
                                    alignItems: "center",
                                    minWidth: 0,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        flexWrap: "wrap",
                                        minWidth: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: "#111827",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        Current route
                                    </div>

                                    <div
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            background: "rgba(17,24,39,0.88)",
                                            color: "#ffffff",
                                            borderRadius: "999px",
                                            padding: "4px 10px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            whiteSpace: "nowrap",
                                            boxShadow: "0 6px 14px rgba(15,23,42,0.12)",
                                        }}
                                    >
                                        {planningMode === "manual" && "Ручное построение"}
                                        {planningMode === "auto" && "Автоматическое построение"}
                                        {planningMode === "extend" &&
                                            `Допланирование ${extendTargetRouteId
                                                ? `#${extendTargetRouteId.toString().slice(-4)}`
                                                : ""
                                            }`}
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: 800,
                                            color: "#0f4bb8",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        #{currentSavedRoute.id.toString().slice(-4)}
                                    </div>

                                    <div
                                        style={{
                                            width: "4px",
                                            height: "4px",
                                            borderRadius: "999px",
                                            background: "#d1d5db",
                                        }}
                                    />

                                    <div
                                        style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#4b5563",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "240px",
                                        }}
                                    >
                                        {currentSavedRoute.courierName || "Courier not assigned"}
                                    </div>

                                    <div
                                        style={{
                                            width: "4px",
                                            height: "4px",
                                            borderRadius: "999px",
                                            background: "#d1d5db",
                                        }}
                                    />

                                    <div
                                        style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#4b5563",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {currentSavedRoute.orders.length} stops
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "grid",
                                        gap: "4px",
                                        justifyItems: "end",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            fontWeight: 800,
                                            color: "#4b5563",
                                            textTransform: "uppercase",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        Completed {currentRouteCompletedCount} of{" "}
                                        {currentSavedRoute.orders.length}
                                    </div>

                                    <div
                                        style={{
                                            width: "220px",
                                            height: "6px",
                                            background: "#e5e7eb",
                                            borderRadius: "999px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${currentRouteProgressPercent}%`,
                                                height: "100%",
                                                background: "#0f4bb8",
                                                borderRadius: "999px",
                                                transition: "width 0.2s ease",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={showNextSavedRoute}
                                style={{
                                    border: "1px solid #d1d5db",
                                    background: "#ffffff",
                                    borderRadius: "12px",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                    fontWeight: 800,
                                    color: "#111827",
                                    width: "36px",
                                    minWidth: "36px",
                                    height: "44px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                title="Next route"
                            >
                                →
                            </button>
                        </div>

                        <div
                            style={{
                                minHeight: 0,
                                overflowX: "auto",
                                overflowY: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "stretch",
                                    gap: "8px",
                                    minWidth: "max-content",
                                    paddingRight: "4px",
                                }}
                            >
                                {currentSavedRoute.orders.map((order, index) => {
                                    const isComplete = order.status === "complete";

                                    return (
                                        <div
                                            key={order.id}
                                            draggable
                                            onDragStart={() => {
                                                setDraggedSavedRouteOrderId(order.id);
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                            }}
                                            onDrop={() => {
                                                if (draggedSavedRouteOrderId !== null) {
                                                    reorderSavedRouteOrders(
                                                        currentSavedRoute.id,
                                                        draggedSavedRouteOrderId,
                                                        order.id
                                                    );
                                                }
                                                setDraggedSavedRouteOrderId(null);
                                            }}
                                            onDragEnd={() => {
                                                setDraggedSavedRouteOrderId(null);
                                            }}
                                            style={{
                                                width: "210px",
                                                minWidth: "210px",
                                                border: "1px solid #dbe3f0",
                                                borderRadius: "12px",
                                                background: "#ffffff",
                                                padding: "6px 8px",
                                                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                                                display: "grid",
                                                gap: "3px",
                                                cursor: "grab",
                                                alignContent: "start",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    justifyContent: "space-between",
                                                    gap: "8px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        minWidth: 0,
                                                        display: "grid",
                                                        gap: "2px",
                                                        flex: 1,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: "13px",
                                                            fontWeight: 800,
                                                            color: "#111827",
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                        }}
                                                    >
                                                        {order.title.replace("Заказ #", "№")}
                                                    </div>

                                                    <div
                                                        style={{
                                                            fontSize: "10px",
                                                            fontWeight: 700,
                                                            color: "#4b5563",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {order.deliveryFrom && order.deliveryTo
                                                            ? `${order.deliveryFrom} - ${order.deliveryTo}`
                                                            : "No slot"}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeOrderFromRoute(currentSavedRoute.id, order.id);
                                                    }}
                                                    style={{
                                                        width: "20px",
                                                        height: "20px",
                                                        minWidth: "20px",
                                                        border: "none",
                                                        borderRadius: "6px",
                                                        background: "#f3f4f6",
                                                        color: "#6b7280",
                                                        fontSize: "12px",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        padding: 0,
                                                        lineHeight: 1,
                                                    }}
                                                    title="Удалить из маршрута"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <div
                                                style={{
                                                    fontSize: "10px",
                                                    color: "#4b5563",
                                                    lineHeight: 1.15,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                    minHeight: "22px",
                                                }}
                                            >
                                                {getCleanCardAddress(order.textAddress)}
                                            </div>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    gap: "8px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        alignSelf: "flex-start",
                                                        width: "fit-content",
                                                        maxWidth: "110px",
                                                        fontSize: "10px",
                                                        fontWeight: 800,
                                                        color: isComplete ? "#6b7280" : "#0f4bb8",
                                                        background: isComplete ? "#f3f4f6" : "#dbeafe",
                                                        borderRadius: "999px",
                                                        padding: "2px 8px",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {getStatusLabel(order.status)}
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: "10px",
                                                        fontWeight: 700,
                                                        color: "#9ca3af",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    #{index + 1}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <main
            className={styles.page}
            style={{
                padding: 0,
                margin: 0,
                width: "100vw",
                height: "100vh",
                minHeight: "100vh",
                overflow: "hidden",
                background:
                    "linear-gradient(135deg, rgba(246,185,129,0.34) 0%, rgba(201,235,214,0.32) 100%)",
                position: "relative",
            }}
        >


            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                }}
            >
                {loading ? (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            color: "#374151",
                            background: "#e5e7eb",
                        }}
                    >
                        Загрузка заказов...
                    </div>
                ) : error ? (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            color: "#b91c1c",
                            background: "#fef2f2",
                        }}
                    >
                        {error}
                    </div>
                ) : (
                    <div
                        className={styles.mapCard}
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: 0,
                            border: "none",
                            boxShadow: "none",
                        }}
                    >

                        <div
                            style={{
                                position: "absolute",
                                top: "80px",
                                left: "100px",
                                zIndex: 80,
                                background: "rgba(255,255,255,0.95)",
                                border: "1px solid #e5e7eb",
                                borderRadius: "12px",
                                padding: "10px 12px",
                                fontSize: "13px",
                                color: "#111827",
                                boxShadow: "0 8px 24px rgba(15,23,42,0.10)",
                            }}
                        >
                            Всего заказов: {orders.length}
                            <br />
                            С координатами: {activeTabOrders.filter(hasCoordinates).length}
                        </div>
                        <YandexMap
                            orders={deliveryDate ? activeTabOrders.filter(hasCoordinates) : []}
                            routeOrders={deliveryDate ? routeOrders.filter(hasCoordinates) : []}
                            routeGroups={deliveryDate ? mapRouteGroups : []}
                            activeRouteGroupId={deliveryDate ? activeMapRouteGroupId : "all"}
                            selectedOrderIds={deliveryDate ? selectedOrders : []}
                            warehouse={WAREHOUSE}
                            returnToWarehouse={false}
                            onOrderCtrlClick={(orderId) => {
                                if (!deliveryDate) return;
                                toggleOrder(orderId);
                            }}
                        />
                    </div>
                )}
            </div>

            {statusDropdownOverlay}
            {mapFiltersOverlay}
            {rightOverlay}
            {aiPlannerModal}
            {emptyStateOverlay}
            {routesBar}
            {deliveryDate && deliveryPanelTab === "planned" ? bottomOverlay : null}
        </main>
    );
}