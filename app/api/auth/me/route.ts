import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    const company = await prisma.company.findUnique({
      where: {
        id: session.companyId,
      },
      select: {
        id: true,
        name: true,
        timezone: true,
      },
    });

    if (!user || !company) {
      return NextResponse.json(
        {
          success: false,
          message: "Session data not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        company,
        session: {
          id: session.sessionId,
          expiresAt: session.expiresAt,
        },
        role: session.role,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get current user";

    const status = message === "Not authenticated" ? 401 : 401;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}