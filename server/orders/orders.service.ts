import { prisma } from "@/lib/prisma";

type CreateOrderInput = {
  companyId: string;
  integrationId?: string | null;
  warehouseId?: string | null;
  externalId: string;
  title: string;
  status: string;
  deliveryType: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  deliveryWindowFrom?: string | null;
  deliveryWindowTo?: string | null;
  courierExternalId?: string | null;
  courierName?: string | null;
  rawPayloadJson?: string | null;
};

export async function getOrdersByCompanyId(companyId: string) {
  return prisma.order.findMany({
    where: {
      companyId,
    },
    include: {
      integration: true,
      warehouse: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createOrder(input: CreateOrderInput) {
  const {
    companyId,
    integrationId,
    warehouseId,
    externalId,
    title,
    status,
    deliveryType,
    address,
    latitude,
    longitude,
    deliveryWindowFrom,
    deliveryWindowTo,
    courierExternalId,
    courierName,
    rawPayloadJson,
  } = input;

  if (integrationId) {
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
  }

  if (warehouseId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        companyId,
        isActive: true,
      },
    });

    if (!warehouse) {
      throw new Error("Warehouse not found in current company");
    }
  }

  return prisma.order.create({
    data: {
      companyId,
      integrationId: integrationId ?? null,
      warehouseId: warehouseId ?? null,
      externalId,
      title,
      status,
      deliveryType,
      address,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      deliveryWindowFrom: deliveryWindowFrom ?? null,
      deliveryWindowTo: deliveryWindowTo ?? null,
      courierExternalId: courierExternalId ?? null,
      courierName: courierName ?? null,
      rawPayloadJson: rawPayloadJson ?? null,
    },
    include: {
      integration: true,
      warehouse: true,
    },
  });
}