import {
  HttpCircuitOpenError,
  HttpClientError,
  HttpClientTimeoutError,
  requestJson,
} from "@/lib/http/http-client";

type RetailCrmCredentials = {
  apiKey: string;
  site?: string;
};

type RetailCrmOrderListParams = {
  baseUrl: string;
  credentials: RetailCrmCredentials;
  page?: number;
  limit?: number;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
};

type RetailCrmOrdersResponse = {
  success?: boolean;
  errorMsg?: string;
  message?: string;
  orders?: unknown[];
  pagination?: {
    totalCount?: number;
    currentPage?: number;
    totalPageCount?: number;
  };
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function normalizeRetailCrmLimit(limit?: number) {
  if (limit === 50 || limit === 100) {
    return limit;
  }

  return 20;
}

function normalizeRetailCrmPage(page?: number) {
  if (!page || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function getRetailCrmCircuitBreakerKey(baseUrl: string) {
  return `retailcrm:${normalizeBaseUrl(baseUrl).toLowerCase()}`;
}

function buildRetailCrmErrorMessage(error: unknown) {
  if (error instanceof HttpCircuitOpenError) {
    return "RetailCRM is temporarily unavailable. Please try again later.";
  }

  if (error instanceof HttpClientTimeoutError) {
    return "RetailCRM request timed out";
  }

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

export async function fetchRetailCrmOrders(params: RetailCrmOrderListParams) {
  const { baseUrl, credentials, deliveryDateFrom, deliveryDateTo } = params;

  const page = normalizeRetailCrmPage(params.page);
  const limit = normalizeRetailCrmLimit(params.limit);

  if (!baseUrl.trim()) {
    throw new Error("RetailCRM baseUrl is required");
  }

  if (!credentials.apiKey?.trim()) {
    throw new Error("RetailCRM apiKey is required");
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const url = new URL(`${normalizedBaseUrl}/api/v5/orders`);

  url.searchParams.set("apiKey", credentials.apiKey);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  if (credentials.site?.trim()) {
    url.searchParams.set("site", credentials.site.trim());
  }

  if (deliveryDateFrom?.trim()) {
    url.searchParams.set("filter[deliveryDateFrom]", deliveryDateFrom.trim());
  }

  if (deliveryDateTo?.trim()) {
    url.searchParams.set("filter[deliveryDateTo]", deliveryDateTo.trim());
  }

  let data: RetailCrmOrdersResponse;

  try {
    data = await requestJson<RetailCrmOrdersResponse>({
      url: url.toString(),
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      timeoutMs: 8000,
      retryCount: 2,
      retryDelayMs: 500,
      circuitBreaker: {
        key: getRetailCrmCircuitBreakerKey(normalizedBaseUrl),
        failureThreshold: 3,
        cooldownMs: 30_000,
      },
    });
  } catch (error) {
    throw new Error(buildRetailCrmErrorMessage(error));
  }

  if (data.success === false) {
    throw new Error(data.errorMsg || "RetailCRM returned success=false");
  }

  return {
    raw: data,
    orders: Array.isArray(data.orders) ? data.orders : [],
    pagination: {
      page,
      limit,
      totalCount:
        typeof data.pagination?.totalCount === "number"
          ? data.pagination.totalCount
          : null,
      currentPage:
        typeof data.pagination?.currentPage === "number"
          ? data.pagination.currentPage
          : page,
      totalPageCount:
        typeof data.pagination?.totalPageCount === "number"
          ? data.pagination.totalPageCount
          : null,
    },
  };
}