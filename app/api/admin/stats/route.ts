import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
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

    const [
      companiesCount,
      activeCompaniesCount,
      usersCount,
      activeUsersCount,
      integrationsCount,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({
        where: {
          isActive: true,
        },
      }),
      prisma.user.count(),
      prisma.user.count({
        where: {
          isActive: true,
        },
      }),
      prisma.integration.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        companiesCount,
        activeCompaniesCount,
        disabledCompaniesCount: companiesCount - activeCompaniesCount,

        usersCount,
        activeUsersCount,
        disabledUsersCount: usersCount - activeUsersCount,

        integrationsCount,
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load admin stats",
      },
      { status: 500 }
    );
  }
}