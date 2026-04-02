"use client";

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
    capacityPoints?: number;
};

type Props = {
    orders: Order[];
};

export default function GoogleMap({ orders }: Props) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minHeight: "320px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                color: "#111827",
                fontSize: "18px",
                fontWeight: 600,
            }}
        >
            Google Maps placeholder. Orders: {orders.length}
        </div>
    );
}