import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUserBySessionToken } from "@/server/auth/auth.service";
import { isAdminEmail } from "@/server/admin/admin-access";

export async function POST(
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