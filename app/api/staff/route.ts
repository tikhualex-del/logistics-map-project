import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/require-session";
import { requireMinRole } from "@/server/auth/require-role";
import bcrypt from "bcrypt";
import { writeAuditLog } from "@/server/audit/audit-log.service";

export async function GET() {
    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const memberships = await prisma.membership.findMany({
            where: {
                companyId: session.companyId,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                user: true,
            },
        });

        const result = memberships.map((membership) => ({
            id: membership.id,
            userId: membership.user.id,
            fullName: membership.user.fullName,
            email: membership.user.email,
            role: membership.role,
            isActive: membership.isActive,
            createdAt: membership.createdAt,
        }));

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to load staff";

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

export async function POST(request: Request) {
    try {
        const session = await requireSession();
        requireMinRole(session, "admin");

        const body = await request.json();

        const fullName = String(body.fullName || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "").trim();
        const role = String(body.role || "").trim().toLowerCase();

        if (!fullName || !email || !password || !role) {
            return NextResponse.json(
                {
                    success: false,
                    message: "fullName, email, password and role are required",
                },
                { status: 400 }
            );
        }

        const allowedRoles = ["viewer", "dispatcher", "admin"];

        if (!allowedRoles.includes(role)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid role",
                },
                { status: 400 }
            );
        }

        if (session.role === "admin" && role === "admin") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Admin cannot create another admin",
                },
                { status: 403 }
            );
        }

        if (role === "owner") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Owner role cannot be assigned here",
                },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User with this email already exists",
                },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    fullName,
                    passwordHash,
                },
            });

            const membership = await tx.membership.create({
                data: {
                    userId: user.id,
                    companyId: session.companyId,
                    role,
                },
            });

            await tx.auditLog.create({
                data: {
                    companyId: session.companyId,
                    actorUserId: session.userId,
                    targetUserId: user.id,
                    targetMembershipId: membership.id,
                    action: "staff_created",
                    metaJson: JSON.stringify({
                        fullName: user.fullName,
                        email: user.email,
                        role: membership.role,
                        actorRole: session.role,
                    }),
                },
            });

            return {
                id: membership.id,
                userId: user.id,
                fullName: user.fullName,
                email: user.email,
                role: membership.role,
                isActive: membership.isActive,
                createdAt: membership.createdAt,
            };
        });

        return NextResponse.json({
            success: true,
            message: "Employee created successfully",
            data: result,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to create employee";

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