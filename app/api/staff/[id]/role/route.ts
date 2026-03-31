import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";

const allowedRoles = ["viewer", "dispatcher", "admin"];

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const { id } = await context.params;
        const body = await request.json();

        const newRole = String(body.role || "").trim().toLowerCase();

        if (!allowedRoles.includes(newRole)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Некорректная роль",
                },
                { status: 400 }
            );
        }

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

        if (membership.role === "owner") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Роль владельца менять нельзя",
                },
                { status: 403 }
            );
        }

        if (session.role === "owner" && membership.userId === session.userId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Владелец не может менять свою роль",
                },
                { status: 400 }
            );
        }

        if (session.role === "admin") {
            const targetRole = membership.role;

            if (targetRole === "admin" || targetRole === "owner") {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Администратор не может менять роль администратора или владельца",
                    },
                    { status: 403 }
                );
            }

            if (newRole === "admin") {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Администратор не может назначать роль администратора",
                    },
                    { status: 403 }
                );
            }
        }

        if (membership.role === newRole) {
            return NextResponse.json(
                {
                    success: false,
                    message: "У сотрудника уже установлена эта роль",
                },
                { status: 400 }
            );
        }

        const oldRole = membership.role;

        const result = await prisma.$transaction(async (tx) => {
            const updatedMembership = await tx.membership.update({
                where: {
                    id: membership.id,
                },
                data: {
                    role: newRole,
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
                    action: "staff_role_changed",
                    metaJson: JSON.stringify({
                        fullName: updatedMembership.user.fullName,
                        email: updatedMembership.user.email,
                        oldRole,
                        newRole: updatedMembership.role,
                        actorRole: session.role,
                    }),
                },
            });

            return updatedMembership;
        });

        return NextResponse.json({
            success: true,
            message: "Роль сотрудника обновлена",
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
            error instanceof Error ? error.message : "Failed to update employee role";

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