/**
 * Error classes for @billingos/node SDK
 */

/**
 * Base error class for all BillingOS errors
 */
export class BillingOSError extends Error {
  public readonly code?: string;
  public readonly status?: number;
  public readonly details?: any;

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = 'BillingOSError';
    this.code = code;
    this.status = status;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BillingOSError);
    }
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends BillingOSError {
  constructor(message: string = 'Invalid API key', details?: any) {
    super(message, 'authentication_error', 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends BillingOSError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super(message, 'authorization_error', 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends BillingOSError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 'not_found_error', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends BillingOSError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 'validation_error', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends BillingOSError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 'rate_limit_error', 429, details);
    this.name = 'RateLimitError';
  }
}

/**
 * Server error (500+)
 */
export class ServerError extends BillingOSError {
  constructor(message: string = 'Internal server error', status: number = 500, details?: any) {
    super(message, 'server_error', status, details);
    this.name = 'ServerError';
  }
}

/**
 * Network error (connection failed, timeout, etc.)
 */
export class NetworkError extends BillingOSError {
  constructor(message: string = 'Network error', details?: any) {
    super(message, 'network_error', 0, details);
    this.name = 'NetworkError';
  }
}

/**
 * Parse response error returned by API
 */
export function parseAPIError(status: number, body: any): BillingOSError {
  const message = body?.error?.message || body?.message || 'Unknown error';
  const code = body?.error?.code || body?.code;
  const details = body?.error?.details || body?.details;

  // Map status codes to error classes
  if (status === 401) {
    return new AuthenticationError(message, details);
  } else if (status === 403) {
    return new AuthorizationError(message, details);
  } else if (status === 404) {
    return new NotFoundError(message, details);
  } else if (status === 400 || status === 422) {
    return new ValidationError(message, details);
  } else if (status === 429) {
    return new RateLimitError(message, details);
  } else if (status >= 500) {
    return new ServerError(message, status, details);
  }

  return new BillingOSError(message, code, status, details);
}
