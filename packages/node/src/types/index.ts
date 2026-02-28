/**
 * Core TypeScript types for @billingos/node
 */

// ============================================================================
// Configuration
// ============================================================================

export interface BillingOSConfig {
  /** Secret API key (sk_live_* or sk_test_*) */
  secretKey: string;

  /** API base URL (defaults to production) */
  apiUrl?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Maximum number of retries for failed requests (default: 3) */
  maxRetries?: number;
}

// ============================================================================
// Session Tokens
// ============================================================================

export interface CreateSessionTokenInput {
  /** Your user's ID from your auth system */
  externalUserId: string;

  /** Optional organization ID for B2B scenarios */
  externalOrganizationId?: string;

  /** Token expiration time in seconds (default: 3600, max: 86400) */
  expiresIn?: number;

  /** Optional array of allowed operations for scoping */
  allowedOperations?: string[];

  /** Optional metadata (IP address, user agent, etc.) */
  metadata?: Record<string, any>;
}

export interface SessionTokenResponse {
  /** The session token to pass to frontend */
  sessionToken: string;

  /** When the token expires */
  expiresAt: Date;
}

// ============================================================================
// API Responses
// ============================================================================

export interface APIResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    status?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// ============================================================================
// Customers
// ============================================================================

export interface Customer {
  id: string;
  externalUserId: string;
  externalOrganizationId?: string;
  email?: string;
  name?: string;
  stripeCustomerId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerInput {
  externalUserId: string;
  externalOrganizationId?: string;
  email?: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCustomerInput {
  email?: string;
  name?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Subscriptions
// ============================================================================

export interface Subscription {
  id: string;
  customerId: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionInput {
  customerId: string;
  priceId: string;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionInput {
  priceId?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, any>;
}

// ============================================================================
// Webhooks
// ============================================================================

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  createdAt: Date;
}

export interface WebhookVerificationResult {
  valid: boolean;
  event?: WebhookEvent;
  error?: string;
}

// ============================================================================
// Usage Tracking
// ============================================================================

export interface TrackUsageInput {
  /** Customer external ID */
  customerId: string;

  /** Feature key (e.g., 'api_calls') */
  featureKey: string;

  /** Number of units to track */
  quantity: number;

  /** Idempotency key for deduplication */
  idempotencyKey?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface TrackUsageResponse {
  success: boolean;
  feature_key: string;
  quantity: number;
  recorded_at: string;
  usage?: {
    consumed_units: number;
    limit_units: number;
    remaining_units: number;
    period_start: string;
    period_end: string;
  };
}

export interface EntitlementResponse {
  feature_key: string;
  has_access: boolean;
  reason?: string;
  limit: number | null;
  usage: number | null;
  metadata: {
    remaining?: number;
    resets_at?: string;
    type?: string;
  } | null;
}

export interface UsageMetric {
  feature_key: string;
  feature_title: string;
  product_name: string;
  consumed: number;
  limit: number;
  remaining: number;
  percentage_used: number;
  period_start: string;
  period_end: string;
  resets_in_days: number;
}

export interface UsageMetricsResponse {
  metrics: UsageMetric[];
  customer_id: string;
}

// ============================================================================
// Errors
// ============================================================================

export interface BillingOSError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// ============================================================================
// HTTP Client
// ============================================================================

export interface HTTPClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  maxRetries: number;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}
