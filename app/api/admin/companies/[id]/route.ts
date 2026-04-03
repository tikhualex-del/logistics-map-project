import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUserBySessionToken } from "@/server/auth/auth.service";
import { isAdminEmail } from "@/server/admin/admin-access";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    const company = await prisma.company.findUnique({
      where: {
        id,
      },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          message: "Company not found",
        },
        { status: 404 }
      );
    }

    const owner = company.memberships.find((m) => m.role === "owner");

    const users = company.memberships.map((m) => ({
      id: m.user.id,
      fullName: m.user.fullName,
      email: m.user.email,
      role: m.role,
      isActive: m.isActive,
    }));

    const companyIntegrations = await prisma.integration.findMany({
      where: {
        companyId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const integrations = companyIntegrations.map((integration) => ({
      id: integration.id,
      name: integration.name,
      provider: integration.provider,
      isActive: integration.isActive ?? integration.isDefault ?? true,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        createdAt: company.createdAt,
        isActive: company.isActive,
        owner: owner
          ? {
            email: owner.user.email,
            fullName: owner.user.fullName,
          }
          : null,
        users,
        integrations,
      },
    });
  } catch (error: any) {
    console.error("Admin company detail error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load company",
        error: String(error),
      },
      { status: 500 }
    );
  }
}