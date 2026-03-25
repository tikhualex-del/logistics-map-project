import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/server/lib/crypto";
import { fetchRetailCrmOrders } from "@/server/integrations/providers/retailcrm.client";

export async function POST() {
  try {
    const session = await requireSession();

    const integration = await prisma.integration.findFirst({
      where: {
        companyId: session.companyId,
        isDefault: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        baseUrl: true,
        credentialsEncryptedJson: true,
        isDefault: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          message: "Default integration not found",
        },
        { status: 400 }
      );
    }

    if (integration.provider !== "retailcrm") {
      return NextResponse.json(
        {
          success: false,
          message: `Unsupported provider: ${integration.provider}`,
        },
        { status: 400 }
      );
    }

    if (!integration.baseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Integration baseUrl is empty",
        },
        { status: 400 }
      );
    }

    const credentialsRaw = decrypt(integration.credentialsEncryptedJson);
    const credentials = JSON.parse(credentialsRaw) as {
      apiKey?: string;
      site?: string;
    };

    const result = await fetchRetailCrmOrders({
      baseUrl: integration.baseUrl,
      credentials: {
        apiKey: credentials.apiKey || "",
        site: credentials.site,
      },
      page: 1,
      limit: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        integration: {
          id: integration.id,
          name: integration.name,
          provider: integration.provider,
          baseUrl: integration.baseUrl,
          isDefault: integration.isDefault,
        },
        ordersCount: result.orders.length,
        sampleOrders: result.orders.slice(0, 2),
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error("Test connection error:", error);

    const message =
      error instanceof Error ? error.message : "Connection test failed";

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