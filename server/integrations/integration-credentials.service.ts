import { prisma } from "@/lib/prisma";
import { decrypt } from "@/server/lib/crypto";

type RetailCrmCredentials = {
    apiKey: string;
};

export async function getRetailCrmIntegrationCredentials(params: {
    companyId: string;
    integrationId: string;
}) {
    const { companyId, integrationId } = params;

    const integration = await prisma.integration.findFirst({
        where: {
            id: integrationId,
            companyId,
            isActive: true,
            provider: "retailcrm",
        },
        select: {
            id: true,
            name: true,
            provider: true,
            baseUrl: true,
            credentialsEncryptedJson: true,
        },
    });

    if (!integration) {
        throw new Error("RetailCRM integration not found in current company");
    }

    if (!integration.baseUrl) {
        throw new Error("RetailCRM integration baseUrl is not set");
    }

    let decryptedJson: string;

    try {
        decryptedJson = decrypt(integration.credentialsEncryptedJson);
    } catch {
        throw new Error("Failed to decrypt integration credentials");
    }

    let credentials: RetailCrmCredentials;

    try {
        credentials = JSON.parse(decryptedJson);
    } catch {
        throw new Error("Integration credentials are not valid JSON");
    }

    console.log("DECRYPTED_CREDENTIALS_OK", {
        integrationId: integration.id,
        hasApiKey: Boolean(credentials.apiKey),
    });

    const apiKey = String(credentials.apiKey || "").trim();

    if (!apiKey) {
        throw new Error("RetailCRM apiKey is missing in integration credentials");
    }

    return {
        integrationId: integration.id,
        name: integration.name,
        provider: integration.provider,
        baseUrl: integration.baseUrl,
        apiKey,
    };
}