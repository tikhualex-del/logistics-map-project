import { prisma } from "@/lib/prisma";
import { encrypt } from "@/server/lib/crypto";

type CreateIntegrationInput = {
  companyId: string;
  name: string;
  provider: string;
  baseUrl?: string | null;
  credentialsEncryptedJson: string;
};

const safeIntegrationSelect = {
  id: true,
  companyId: true,
  name: true,
  provider: true,
  baseUrl: true,
  isActive: true,
  createdAt: true,
} as const;

export async function getIntegrationsByCompanyId(companyId: string) {
  return prisma.integration.findMany({
    where: {
      companyId,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: safeIntegrationSelect,
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
      credentialsEncryptedJson: encrypt(credentialsEncryptedJson),
    },
    select: safeIntegrationSelect,
  });
}

export async function getDefaultIntegrationByProvider(
  companyId: string,
  provider: string
) {
  return prisma.integration.findFirst({
    where: {
      companyId,
      provider,
      isActive: true,
      isDefault: true,
    },
    select: {
      id: true,
      companyId: true,
      name: true,
      provider: true,
      baseUrl: true,
      isActive: true,
      isDefault: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}