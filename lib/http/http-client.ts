export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class HttpClientError extends Error {
  public readonly status: number;
  public readonly responseBody: string;
  public readonly url: string;
  public readonly method: HttpMethod;

  constructor(params: {
    message: string;
    status: number;
    responseBody: string;
    url: string;
    method: HttpMethod;
  }) {
    super(params.message);
    this.name = "HttpClientError";
    this.status = params.status;
    this.responseBody = params.responseBody;
    this.url = params.url;
    this.method = params.method;
  }
}

export class HttpClientTimeoutError extends Error {
  public readonly url: string;
  public readonly method: HttpMethod;
  public readonly timeoutMs: number;

  constructor(params: { url: string; method: HttpMethod; timeoutMs: number }) {
    super(`Request timed out after ${params.timeoutMs} ms`);
    this.name = "HttpClientTimeoutError";
    this.url = params.url;
    this.method = params.method;
    this.timeoutMs = params.timeoutMs;
  }
}

export class HttpCircuitOpenError extends Error {
  public readonly circuitBreakerKey: string;
  public readonly openUntil: number;
  public readonly url: string;
  public readonly method: HttpMethod;

  constructor(params: {
    circuitBreakerKey: string;
    openUntil: number;
    url: string;
    method: HttpMethod;
  }) {
    super(
      `Circuit breaker is open for "${params.circuitBreakerKey}" until ${new Date(
        params.openUntil
      ).toISOString()}`
    );
    this.name = "HttpCircuitOpenError";
    this.circuitBreakerKey = params.circuitBreakerKey;
    this.openUntil = params.openUntil;
    this.url = params.url;
    this.method = params.method;
  }
}

type CircuitBreakerOptions = {
  key: string;
  failureThreshold?: number;
  cooldownMs?: number;
};

type RequestJsonOptions = {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  circuitBreaker?: CircuitBreakerOptions;
};

type CircuitState = {
  consecutiveFailures: number;
  openUntil: number | null;
};

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY_MS = 500;

const DEFAULT_CIRCUIT_FAILURE_THRESHOLD = 3;
const DEFAULT_CIRCUIT_COOLDOWN_MS = 30_000;

const circuitStore = new Map<string, CircuitState>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function getCircuitState(key: string): CircuitState {
  const existing = circuitStore.get(key);

  if (existing) {
    return existing;
  }

  const initialState: CircuitState = {
    consecutiveFailures: 0,
    openUntil: null,
  };

  circuitStore.set(key, initialState);

  return initialState;
}

function isCircuitOpen(state: CircuitState, now: number) {
  return state.openUntil !== null && now < state.openUntil;
}

function resetCircuitState(key: string) {
  circuitStore.set(key, {
    consecutiveFailures: 0,
    openUntil: null,
  });
}

function registerCircuitFailure(params: {
  key: string;
  failureThreshold: number;
  cooldownMs: number;
}) {
  const now = Date.now();
  const state = getCircuitState(params.key);
  const nextFailures = state.consecutiveFailures + 1;

  if (nextFailures >= params.failureThreshold) {
    circuitStore.set(params.key, {
      consecutiveFailures: nextFailures,
      openUntil: now + params.cooldownMs,
    });
    return;
  }

  circuitStore.set(params.key, {
    consecutiveFailures: nextFailures,
    openUntil: null,
  });
}

function registerCircuitSuccess(key: string) {
  resetCircuitState(key);
}

function shouldTrackFailureForCircuit(error: unknown) {
  if (error instanceof HttpClientTimeoutError) {
    return true;
  }

  if (error instanceof HttpClientError) {
    return shouldRetry(error.status);
  }

  return true;
}

export async function requestJson<T>(options: RequestJsonOptions): Promise<T> {
  const {
    url,
    method = "GET",
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    circuitBreaker,
  } = options;

  const circuitKey = circuitBreaker?.key?.trim() || null;
  const failureThreshold =
    circuitBreaker?.failureThreshold ?? DEFAULT_CIRCUIT_FAILURE_THRESHOLD;
  const cooldownMs =
    circuitBreaker?.cooldownMs ?? DEFAULT_CIRCUIT_COOLDOWN_MS;

  if (circuitKey) {
    const now = Date.now();
    const state = getCircuitState(circuitKey);

    if (isCircuitOpen(state, now)) {
      throw new HttpCircuitOpenError({
        circuitBreakerKey: circuitKey,
        openUntil: state.openUntil as number,
        url,
        method,
      });
    }
  }

  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const rawText = await response.text();
      const responseBody = rawText || "";

      if (!response.ok) {
        const error = new HttpClientError({
          message: `HTTP request failed with status ${response.status}`,
          status: response.status,
          responseBody,
          url,
          method,
        });

        if (attempt < retryCount && shouldRetry(response.status)) {
          attempt += 1;
          await sleep(retryDelayMs * attempt);
          continue;
        }

        if (circuitKey && shouldTrackFailureForCircuit(error)) {
          registerCircuitFailure({
            key: circuitKey,
            failureThreshold,
            cooldownMs,
          });
        }

        throw error;
      }

      if (circuitKey) {
        registerCircuitSuccess(circuitKey);
      }

      if (!responseBody) {
        return {} as T;
      }

      return JSON.parse(responseBody) as T;
    } catch (error) {
      clearTimeout(timeout);

      if (isAbortError(error)) {
        if (attempt < retryCount) {
          attempt += 1;
          await sleep(retryDelayMs * attempt);
          continue;
        }

        const timeoutError = new HttpClientTimeoutError({
          url,
          method,
          timeoutMs,
        });

        if (circuitKey) {
          registerCircuitFailure({
            key: circuitKey,
            failureThreshold,
            cooldownMs,
          });
        }

        throw timeoutError;
      }

      if (error instanceof HttpCircuitOpenError) {
        throw error;
      }

      if (error instanceof HttpClientError) {
        throw error;
      }

      if (attempt < retryCount) {
        attempt += 1;
        await sleep(retryDelayMs * attempt);
        continue;
      }

      if (circuitKey && shouldTrackFailureForCircuit(error)) {
        registerCircuitFailure({
          key: circuitKey,
          failureThreshold,
          cooldownMs,
        });
      }

      throw error;
    }
  }
}