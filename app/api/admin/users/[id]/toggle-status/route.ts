import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive: !user.isActive,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: updatedUser.isActive
        ? "User activated"
        : "User deactivated",
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("Admin user toggle status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to toggle user status",
      },
      { status: 500 }
    );
  }
}