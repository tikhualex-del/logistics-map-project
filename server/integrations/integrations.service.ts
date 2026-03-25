import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/server/lib/crypto";
import { IntegrationError } from "@/server/integrations/integrations.errors";

type CreateIntegrationInput = {
  companyId: string;
  name: string;
  provider: string;
  baseUrl?: string | null;
  credentialsJson: string;
};

const safeIntegrationSelect = {
  id: true,
  companyId: true,
  name: true,
  provider: true,
  baseUrl: true,
  isActive: true,
  isDefault: true,
  createdAt: true,
} as const;

function normalizeIntegrationName(name: string) {
  return name.trim();
}

function normalizeIntegrationProvider(provider: string) {
  return provider.trim().toLowerCase();
}

function isPrismaTransactionConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

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
  const companyId = input.companyId;
  const name = normalizeIntegrationName(input.name);
  const provider = normalizeIntegrationProvider(input.provider);
  const baseUrl = input.baseUrl?.trim() || null;
  const credentialsJson = input.credentialsJson;
  const encryptedCredentials = encrypt(credentialsJson);

  try {
    return await prisma.$transaction(
      async (tx) => {
        const existingIntegration = await tx.integration.findFirst({
          where: {
            companyId,
            provider,
            name,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        if (existingIntegration) {
          throw new IntegrationError(
            "INTEGRATION_ALREADY_EXISTS",
            "Integration with this name already exists for this provider"
          );
        }

        const existingDefaultIntegration = await tx.integration.findFirst({
          where: {
            companyId,
            provider,
            isActive: true,
            isDefault: true,
          },
          select: {
            id: true,
          },
        });

        return tx.integration.create({
          data: {
            companyId,
            name,
            provider,
            baseUrl,
            isDefault: !existingDefaultIntegration,
            credentialsEncryptedJson: encryptedCredentials,
          },
          select: safeIntegrationSelect,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (error instanceof IntegrationError) {
      throw error;
    }

    if (isPrismaTransactionConflict(error)) {
      throw new IntegrationError(
        "INTEGRATION_ALREADY_EXISTS",
        "Integration with this name already exists for this provider"
      );
    }

    throw error;
  }
}

export async function getDefaultIntegrationByProvider(
  companyId: string,
  provider: string
) {
  return prisma.integration.findFirst({
    where: {
      companyId,
      provider: normalizeIntegrationProvider(provider),
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

export async function setDefaultIntegration(params: {
  companyId: string;
  integrationId: string;
}) {
  const { companyId, integrationId } = params;

  const integration = await prisma.integration.findFirst({
    where: {
      id: integrationId,
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      companyId: true,
      provider: true,
    },
  });

  if (!integration) {
    throw new IntegrationError(
      "INTEGRATION_NOT_FOUND",
      "Integration not found"
    );
  }

  await prisma.$transaction([
    prisma.integration.updateMany({
      where: {
        companyId,
        provider: integration.provider,
      },
      data: {
        isDefault: false,
      },
    }),
    prisma.integration.update({
      where: {
        id: integration.id,
      },
      data: {
        isDefault: true,
      },
    }),
  ]);

  return { success: true };
}