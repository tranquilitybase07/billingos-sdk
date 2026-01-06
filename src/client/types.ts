// Core API types for BillingOS SDK

/**
 * Customer represents a billing customer
 */
export interface Customer {
  id: string
  email: string
  name?: string
  metadata?: Record<string, string>
  created_at: string
  updated_at: string
}

/**
 * Input for creating a customer
 */
export interface CreateCustomerInput {
  email: string
  name?: string
  metadata?: Record<string, string>
}

/**
 * Input for updating a customer
 */
export interface UpdateCustomerInput {
  email?: string
  name?: string
  metadata?: Record<string, string>
}

/**
 * Subscription status
 */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid'

/**
 * Subscription represents a customer subscription
 */
export interface Subscription {
  id: string
  customer_id: string
  price_id: string
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  trial_start?: string
  trial_end?: string
  canceled_at?: string
  metadata?: Record<string, string>
  created_at: string
  updated_at: string
}

/**
 * Input for creating a subscription
 */
export interface CreateSubscriptionInput {
  customer_id: string
  price_id: string
  trial_days?: number
  metadata?: Record<string, string>
}

/**
 * Input for updating a subscription
 */
export interface UpdateSubscriptionInput {
  price_id?: string
  cancel_at_period_end?: boolean
  metadata?: Record<string, string>
}

/**
 * Price preview for subscription changes
 */
export interface SubscriptionPreview {
  proration_amount: number
  next_invoice_amount: number
  next_invoice_date: string
}

/**
 * Entitlement represents a feature access grant
 */
export interface Entitlement {
  feature_key: string
  has_access: boolean
  limit?: number
  usage?: number
  metadata?: Record<string, string>
}

/**
 * Input for checking entitlements
 */
export interface CheckEntitlementInput {
  customer_id: string
  feature_key: string
}

/**
 * Usage event for tracking
 */
export interface UsageEvent {
  customer_id: string
  feature_key: string
  quantity: number
  timestamp?: string
  metadata?: Record<string, string>
}

/**
 * Usage metrics response
 */
export interface UsageMetrics {
  feature_key: string
  current_usage: number
  limit?: number
  period_start: string
  period_end: string
}

/**
 * Invoice represents a billing invoice
 */
export interface Invoice {
  id: string
  customer_id: string
  amount_due: number
  amount_paid: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  due_date?: string
  paid_at?: string
  invoice_pdf?: string
  created_at: string
}

/**
 * Payment method
 */
export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
  is_default: boolean
  created_at: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * API error response
 */
export interface APIErrorResponse {
  error: {
    message: string
    code?: string
    details?: unknown
  }
}
