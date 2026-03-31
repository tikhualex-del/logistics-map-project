import { prisma } from "@/lib/prisma";

type CreateItemLoadMappingInput = {
    companyId: string;
    integrationId: string;
    externalFieldType: string;
    matchType: string;
    externalValue: string;
    loadUnitId: string;
    multiplier: number;
    priority: number;
};

export async function getItemLoadMappingsByCompanyId(companyId: string) {
    return prisma.integrationItemLoadMapping.findMany({
        where: {
            companyId,
            isActive: true,
        },
        include: {
            integration: {
                select: {
                    id: true,
                    name: true,
                    provider: true,
                },
            },
            loadUnit: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    capacityPoints: true,
                },
            },
        },
        orderBy: [
            {
                priority: "asc",
            },
            {
                createdAt: "desc",
            },
        ],
    });
}

export async function createItemLoadMapping(
    input: CreateItemLoadMappingInput
) {
    const {
        companyId,
        integrationId,
        externalFieldType,
        matchType,
        externalValue,
        loadUnitId,
        multiplier,
        priority,
    } = input;

    return prisma.integrationItemLoadMapping.create({
        data: {
            companyId,
            integrationId,
            externalFieldType,
            matchType,
            externalValue,
            loadUnitId,
            multiplier,
            priority,
        },
        include: {
            integration: {
                select: {
                    id: true,
                    name: true,
                    provider: true,
                },
            },
            loadUnit: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    capacityPoints: true,
                },
            },
        },
    });
}