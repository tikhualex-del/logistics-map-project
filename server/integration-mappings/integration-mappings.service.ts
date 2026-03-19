import { prisma } from "@/lib/prisma";

type CreateIntegrationMappingInput = {
  companyId: string;
  integrationId: string;
  orderStatusMapJson: string;
  deliveryTypeMapJson: string;
  warehouseMapJson?: string | null;
  courierMapJson?: string | null;
};

export async function getIntegrationMappingsByCompanyId(companyId: string) {
  return prisma.integrationMapping.findMany({
    where: {
      companyId,
    },
    include: {
      integration: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createIntegrationMapping(
  input: CreateIntegrationMappingInput
) {
  const {
    companyId,
    integrationId,
    orderStatusMapJson,
    deliveryTypeMapJson,
    warehouseMapJson,
    courierMapJson,
  } = input;

  const integration = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      companyId,
      isActive: true,
    },
  });

  if (!integration) {
    throw new Error("Integration not found in current company");
  }

  return prisma.integrationMapping.create({
    data: {
      companyId,
      integrationId,
      orderStatusMapJson,
      deliveryTypeMapJson,
      warehouseMapJson: warehouseMapJson ?? null,
      courierMapJson: courierMapJson ?? null,
    },
    include: {
      integration: true,
    },
  });
}