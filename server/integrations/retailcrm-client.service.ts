import { getRetailCrmIntegrationCredentials } from "@/server/integrations/integration-credentials.service";

type RetailCrmRequestParams = {
  companyId: string;
  integrationId: string;
  path: string;
  searchParams?: Record<string, string | number | boolean | null | undefined>;
};

export async function retailCrmGet(params: RetailCrmRequestParams) {
  const { companyId, integrationId, path, searchParams = {} } = params;

  const integration = await getRetailCrmIntegrationCredentials({
    companyId,
    integrationId,
  });

  const url = new URL(path, integration.baseUrl);

  url.searchParams.set("apiKey", integration.apiKey);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("RetailCRM request timeout");
    }

    throw new Error(
      error instanceof Error
        ? `RetailCRM request failed: ${error.message}`
        : "RetailCRM request failed"
    );
  } finally {
    clearTimeout(timeout);
  }

  const rawText = await response.text();

  let data: any;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("RetailCRM returned non-JSON response");
  }

  return {
    integration: {
      id: integration.integrationId,
      name: integration.name,
      provider: integration.provider,
      baseUrl: integration.baseUrl,
    },
    status: response.status,
    ok: response.ok,
    data,
  };
}