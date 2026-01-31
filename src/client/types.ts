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

// =============================================================================
// CUSTOMER PORTAL TYPES
// =============================================================================

/**
 * Feature type for portal
 */
export type PortalFeatureType = 'boolean_flag' | 'usage_quota' | 'numeric_limit'

/**
 * Usage information for a feature
 */
export interface PortalUsageInfo {
  consumed: number
  limit: number
  percentage: number
  resetDate?: string
}

/**
 * Feature with usage tracking for portal
 */
export interface PortalFeatureWithUsage {
  id: string
  name: string
  title: string
  type: PortalFeatureType
  properties: Record<string, unknown>
  usage?: PortalUsageInfo
  enabled?: boolean
}

/**
 * Product information for portal
 */
export interface PortalProduct {
  id: string
  name: string
  description?: string
}

/**
 * Price information for portal
 */
export interface PortalPrice {
  id: string
  amount: number
  currency: string
  interval: 'day' | 'week' | 'month' | 'year'
  intervalCount: number
}

/**
 * Subscription details for portal
 */
export interface PortalSubscription {
  id: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  product: PortalProduct
  price: PortalPrice
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd: string | null
  canceledAt: string | null
  features: PortalFeatureWithUsage[]
}

/**
 * Line item in an invoice
 */
export interface PortalLineItem {
  description: string
  quantity: number
  amount: number
}

/**
 * Invoice details for portal
 */
export interface PortalInvoice {
  id: string
  number: string
  date: string
  dueDate: string
  status: 'paid' | 'open' | 'failed' | 'void'
  amount: number
  currency: string
  pdfUrl: string | null
  lineItems: PortalLineItem[]
  failureReason?: string
}

/**
 * Card details for portal
 */
export interface PortalCardDetails {
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay'
  last4: string
  expMonth: number
  expYear: number
}

/**
 * Payment method for portal
 */
export interface PortalPaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  card?: PortalCardDetails
  isDefault: boolean
}

/**
 * Billing address
 */
export interface PortalAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

/**
 * Customer details for portal
 */
export interface PortalCustomer {
  id: string
  email: string
  name: string
  billingAddress?: PortalAddress
}

/**
 * Available plan for upgrade/downgrade
 */
export interface PortalAvailablePlan {
  id: string
  name: string
  price: {
    amount: number
    currency: string
    interval: 'day' | 'week' | 'month' | 'year'
  }
  type: 'upgrade' | 'downgrade' | 'current'
}

/**
 * Complete portal data from API
 */
export interface CustomerPortalData {
  subscription: PortalSubscription | null
  invoices: PortalInvoice[]
  paymentMethods: PortalPaymentMethod[]
  customer: PortalCustomer
  availablePlans: PortalAvailablePlan[]
}

/**
 * Input for updating subscription via portal
 */
export interface PortalUpdateSubscriptionInput {
  newPriceId: string
  prorationBehavior?: 'always_invoice' | 'create_prorations' | 'none'
}

/**
 * Response for subscription update
 */
export interface PortalUpdateSubscriptionResponse {
  subscription: {
    id: string
    status: string
    proration?: {
      credited: number
      charged: number
      total: number
    }
  }
  upcomingInvoice?: {
    amountDue: number
    dueDate: string
  }
}

/**
 * Input for canceling subscription via portal
 */
export interface PortalCancelSubscriptionInput {
  cancelAtPeriodEnd: boolean
  cancellationReason?: 'too_expensive' | 'missing_features' | 'found_alternative' | 'no_longer_needed' | 'other'
  feedback?: string
}

/**
 * Response for subscription cancellation
 */
export interface PortalCancelSubscriptionResponse {
  subscription: {
    id: string
    status: string
    cancelAtPeriodEnd: boolean
    canceledAt: string
    currentPeriodEnd: string
  }
  message: string
}

/**
 * Input for adding a payment method
 */
export interface AddPaymentMethodInput {
  paymentMethodId: string
  setAsDefault?: boolean
}

/**
 * Response for adding a payment method
 */
export interface AddPaymentMethodResponse {
  paymentMethod: PortalPaymentMethod
}

/**
 * Setup intent response for adding cards
 */
export interface SetupIntentResponse {
  clientSecret: string
  stripePublishableKey: string
}

/**
 * Response for retrying an invoice
 */
export interface RetryInvoiceResponse {
  success: boolean
  invoice: {
    id: string
    status: 'paid' | 'open' | 'failed' | 'void'
    amount: number
  }
}

