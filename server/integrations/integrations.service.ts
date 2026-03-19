import { prisma } from "@/lib/prisma";

type CreateIntegrationInput = {
  companyId: string;
  name: string;
  provider: string;
  baseUrl?: string | null;
  credentialsEncryptedJson: string;
};

export async function getIntegrationsByCompanyId(companyId: string) {
  return prisma.integration.findMany({
    where: {
      companyId,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createIntegration(input: CreateIntegrationInput) {
  const { companyId, name, provider, baseUrl, credentialsEncryptedJson } = input;

  return prisma.integration.create({
    data: {
      companyId,
      name,
      provider,
      baseUrl: baseUrl ?? null,
      credentialsEncryptedJson,
    },
  });
}