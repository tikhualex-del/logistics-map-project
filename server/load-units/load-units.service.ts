import { prisma } from "@/lib/prisma";

type CreateLoadUnitInput = {
    companyId: string;
    name: string;
    code: string;
    description?: string | null;
    capacityPoints: number;
    allowedCourierTypes?: string | null;
};

export async function getLoadUnitsByCompanyId(companyId: string) {
    return prisma.companyLoadUnit.findMany({
        where: {
            companyId,
            isActive: true,
        },
        orderBy: [
            {
                createdAt: "desc",
            },
        ],
    });
}

export async function createLoadUnit(input: CreateLoadUnitInput) {
    const {
        companyId,
        name,
        code,
        description,
        capacityPoints,
        allowedCourierTypes,
    } = input;

    return prisma.companyLoadUnit.create({
        data: {
            companyId,
            name,
            code,
            description: description ?? null,
            capacityPoints,
            allowedCourierTypes: allowedCourierTypes ?? null,
        },
    });
}