/**
 * Input for updating customer billing
 */
export interface UpdateCustomerBillingInput {
  name?: string
  email?: string
  billingAddress?: PortalAddress
}

/**
 * Customer billing info response
 */
export interface CustomerBillingInfo {
  id: string
  email: string
  name: string
  billingAddress?: PortalAddress
}

// =============================================================================
// PAYMENT BOTTOM SHEET / CHECKOUT TYPES
// =============================================================================

/**
 * Proration details for subscription changes
 */
export interface CheckoutProration {
  credited: number // cents
  charged: number // cents
  total: number // cents
  explanation: string
}

/**
 * Product summary for checkout
 */
export interface CheckoutProduct {
  name: string
  interval: 'day' | 'week' | 'month' | 'year'
  features: string[]
}

/**
 * Customer info for checkout
 */
export interface CheckoutCustomer {
  email: string
  name: string
}

/**
 * Checkout session returned by the API
 */
export interface CheckoutSession {
  id: string
  clientSecret: string
  amount: number // cents
  currency: string
  proration?: CheckoutProration
  product: CheckoutProduct
  customer: CheckoutCustomer
  stripeAccountId?: string // Connected account ID (optional for platform-owned payments)
}

/**
 * Input for creating a checkout session
 */
export interface CreateCheckoutInput {
  priceId: string
  customerEmail?: string
  customerName?: string
  existingSubscriptionId?: string
}

/**
 * Response from creating a checkout session
 * The API returns the checkout session directly
 */
export type CreateCheckoutResponse = CheckoutSession

/**
 * Input for confirming a checkout
 */
export interface ConfirmCheckoutInput {
  paymentMethodId: string
}

/**
 * Response from confirming a checkout
 */
export interface ConfirmCheckoutResponse {
  success: boolean
  subscriptionId: string
  status: 'active' | 'trialing'
  message: string
}

// =============================================================================
// PRICING TABLE TYPES
// =============================================================================

/**
 * Feature properties for pricing table
 */
export interface PricingFeatureProperties {
  limit?: number // -1 for unlimited
  period?: 'month' | 'year'
  unit?: string // e.g., 'calls', 'projects'
}

/**
 * Feature in pricing table
 */
export interface PricingFeature {
  id: string
  name: string // Technical key
  title: string // Display name
  type: 'boolean_flag' | 'usage_quota' | 'numeric_limit'
  properties: PricingFeatureProperties
}

/**
 * Price for a product
 */
export interface PricingPrice {
  id: string
  amount: number // in cents
  currency: string
  interval: 'month' | 'year' | 'week' | 'day'
  intervalCount: number
}

/**
 * Product in pricing table
 */
export interface PricingProduct {
  id: string
  name: string
  description: string
  prices: PricingPrice[]
  features: PricingFeature[]
  isCurrentPlan: boolean
  trialDays: number
  highlighted?: boolean // For "most popular" badge
}

/**
 * Current subscription info for pricing table
 */
export interface PricingCurrentSubscription {
  id: string
  productId: string
  priceId: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled'
  currentPeriodEnd: string // ISO 8601
  cancelAtPeriodEnd: boolean
}

/**
 * Response from GET /sdk/products
 */
export interface GetProductsResponse {
  products: PricingProduct[]
  currentSubscription: PricingCurrentSubscription | null
}

// =============================================================================
// UPGRADE NUDGE TYPES
// =============================================================================

/**
 * Type of nudge trigger
 */
export type NudgeTriggerType = 'usage_threshold' | 'feature_access' | 'time_based' | 'custom'

/**
 * Message content for nudge
 */
export interface NudgeMessage {
  title: string
  body: string
  cta: string // Call-to-action button text
}

/**
 * Suggested plan for upgrade
 */
export interface SuggestedPlan {
  id: string
  priceId: string
  name: string
  price: {
    amount: number
    currency: string
    interval: string
  }
  highlights: string[] // Key features/benefits
}

/**
 * Nudge trigger data
 */
export interface NudgeTrigger {
  type: NudgeTriggerType
  feature?: string // Which feature triggered (e.g., 'api_calls_limit')
  threshold?: number // e.g., 80 (percent)
  actual?: number // e.g., 85.2 (percent)
  message: NudgeMessage
  suggestedPlan: SuggestedPlan
}

/**
 * Response from GET /sdk/usage/check
 */
export interface UsageCheckResponse {
  shouldShowNudge: boolean
  trigger?: NudgeTrigger
}
