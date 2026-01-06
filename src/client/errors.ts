/**
 * Base error class for all BillingOS SDK errors
 */
export class BillingOSError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'BillingOSError'
    Object.setPrototypeOf(this, BillingOSError.prototype)
  }
}

/**
 * Thrown when the API request fails due to authentication issues (401)
 */
export class UnauthorizedError extends BillingOSError {
  constructor(message = 'Unauthorized: Invalid or missing API key', data?: unknown) {
    super(message, 401, data)
    this.name = 'UnauthorizedError'
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

/**
 * Thrown when the requested resource is not found (404)
 */
export class NotFoundError extends BillingOSError {
  constructor(message = 'Resource not found', data?: unknown) {
    super(message, 404, data)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * Thrown when the request fails validation (400)
 */
export class ValidationError extends BillingOSError {
  constructor(message = 'Validation failed', data?: unknown) {
    super(message, 400, data)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Thrown when rate limit is exceeded (429)
 */
export class RateLimitError extends BillingOSError {
  constructor(message = 'Too many requests', data?: unknown) {
    super(message, 429, data)
    this.name = 'RateLimitError'
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

/**
 * Thrown when the server returns a 500 error
 */
export class ServerError extends BillingOSError {
  constructor(message = 'Internal server error', data?: unknown) {
    super(message, 500, data)
    this.name = 'ServerError'
    Object.setPrototypeOf(this, ServerError.prototype)
  }
}

/**
 * Thrown when the network request fails
 */
export class NetworkError extends BillingOSError {
  constructor(message = 'Network request failed', originalError?: unknown) {
    super(message, undefined, originalError)
    this.name = 'NetworkError'
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

/**
 * Type guard to check if an error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

/**
 * Type guard to check if an error is an unauthorized error
 */
export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError
}

/**
 * Type guard to check if an error is a not found error
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError
}

/**
 * Type guard to check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError
}
