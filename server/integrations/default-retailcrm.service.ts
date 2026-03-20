import { getDefaultIntegrationByProvider } from "@/server/integrations/integrations.service";

export async function getDefaultRetailCrmIntegration(companyId: string) {
  const integration = await getDefaultIntegrationByProvider(companyId, "retailcrm");

  if (!integration) {
    throw new Error("Default RetailCRM integration not found for current company");
  }

  return integration;
}