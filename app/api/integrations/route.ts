import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import {
  createIntegration,
  getIntegrationsByCompanyId,
} from "@/server/integrations/integrations.service";
import { requireMinRole } from "@/server/auth/require-role";

export async function GET() {
  try {
    const session = await requireSession();
    const integrations = await getIntegrationsByCompanyId(session.companyId);

    return NextResponse.json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    console.error("Get integrations error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to load integrations";

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

    const name = String(body.name || "").trim();
    const provider = String(body.provider || "").trim();
    const baseUrlRaw = String(body.baseUrl || "").trim();
    const credentialsEncryptedJson = String(
      body.credentialsEncryptedJson || ""
    ).trim();

    if (!name || !provider || !credentialsEncryptedJson) {
      return NextResponse.json(
        {
          success: false,
          message: "name, provider and credentialsEncryptedJson are required",
        },
        { status: 400 }
      );
    }

    const integration = await createIntegration({
      companyId: session.companyId,
      name,
      provider,
      baseUrl: baseUrlRaw || null,
      credentialsEncryptedJson,
    });

    return NextResponse.json({
      success: true,
      message: "Integration created successfully",
      data: integration,
    });
  } catch (error) {
    console.error("Create integration error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create integration";

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