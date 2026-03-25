import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
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

    if (integration.isDefault) {
      return NextResponse.json(
        {
          success: false,
          message: "Нельзя удалить default integration",
        },
        { status: 400 }
      );
    }

    const [ordersCount, mappingsCount] = await Promise.all([
      prisma.order.count({
        where: {
          integrationId: integration.id,
        },
      }),
      prisma.integrationMapping.count({
        where: {
          integrationId: integration.id,
        },
      }),
    ]);

    if (ordersCount > 0 || mappingsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Нельзя удалить интеграцию, потому что к ней уже привязаны orders или mappings",
        },
        { status: 400 }
      );
    }

    await prisma.integration.delete({
      where: {
        id: integration.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Интеграция успешно удалена",
    });
  } catch (error) {
    console.error("Delete integration error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete integration";

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