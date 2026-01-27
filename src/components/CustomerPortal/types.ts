// CustomerPortal component types

/**
 * Props for the CustomerPortal component
 */
export interface CustomerPortalProps {
  /**
   * Open/close state (for drawer/modal mode)
   */
  isOpen?: boolean

  /**
   * Callback when user closes portal
   */
  onClose?: () => void

  /**
   * Display mode
   * - 'drawer': Slide-in from right (default)
   * - 'modal': Centered modal
   * - 'page': Full-page view
   */
  mode?: 'drawer' | 'modal' | 'page'

  /**
   * Default tab to show
   */
  defaultTab?: PortalTab

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark'
}

/**
 * Available tabs in the CustomerPortal
 */
export type PortalTab = 'subscription' | 'invoices' | 'payment' | 'settings'

/**
 * Product information
 */
export interface Product {
  id: string
  name: string
  description?: string
}

/**
 * Price information
 */
export interface Price {
  id: string
  amount: number
  currency: string
  interval: 'day' | 'week' | 'month' | 'year'
  intervalCount: number
}

/**
 * Feature type
 */
export type FeatureType = 'boolean_flag' | 'usage_quota' | 'numeric_limit'

/**
 * Usage information for a feature
 */
export interface UsageInfo {
  consumed: number
  limit: number
  percentage: number
  resetDate?: string
}

/**
 * Feature with usage tracking
 */
export interface FeatureWithUsage {
  id: string
  name: string
  title: string
  type: FeatureType
  properties: Record<string, unknown>
  usage?: UsageInfo
  enabled?: boolean
}

/**
 * Subscription details for portal
 */
export interface PortalSubscription {
  id: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  product: Product
  price: Price
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd: string | null
  canceledAt: string | null
  features: FeatureWithUsage[]
}

/**
 * Line item in an invoice
 */
export interface LineItem {
  description: string
  quantity: number
  amount: number
}

/**
 * Invoice status
 */
export type InvoiceStatus = 'paid' | 'open' | 'failed' | 'void'

/**
 * Invoice details for portal
 */
export interface PortalInvoice {
  id: string
  number: string
  date: string
  dueDate: string
  status: InvoiceStatus
  amount: number
  currency: string
  pdfUrl: string | null
  lineItems: LineItem[]
  failureReason?: string
}

/**
 * Card brand type
 */
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay'

/**
 * Card details
 */
export interface CardDetails {
  brand: CardBrand
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
  card?: CardDetails
  isDefault: boolean
}

/**
 * Billing address
 */
export interface Address {
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
  billingAddress?: Address
}

/**
 * Available plan for upgrade/downgrade
 */
export interface AvailablePlan {
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
export interface PortalData {
  subscription: PortalSubscription | null
  invoices: PortalInvoice[]
  paymentMethods: PortalPaymentMethod[]
  customer: PortalCustomer
  availablePlans: AvailablePlan[]
}

/**
 * Subscription update request
 */
export interface UpdateSubscriptionRequest {
  newPriceId: string
  prorationBehavior?: 'always_invoice' | 'create_prorations' | 'none'
}

/**
 * Proration details
 */
export interface ProrationDetails {
  credited: number
  charged: number
  total: number
}

/**
 * Subscription update response
 */
export interface UpdateSubscriptionResponse {
  subscription: {
    id: string
    status: string
    proration?: ProrationDetails
  }
  upcomingInvoice?: {
    amountDue: number
    dueDate: string
  }
}

/**
 * Cancellation reason options
 */
export type CancellationReason =
  | 'too_expensive'
  | 'missing_features'
  | 'found_alternative'
  | 'no_longer_needed'
  | 'other'

/**
 * Cancel subscription request
 */
export interface CancelSubscriptionRequest {
  cancelAtPeriodEnd: boolean
  cancellationReason?: CancellationReason
  feedback?: string
}

/**
 * Cancel subscription response
 */
export interface CancelSubscriptionResponse {
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
 * Add payment method request
 */
export interface AddPaymentMethodRequest {
  paymentMethodId: string
  setAsDefault?: boolean
}

/**
 * Add payment method response
 */
export interface AddPaymentMethodResponse {
  paymentMethod: PortalPaymentMethod
}

/**
 * Retry invoice request
 */
export interface RetryInvoiceRequest {
  paymentMethodId?: string
}

/**
 * Retry invoice response
 */
export interface RetryInvoiceResponse {
  success: boolean
  invoice: {
    id: string
    status: InvoiceStatus
    amount: number
  }
}

/**
 * Update customer request
 */
export interface UpdateCustomerRequest {
  name?: string
  email?: string
  billingAddress?: Address
}

/**
 * Setup intent response for adding cards
 */
export interface SetupIntentResponse {
  clientSecret: string
  stripePublishableKey: string
}
