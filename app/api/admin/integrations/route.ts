import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
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