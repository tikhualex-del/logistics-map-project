import { prisma } from "@/lib/prisma";

type CreateWarehouseInput = {
  companyId: string;
  name: string;
  city: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
};

export async function getWarehousesByCompanyId(companyId: string) {
  return prisma.warehouse.findMany({
    where: {
      companyId,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createWarehouse(input: CreateWarehouseInput) {
  const { companyId, name, city, address, latitude, longitude } = input;

  return prisma.warehouse.create({
    data: {
      companyId,
      name,
      city,
      address,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    },
  });
}