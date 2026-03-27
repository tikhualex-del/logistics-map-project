import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    const result = companies.map((company) => {
      const owner = company.memberships.find(
        (m) => m.role === "owner"
      );

      return {
        id: company.id,
        name: company.name,
        createdAt: company.createdAt,
        ownerEmail: owner?.user?.email || "—",
        isActive: company.isActive,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Admin companies error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load companies",
      },
      { status: 500 }
    );
  }
}