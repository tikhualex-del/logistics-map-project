export type IntegrationErrorCode =
  | "INTEGRATION_ALREADY_EXISTS"
  | "INTEGRATION_NOT_FOUND";

export class IntegrationError extends Error {
  public readonly code: IntegrationErrorCode;

  constructor(code: IntegrationErrorCode, message: string) {
    super(message);
    this.name = "IntegrationError";
    this.code = code;
  }
}

export function isIntegrationError(error: unknown): error is IntegrationError {
  return error instanceof IntegrationError;
}