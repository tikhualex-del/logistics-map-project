import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const company = await prisma.company.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        isActive: true,
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

    const updatedCompany = await prisma.company.update({
      where: {
        id,
      },
      data: {
        isActive: !company.isActive,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: updatedCompany.isActive
        ? "Company activated"
        : "Company deactivated",
      data: updatedCompany,
    });
  } catch (error: any) {
    console.error("Admin company toggle status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to toggle company status",
      },
      { status: 500 }
    );
  }
}