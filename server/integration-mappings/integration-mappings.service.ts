import { prisma } from "@/lib/prisma";

type CreateIntegrationMappingInput = {
  companyId: string;
  integrationId: string;
  orderStatusMapJson: string;
  deliveryTypeMapJson: string;
  warehouseMapJson?: string | null;
  courierMapJson?: string | null;
  mapStatusConfigJson?: string;
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
    mapStatusConfigJson,
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

  return prisma.integrationMapping.upsert({
    where: {
      companyId_integrationId: {
        companyId,
        integrationId,
      },
    },
    update: {
      orderStatusMapJson,
      deliveryTypeMapJson,
      warehouseMapJson: warehouseMapJson ?? null,
      courierMapJson: courierMapJson ?? null,
      mapStatusConfigJson: mapStatusConfigJson ?? null,
    },
    create: {
      companyId,
      integrationId,
      orderStatusMapJson,
      deliveryTypeMapJson,
      warehouseMapJson: warehouseMapJson ?? null,
      courierMapJson: courierMapJson ?? null,
      mapStatusConfigJson: mapStatusConfigJson ?? null,
    },
    include: {
      integration: true,
    },
  });
}