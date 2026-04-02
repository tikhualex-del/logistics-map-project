import { getRetailCrmIntegrationCredentials } from "@/server/integrations/integration-credentials.service";
import {
  HttpClientError,
  requestJson,
} from "@/lib/http/http-client";

type RetailCrmRequestParams = {
  companyId: string;
  integrationId: string;
  path: string;
  searchParams?: Record<string, string | number | boolean | null | undefined>;
};

function buildRetailCrmErrorMessage(error: unknown) {
  if (error instanceof HttpClientError) {
    try {
      const parsed = JSON.parse(error.responseBody) as {
        errorMsg?: string;
        message?: string;
      };

      return (
        parsed?.errorMsg ||
        parsed?.message ||
        `RetailCRM request failed with status ${error.status}`
      );
    } catch {
      return `RetailCRM request failed with status ${error.status}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "RetailCRM request failed";
}

export async function retailCrmGet<TResponse = unknown>(
  params: RetailCrmRequestParams
) {
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

  let data: TResponse;

  try {
    data = await requestJson<TResponse>({
      url: url.toString(),
      method: "GET",
      timeoutMs: 10000,
      retryCount: 2,
      retryDelayMs: 500,
    });
  } catch (error) {
    throw new Error(buildRetailCrmErrorMessage(error));
  }

  return {
    integration: {
      id: integration.integrationId,
      name: integration.name,
      provider: integration.provider,
      baseUrl: integration.baseUrl,
    },
    status: 200,
    ok: true,
    data,
  };
}