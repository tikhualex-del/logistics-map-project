import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { AuthError } from "@/server/auth/auth.errors";

type CreateOwnerBundleInput = {
    companyName: string;
    fullName: string;
    email: string;
    password: string;
};

export async function loginUser(email: string, password: string) {

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
        where: {
            email: normalizedEmail,
        },
        include: {
            memberships: {
                include: {
                    company: true,
                },
            },
        },
    });

    if (!user) {
        throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
    }

    if (!user.isActive) {
        throw new AuthError("USER_DISABLED", "User account is disabled");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
    }

    const activeMembership = user.memberships.find(
        (membership) => membership.isActive && membership.company.isActive
    );

    if (!activeMembership) {
        throw new AuthError(
            "NO_ACTIVE_COMPANY_ACCESS",
            "User has no active company access"
        );
    }

    const sessionToken = randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

    await prisma.session.create({
        data: {
            token: sessionToken,
            userId: user.id,
            companyId: activeMembership.company.id,
            expiresAt,
        },
    });

    return {
        sessionToken,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
        },
        company: {
            id: activeMembership.company.id,
            name: activeMembership.company.name,
        },
    };
}

export async function createOwnerBundle(input: CreateOwnerBundleInput) {
    const { companyName, fullName, email, password } = input;

    return prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        const company = await tx.company.create({
            data: {
                name: companyName,
                timezone: "Europe/Moscow",
                currency: "RUB",
            },
        });

        const passwordHash = await bcrypt.hash(password, 10);

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
                companyId: company.id,
                role: "owner",
            },
        });

        return {
            company: {
                id: company.id,
                name: company.name,
                timezone: company.timezone,
                currency: company.currency,
                isActive: company.isActive,
                createdAt: company.createdAt,
            },
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                isActive: user.isActive,
                createdAt: user.createdAt,
            },
            membership: {
                id: membership.id,
                userId: membership.userId,
                companyId: membership.companyId,
                role: membership.role,
                isActive: membership.isActive,
                createdAt: membership.createdAt,
            },
        };
    });
}

export async function getCurrentUserBySessionToken(sessionToken: string) {
    const session = await prisma.session.findUnique({
        where: {
            token: sessionToken,
        },
        include: {
            user: true,
            company: true,
        },
    });

    if (!session) {
        throw new Error("Session not found");
    }

    const now = new Date();

    if (session.expiresAt < now) {
        await prisma.session.delete({
            where: {
                token: sessionToken,
            },
        });

        throw new Error("Session expired");
    }

    return {
        user: {
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.fullName,
        },
        company: {
            id: session.company.id,
            name: session.company.name,
            timezone: session.company.timezone,
        },
        session: {
            id: session.id,
            expiresAt: session.expiresAt,
        },
    };
}

export async function getCurrentSessionWithCompany(sessionToken: string) {
    const session = await prisma.session.findUnique({
        where: {
            token: sessionToken,
        },
        include: {
            company: true,
            user: true,
        },
    });

    if (!session) {
        throw new Error("Session not found");
    }

    const now = new Date();

    if (session.expiresAt < now) {
        await prisma.session.delete({
            where: {
                token: sessionToken,
            },
        });

        throw new Error("Session expired");
    }

    return session;
}

export async function logoutUserBySessionToken(sessionToken: string) {
    const session = await prisma.session.findUnique({
        where: {
            token: sessionToken,
        },
    });

    if (!session) {
        return;
    }

    await prisma.session.delete({
        where: {
            token: sessionToken,
        },
    });
}