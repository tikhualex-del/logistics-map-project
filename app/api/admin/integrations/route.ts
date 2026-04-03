import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUserBySessionToken } from "@/server/auth/auth.service";
import { isAdminEmail } from "@/server/admin/admin-access";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token")?.value;

        if (!sessionToken) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const current = await getCurrentUserBySessionToken(sessionToken);

        if (!isAdminEmail(current.user.email)) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const integrations = await prisma.integration.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                company: true,
            },
        });

        const result = integrations.map((integration) => ({
            id: integration.id,
            companyName: integration.company?.name || "—",
            provider: integration.provider,
            name: integration.name,

            // используем то, что реально есть
            isEnabled: integration.isActive ?? integration.isDefault ?? true,

            createdAt: integration.createdAt,
        }));

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Admin integrations error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to load integrations",
            },
            { status: 500 }
        );
    }
}