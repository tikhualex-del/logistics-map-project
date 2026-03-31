import { prisma } from "@/lib/prisma";

type CreateCourierCapacityRuleInput = {
  companyId: string;
  courierType: string;
  maxOrders: number;
  maxCapacityPoints: number;
};

export async function getCourierCapacityRulesByCompanyId(companyId: string) {
  return prisma.companyCourierCapacityRule.findMany({
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

export async function createCourierCapacityRule(
  input: CreateCourierCapacityRuleInput
) {
  const { companyId, courierType, maxOrders, maxCapacityPoints } = input;

  return prisma.companyCourierCapacityRule.create({
    data: {
      companyId,
      courierType,
      maxOrders,
      maxCapacityPoints,
    },
  });
}