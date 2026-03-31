import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";
import {
    createLoadUnit,
    getLoadUnitsByCompanyId,
} from "@/server/load-units/load-units.service";

export async function GET() {
    try {
        const session = await requireSession();

        const loadUnits = await getLoadUnitsByCompanyId(session.companyId);

        return NextResponse.json({
            success: true,
            data: loadUnits,
        });
    } catch (error) {
        console.error("Get load units error:", error);

        const message =
            error instanceof Error ? error.message : "Failed to load load units";

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
        const code = String(body?.code || "").trim();
        const description = String(body?.description || "").trim() || null;
        const allowedCourierTypes =
            String(body?.allowedCourierTypes || "").trim() || null;

        const capacityPoints = Number(body?.capacityPoints);

        if (!name || !code || !Number.isFinite(capacityPoints) || capacityPoints <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "name, code and valid capacityPoints are required",
                },
                { status: 400 }
            );
        }

        const loadUnit = await createLoadUnit({
            companyId: session.companyId,
            name,
            code,
            description,
            capacityPoints,
            allowedCourierTypes,
        });

        return NextResponse.json({
            success: true,
            message: "Load unit created successfully",
            data: loadUnit,
        });
    } catch (error) {
        console.error("Create load unit error:", error);

        const message =
            error instanceof Error ? error.message : "Failed to create load unit";

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