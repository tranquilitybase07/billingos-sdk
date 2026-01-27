/**
 * @billingos/node - Node.js SDK for BillingOS
 *
 * Server-side SDK for creating session tokens, managing customers,
 * subscriptions, and verifying webhooks.
 *
 * @example
 * ```typescript
 * import { BillingOS } from '@billingos/node';
 *
 * const billing = new BillingOS({
 *   secretKey: process.env.BILLINGOS_SECRET_KEY!,
 * });
 *
 * // Create session token
 * const { sessionToken, expiresAt } = await billing.createSessionToken({
 *   externalUserId: user.id,
 *   expiresIn: 3600,
 * });
 * ```
 */

// Main client
export { BillingOS } from './client/billingos.js';

// Types
export type {
  BillingOSConfig,
  CreateSessionTokenInput,
  SessionTokenResponse,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  WebhookEvent,
  WebhookVerificationResult,
} from './types/index.js';

// Errors
export {
  BillingOSError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  NetworkError,
} from './utils/errors.js';
