import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";
import {
    getGeneralSettingsByCompanyId,
    updateGeneralSettingsByCompanyId,
} from "@/server/settings/general-settings.service";

const ALLOWED_MAP_PROVIDERS = ["yandex", "2gis", "google"] as const;

export async function GET() {
    try {
        const session = await requireSession();

        const settings = await getGeneralSettingsByCompanyId(session.companyId);

        if (!settings) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Company settings not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error("Get general settings error:", error);

        const message =
            error instanceof Error
                ? error.message
                : "Failed to load general settings";

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

export async function PUT(request: Request) {
    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const body = await request.json();

        const name = String(body?.name || "").trim();
        const timezone = String(body?.timezone || "").trim();
        const currency = String(body?.currency || "").trim().toUpperCase();
        const distanceUnit = String(body?.distanceUnit || "").trim().toLowerCase();
        const mapProvider = String(body?.mapProvider || "yandex").trim().toLowerCase();

        if (!name || !timezone || !currency || !distanceUnit) {
            return NextResponse.json(
                {
                    success: false,
                    message: "name, timezone, currency and distanceUnit are required",
                },
                { status: 400 }
            );
        }

        if (!["km", "mi"].includes(distanceUnit)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "distanceUnit must be either km or mi",
                },
                { status: 400 }
            );
        }

        if (!ALLOWED_MAP_PROVIDERS.includes(mapProvider as (typeof ALLOWED_MAP_PROVIDERS)[number])) {
            return NextResponse.json(
                {
                    success: false,
                    message: "mapProvider must be one of: yandex, 2gis, google",
                },
                { status: 400 }
            );
        }

        const updatedSettings = await updateGeneralSettingsByCompanyId({
            companyId: session.companyId,
            name,
            timezone,
            currency,
            distanceUnit,
            mapProvider,
        });

        return NextResponse.json({
            success: true,
            message: "General settings updated successfully",
            data: updatedSettings,
        });
    } catch (error) {
        console.error("Update general settings error:", error);

        const message =
            error instanceof Error
                ? error.message
                : "Failed to update general settings";

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