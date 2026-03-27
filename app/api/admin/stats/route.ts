import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
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