import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";
import { prisma } from "@/lib/prisma";

type DeliveryZoneDto = {
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

type PolygonPoint = [number, number];

type ImportZoneInput = {
    name?: unknown;
    color?: unknown;
    polygonJson?: unknown;
    price?: unknown;
    priority?: unknown;
    isActive?: unknown;
};

function mapZone(zone: {
    id: string;
    name: string;
    color: string;
    polygonJson: string;
    price: { toString(): string } | null;
    priority: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}): DeliveryZoneDto {
    return {
        id: zone.id,
        name: zone.name,
        color: zone.color,
        polygonJson: zone.polygonJson,
        price: zone.price ? zone.price.toString() : null,
        priority: zone.priority,
        isActive: zone.isActive,
        createdAt: zone.createdAt.toISOString(),
        updatedAt: zone.updatedAt.toISOString(),
    };
}

function isValidPolygonPoint(value: unknown): value is PolygonPoint {
    return (
        Array.isArray(value) &&
        value.length === 2 &&
        typeof value[0] === "number" &&
        Number.isFinite(value[0]) &&
        typeof value[1] === "number" &&
        Number.isFinite(value[1])
    );
}

function validatePolygonJson(raw: string): { ok: true } | { ok: false; message: string } {
    let parsed: unknown;

    try {
        parsed = JSON.parse(raw);
    } catch {
        return {
            ok: false,
            message: "polygonJson must be valid JSON",
        };
    }

    if (!Array.isArray(parsed)) {
        return {
            ok: false,
            message: "polygonJson must be an array of points",
        };
    }

    if (parsed.length < 3) {
        return {
            ok: false,
            message: "polygonJson must contain at least 3 points",
        };
    }

    const hasInvalidPoint = parsed.some((point) => !isValidPolygonPoint(point));

    if (hasInvalidPoint) {
        return {
            ok: false,
            message: "Each polygon point must be [latitude, longitude]",
        };
    }

    return { ok: true };
}

function normalizeImportZone(
    item: ImportZoneInput,
    index: number
): { ok: true; data: { name: string; color: string; polygonJson: string; price: string | null; priority: number; isActive: boolean } } | { ok: false; message: string } {
    const name = String(item?.name || "").trim() || `Импортированная зона ${index + 1}`;
    const color = String(item?.color || "#2563eb").trim() || "#2563eb";
    const polygonJson = String(item?.polygonJson || "").trim();
    const priority = Number(item?.priority ?? 100);
    const isActive = typeof item?.isActive === "boolean" ? item.isActive : true;

    const rawPrice = item?.price;
    const price =
        rawPrice === null || rawPrice === undefined || rawPrice === ""
            ? null
            : String(rawPrice).trim();

    if (!polygonJson) {
        return {
            ok: false,
            message: `polygonJson is required for item ${index + 1}`,
        };
    }

    const polygonValidation = validatePolygonJson(polygonJson);

    if (!polygonValidation.ok) {
        return {
            ok: false,
            message: `Invalid polygon in item ${index + 1}: ${polygonValidation.message}`,
        };
    }

    return {
        ok: true,
        data: {
            name,
            color,
            polygonJson,
            price,
            priority: Number.isFinite(priority) ? priority : 100,
            isActive,
        },
    };
}

export async function GET() {
    try {
        const session = await requireSession();

        const zones = await prisma.deliveryZone.findMany({
            where: {
                companyId: session.companyId,
            },
            orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
            select: {
                id: true,
                name: true,
                color: true,
                polygonJson: true,
                price: true,
                priority: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: zones.map(mapZone),
        });
    } catch (error) {
        console.error("Get delivery zones error:", error);

        const message =
            error instanceof Error ? error.message : "Failed to load delivery zones";

        const status = message === "Not authenticated" ? 401 : 500;

        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const body = await request.json();

        const name = String(body?.name || "").trim();
        const color = String(body?.color || "#2563eb").trim() || "#2563eb";
        const polygonJson = String(body?.polygonJson || "").trim();
        const priority = Number(body?.priority ?? 100);
        const isActive =
            typeof body?.isActive === "boolean" ? body.isActive : true;

        const rawPrice = body?.price;
        const price =
            rawPrice === null || rawPrice === undefined || rawPrice === ""
                ? null
                : String(rawPrice).trim();

        if (!name) {
            return NextResponse.json(
                {
                    success: false,
                    message: "name is required",
                },
                { status: 400 }
            );
        }

        if (!polygonJson) {
            return NextResponse.json(
                {
                    success: false,
                    message: "polygonJson is required",
                },
                { status: 400 }
            );
        }

        const polygonValidation = validatePolygonJson(polygonJson);

        if (!polygonValidation.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: polygonValidation.message,
                },
                { status: 400 }
            );
        }

        const createdZone = await prisma.deliveryZone.create({
            data: {
                companyId: session.companyId,
                name,
                color,
                polygonJson,
                price,
                priority: Number.isFinite(priority) ? priority : 100,
                isActive,
            },
            select: {
                id: true,
                name: true,
                color: true,
                polygonJson: true,
                price: true,
                priority: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Delivery zone created successfully",
            data: mapZone(createdZone),
        });
    } catch (error) {
        console.error("Create delivery zone error:", error);

        const message =
            error instanceof Error ? error.message : "Failed to create delivery zone";

        const status =
            message === "Not authenticated"
                ? 401
                : message === "Forbidden"
                    ? 403
                    : 400;

        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const body = await request.json();

        const id = String(body?.id || "").trim();

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "id is required",
                },
                { status: 400 }
            );
        }

        const existingZone = await prisma.deliveryZone.findFirst({
            where: {
                id,
                companyId: session.companyId,
            },
            select: {
                id: true,
            },
        });

        if (!existingZone) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Delivery zone not found",
                },
                { status: 404 }
            );
        }

        const hasIsActiveOnlyUpdate =
            typeof body?.isActive === "boolean" &&
            body?.name === undefined &&
            body?.color === undefined &&
            body?.polygonJson === undefined &&
            body?.priority === undefined &&
            body?.price === undefined;

        if (hasIsActiveOnlyUpdate) {
            const updatedZone = await prisma.deliveryZone.update({
                where: {
                    id,
                },
                data: {
                    isActive: body.isActive,
                },
                select: {
                    id: true,
                    name: true,
                    color: true,
                    polygonJson: true,
                    price: true,
                    priority: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return NextResponse.json({
                success: true,
                message: "Delivery zone updated successfully",
                data: mapZone(updatedZone),
            });
        }

        const name = String(body?.name || "").trim();
        const color = String(body?.color || "#2563eb").trim() || "#2563eb";
        const polygonJson = String(body?.polygonJson || "").trim();
        const priority = Number(body?.priority ?? 100);

        const rawPrice = body?.price;
        const price =
            rawPrice === null || rawPrice === undefined || rawPrice === ""
                ? null
                : String(rawPrice).trim();

        if (!name) {
            return NextResponse.json(
                {
                    success: false,
                    message: "name is required",
                },
                { status: 400 }
            );
        }

        if (!polygonJson) {
            return NextResponse.json(
                {
                    success: false,
                    message: "polygonJson is required",
                },
                { status: 400 }
            );
        }

        const polygonValidation = validatePolygonJson(polygonJson);

        if (!polygonValidation.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: polygonValidation.message,
                },
                { status: 400 }
            );
        }

        const updatedZone = await prisma.deliveryZone.update({
            where: {
                id,
            },
            data: {
                name,
                color,
                polygonJson,
                price,
                priority: Number.isFinite(priority) ? priority : 100,
            },
            select: {
                id: true,
                name: true,
                color: true,
                polygonJson: true,
                price: true,
                priority: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Delivery zone updated successfully",
            data: mapZone(updatedZone),
        });
    } catch (error) {
        console.error("Update delivery zone error:", error);

        const message =
            error instanceof Error ? error.message : "Failed to update delivery zone";

        const status =
            message === "Not authenticated"
                ? 401
                : message === "Forbidden"
                    ? 403
                    : 400;

        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const body = await request.json();
        const items: ImportZoneInput[] | null = Array.isArray(body?.zones)
            ? (body.zones as ImportZoneInput[])
            : null;

        if (!items || items.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "zones array is required",
                },
                { status: 400 }
            );
        }

        const normalizedItems: Array<
            | { ok: true; data: { name: string; color: string; polygonJson: string; price: string | null; priority: number; isActive: boolean } }
            | { ok: false; message: string }
        > = items.map((item: ImportZoneInput, index: number) =>
            normalizeImportZone(item, index)
        );

        const firstInvalidItem = normalizedItems.find(
            (item: { ok: true; data: { name: string; color: string; polygonJson: string; price: string | null; priority: number; isActive: boolean } } | { ok: false; message: string }) => !item.ok
        );

        if (firstInvalidItem && !firstInvalidItem.ok) {
            return NextResponse.json(
                {
                    success: false,
                    message: firstInvalidItem.message,
                },
                { status: 400 }
            );
        }

        const validItems = normalizedItems.filter(
            (item): item is { ok: true; data: { name: string; color: string; polygonJson: string; price: string | null; priority: number; isActive: boolean } } => item.ok
        );

        const dataToCreate = validItems.map((item) => ({
            companyId: session.companyId,
            name: item.data.name,
            color: item.data.color,
            polygonJson: item.data.polygonJson,
            price: item.data.price,
            priority: item.data.priority,
            isActive: item.data.isActive,
        }));

        const createdZones = await prisma.$transaction(
            dataToCreate.map((zoneData) =>
                prisma.deliveryZone.create({
                    data: zoneData,
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        polygonJson: true,
                        price: true,
                        priority: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                })
            )
        );

        return NextResponse.json({
            success: true,
            message: `Imported ${createdZones.length} delivery zones successfully`,
            data: createdZones.map(mapZone),
        });
    } catch (error) {
        console.error("Bulk import delivery zones error:", error);

        const message =
            error instanceof Error ? error.message : "Failed to import delivery zones";

        const status =
            message === "Not authenticated"
                ? 401
                : message === "Forbidden"
                    ? 403
                    : 400;

        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const body = await request.json();
        const id = String(body?.id || "").trim();

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "id is required",
                },
                { status: 400 }
            );
        }

        const existingZone = await prisma.deliveryZone.findFirst({
            where: {
                id,
                companyId: session.companyId,
            },
            select: {
                id: true,
            },
        });

        if (!existingZone) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Delivery zone not found",
                },
                { status: 404 }
            );
        }

        await prisma.deliveryZone.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Delivery zone deleted successfully",
        });
    } catch (error) {
        console.error("Delete delivery zone error:", error);

        const message =
            error instanceof Error ? error.message : "Failed to delete delivery zone";

        const status =
            message === "Not authenticated"
                ? 401
                : message === "Forbidden"
                    ? 403
                    : 400;

        return NextResponse.json(
            {
                success: false,
                message,
            },
            { status }
        );
    }
}