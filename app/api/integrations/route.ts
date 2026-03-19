import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSessionWithCompany } from "@/server/auth/auth.service";
import {
  createIntegration,
  getIntegrationsByCompanyId,
} from "@/server/integrations/integrations.service";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const session = await getCurrentSessionWithCompany(sessionToken);
    const integrations = await getIntegrationsByCompanyId(session.companyId);

    return NextResponse.json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    console.error("Get integrations error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to load integrations";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 }
      );
    }

    const session = await getCurrentSessionWithCompany(sessionToken);
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

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    );
  }
}