import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";
import {
    createItemLoadMapping,
    getItemLoadMappingsByCompanyId,
} from "@/server/item-load-mappings/item-load-mappings.service";

const ALLOWED_EXTERNAL_FIELD_TYPES = ["sku", "name", "category"];
const ALLOWED_MATCH_TYPES = ["exact", "contains"];

export async function GET() {
    try {
        const session = await requireSession();

        const mappings = await getItemLoadMappingsByCompanyId(session.companyId);

        return NextResponse.json({
            success: true,
            data: mappings,
        });
    } catch (error) {
        console.error("Get item load mappings error:", error);

        const message =
            error instanceof Error
                ? error.message
                : "Failed to load item load mappings";

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

        const integrationId = String(body?.integrationId || "").trim();
        const externalFieldType = String(body?.externalFieldType || "")
            .trim()
            .toLowerCase();
        const matchType = String(body?.matchType || "").trim().toLowerCase();
        const externalValue = String(body?.externalValue || "").trim();
        const loadUnitId = String(body?.loadUnitId || "").trim();
        const multiplier = Number(body?.multiplier);
        const priority = Number(body?.priority);

        if (
            !integrationId ||
            !externalFieldType ||
            !matchType ||
            !externalValue ||
            !loadUnitId ||
            !Number.isFinite(multiplier) ||
            !Number.isFinite(priority)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "integrationId, externalFieldType, matchType, externalValue, loadUnitId, multiplier and priority are required",
                },
                { status: 400 }
            );
        }

        if (!ALLOWED_EXTERNAL_FIELD_TYPES.includes(externalFieldType)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "externalFieldType must be sku, name or category",
                },
                { status: 400 }
            );
        }

        if (!ALLOWED_MATCH_TYPES.includes(matchType)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "matchType must be exact or contains",
                },
                { status: 400 }
            );
        }

        if (multiplier <= 0 || priority < 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "multiplier must be greater than 0 and priority must be 0 or greater",
                },
                { status: 400 }
            );
        }

        const mapping = await createItemLoadMapping({
            companyId: session.companyId,
            integrationId,
            externalFieldType,
            matchType,
            externalValue,
            loadUnitId,
            multiplier,
            priority,
        });

        return NextResponse.json({
            success: true,
            message: "Item load mapping created successfully",
            data: mapping,
        });
    } catch (error) {
        console.error("Create item load mapping error:", error);

        const message =
            error instanceof Error
                ? error.message
                : "Failed to create item load mapping";

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