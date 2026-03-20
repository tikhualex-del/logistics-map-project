import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";
import { setDefaultIntegration } from "@/server/integrations/integrations.service";

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

    await setDefaultIntegration({
      companyId: session.companyId,
      integrationId,
    });

    return NextResponse.json({
      success: true,
      message: "Default integration updated successfully",
    });
  } catch (error) {
    console.error("Set default integration error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to set default integration";

    const status =
      message === "Not authenticated"
        ? 401
        : message === "Forbidden"
          ? 403
          : message === "Integration not found"
            ? 404
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