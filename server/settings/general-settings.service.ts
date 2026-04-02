import { prisma } from "@/lib/prisma";

type UpdateGeneralSettingsInput = {
  companyId: string;
  name: string;
  timezone: string;
  currency: string;
  distanceUnit: string;
  mapProvider: string;
};

export async function getGeneralSettingsByCompanyId(companyId: string) {
  return prisma.company.findUnique({
    where: {
      id: companyId,
    },
    select: {
      id: true,
      name: true,
      timezone: true,
      currency: true,
      distanceUnit: true,
      mapProvider: true,
    },
  });
}

export async function updateGeneralSettingsByCompanyId(
  input: UpdateGeneralSettingsInput
) {
  const { companyId, name, timezone, currency, distanceUnit, mapProvider } = input;

  return prisma.company.update({
    where: {
      id: companyId,
    },
    data: {
      name,
      timezone,
      currency,
      distanceUnit,
      mapProvider,
    },
    select: {
      id: true,
      name: true,
      timezone: true,
      currency: true,
      distanceUnit: true,
      mapProvider: true,
    },
  });
}