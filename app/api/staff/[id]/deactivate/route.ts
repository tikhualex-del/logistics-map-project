import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    requireMinRole(session, "admin");

    const { id } = await context.params;

    const membership = await prisma.membership.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: "Сотрудник не найден",
        },
        { status: 404 }
      );
    }

    if (membership.companyId !== session.companyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
        },
        { status: 403 }
      );
    }

    if (!membership.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Сотрудник уже отключен",
        },
        { status: 400 }
      );
    }

    if (session.role === "admin") {
      if (membership.role === "admin" || membership.role === "owner") {
        return NextResponse.json(
          {
            success: false,
            message: "Администратор не может отключить администратора или владельца",
          },
          { status: 403 }
        );
      }
    }

    if (session.role === "owner" && membership.userId === session.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Владелец не может отключить сам себя",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedMembership = await tx.membership.update({
        where: {
          id: membership.id,
        },
        data: {
          isActive: false,
        },
        include: {
          user: true,
        },
      });

      await tx.auditLog.create({
        data: {
          companyId: session.companyId,
          actorUserId: session.userId,
          targetUserId: updatedMembership.user.id,
          targetMembershipId: updatedMembership.id,
          action: "staff_deactivated",
          metaJson: JSON.stringify({
            fullName: updatedMembership.user.fullName,
            email: updatedMembership.user.email,
            role: updatedMembership.role,
            actorRole: session.role,
          }),
        },
      });

      return updatedMembership;
    });

    return NextResponse.json({
      success: true,
      message: "Сотрудник отключен",
      data: {
        id: result.id,
        userId: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.role,
        isActive: result.isActive,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to deactivate employee";

    const status =
      message === "Not authenticated"
        ? 401
        : message === "Forbidden"
          ? 403
          : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}