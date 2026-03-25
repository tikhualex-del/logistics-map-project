import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    requireMinRole(session, "admin");

    const params = await context.params;
    const integrationId = params.id;

    if (!integrationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Integration id is required",
        },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.findFirst({
      where: {
        id: integrationId,
        companyId: session.companyId,
      },
      select: {
        id: true,
        name: true,
        isDefault: true,
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          message: "Integration not found",
        },
        { status: 404 }
      );
    }

    if (!integration.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Интеграция уже деактивирована",
        },
        { status: 400 }
      );
    }

    if (integration.isDefault) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя деактивировать default integration",
        },
        { status: 400 }
      );
    }

    await prisma.integration.update({
      where: {
        id: integration.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Интеграция успешно деактивирована",
    });
  } catch (error) {
    console.error("Deactivate integration error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to deactivate integration";

    const status =
      message === "Not authenticated"
        ? 401
        : message === "Forbidden"
          ? 403
          : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}