import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        memberships: {
          include: {
            company: true,
          },
        },
      },
    });

    const result = users.map((user) => {
      const activeMembership = user.memberships.find((m) => m.isActive);

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        companyName: activeMembership?.company?.name || "—",
        role: activeMembership?.role || "—",
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load users",
      },
      { status: 500 }
    );
  }
}