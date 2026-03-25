export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "NO_ACTIVE_COMPANY_ACCESS";

export class AuthError extends Error {
  public readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}