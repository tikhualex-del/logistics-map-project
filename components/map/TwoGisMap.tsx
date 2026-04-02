"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { load } from "@2gis/mapgl";

type Order = {
    id: number;
    title: string;
    status: string;
    internalStage?: string | null;
    textAddress?: string | null;
    deliveryTypeCode?: string;
    deliveryTypeName?: string;
    deliveryFrom?: string;
    deliveryTo?: string;
    courierId?: number | null;
    courierName?: string | null;
    coordinates: [number, number] | null;
    capacityPoints?: number;
};

type MapStatusConfigItem = {
    rawStatus: string;
    internalStage?: string;
    label?: string;
    color?: string;
    iconUrl?: string;
    isVisible?: boolean;
};

type Props = {
    orders: Order[];
    mapStatusConfig?: MapStatusConfigItem[];
};

function getStatusLabel(status: string) {
    switch (status) {
        case "new": return "Новый";
        case "manager-processing": return "В работе";
        case "need-contract": return "Ожидание оплаты";
        case "call-later": return "Перезвонить";
        case "no-product": return "Нет в наличии";
        case "send-to-cashboard": return "Передано на кассу";
        case "client-confirmed": return "Согласовано с клиентом";
        case "special-confirmation": return "Специальное согласование";
        case "send-to-assembling": return "Передано в комплектацию";
        case "assembling-complete": return "Укомплектован";
        case "delivering": return "Доставляется";
        case "delivered": return "Доставлен";
        case "returned-to-zero": return "Возврат с маршрута";
        case "courier-assigned": return "Курьер назначен";
        case "complete": return "Выполнен";
        case "cancel-client": return "Отказ от заказа";
        case "cancel-operator": return "Отменен";
        default: return status;
    }
}

function getMapStatusView(order: Order, config: MapStatusConfigItem[]) {
    const byRaw = config.find(i => i.rawStatus === order.status);

    const byStage =
        order.internalStage?.trim()
            ? config.find(i =>
                (i.internalStage || "").trim() === order.internalStage?.trim()
            )
            : null;

    const matched = byRaw || byStage;

    return {
        label: matched?.label?.trim() || getStatusLabel(order.status),
        color: matched?.color?.trim() || "#2563eb",
        iconUrl: matched?.iconUrl?.trim() || "",
        isVisible: matched?.isVisible ?? true,
    };
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function buildCustomMarkerHtml(iconUrl: string, color: string, title: string) {
    return `
        <div style="transform: translate(-50%, -100%); cursor:pointer;">
            <div style="
                width:36px;height:36px;
                border-radius:12px;
                background:#fff;
                border:2px solid ${color};
                display:flex;align-items:center;justify-content:center;
            ">
                <img src="${escapeHtml(iconUrl)}" style="width:22px;height:22px;" />
            </div>
        </div>
    `;
}

export default function TwoGisMap({ orders, mapStatusConfig = [] }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const mapglRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [mapReady, setMapReady] = useState(false);

    const ordersKey = useMemo(() => JSON.stringify(orders), [orders]);
    const configKey = useMemo(() => JSON.stringify(mapStatusConfig), [mapStatusConfig]);

    useEffect(() => {
        if (!containerRef.current) return;

        const apiKey = process.env.NEXT_PUBLIC_2GIS_MAPS_API_KEY;

        if (!apiKey) {
            console.error("2GIS API key is missing");
            return;
        }

        load().then((mapgl) => {
            mapglRef.current = mapgl;
            console.log("2GIS mapgl loaded", {
                hasMapgl: !!mapgl,
                hasMarkerClass: !!mapgl.Marker,
                hasHtmlMarkerClass: !!mapgl.HtmlMarker,
            });

            mapRef.current = new mapgl.Map(containerRef.current!, {
                center: [37.618423, 55.751244],
                zoom: 11,
            });
            console.log("2GIS map created", {
                hasMapRef: !!mapRef.current,
                center: [37.618423, 55.751244],
            });

            mapRef.current.on("load", () => {
                console.log("2GIS map load event fired");
                setMapReady(true);
            });
        });

        return () => {
            markersRef.current.forEach(m => m.destroy());
            mapRef.current?.destroy();
        };
    }, []);

    useEffect(() => {
        if (!mapReady) return;
        if (!mapReady) return;

        console.log("2GIS marker effect start", {
            mapReady,
            hasMapRef: !!mapRef.current,
            hasMapglRef: !!mapglRef.current,
            ordersCount: orders.length,
            configCount: mapStatusConfig.length,
        });

        markersRef.current.forEach(m => m.destroy());
        markersRef.current = [];
        const debugMarker = new mapglRef.current.HtmlMarker(mapRef.current, {
            coordinates: [37.618423, 55.751244],
            html: `
        <div style="
            width: 24px;
            height: 24px;
            border-radius: 999px;
            background: red;
            border: 3px solid white;
            box-shadow: 0 0 0 2px red;
            transform: translate(-50%, -50%);
        "></div>
    `,
        });
        console.log("2GIS debug marker created", {
            hasDebugMarker: !!debugMarker,
        });

        const visibleOrders = orders.filter(
            (o): o is Order & { coordinates: [number, number] } =>
                !!o.coordinates
        );
        console.log("2GIS visible orders", {
            visibleOrdersCount: visibleOrders.length,
            sampleOrder: visibleOrders[0] || null,
        });

        const markers = visibleOrders.map(order => {
            const view = getMapStatusView(order, mapStatusConfig);

            const coords: [number, number] = [
                order.coordinates[1],
                order.coordinates[0],
            ];

            if (view.iconUrl) {
                return new mapglRef.current.HtmlMarker(mapRef.current, {
                    coordinates: coords,
                    html: buildCustomMarkerHtml(view.iconUrl, view.color, order.title),
                });
            }

            return new mapglRef.current.Marker(mapRef.current, {
                coordinates: coords,
            });
        });

        markersRef.current = [debugMarker, ...markers];

    }, [ordersKey, configKey, mapReady]);

    return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}