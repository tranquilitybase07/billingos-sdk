import {
  BillingOSError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  NetworkError,
} from './errors'
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  SubscriptionPreview,
  Entitlement,
  CheckEntitlementInput,
  UsageEvent,
  UsageMetrics,
  Invoice,
  PaymentMethod,
  PaginatedResponse,
  APIErrorResponse,
  // Portal types
  CustomerPortalData,
  PortalUpdateSubscriptionInput,
  PortalUpdateSubscriptionResponse,
  PortalCancelSubscriptionInput,
  PortalCancelSubscriptionResponse,
  AddPaymentMethodInput,
  AddPaymentMethodResponse,
  SetupIntentResponse,
  RetryInvoiceResponse,
  UpdateCustomerBillingInput,
  CustomerBillingInfo,
  // Checkout types
  CreateCheckoutInput,
  CreateCheckoutResponse,
  ConfirmCheckoutResponse,
  // Pricing table types
  GetProductsResponse,
  // Upgrade nudge types
  UsageCheckResponse,
} from './types'

export * from './types'
export * from './errors'

/**
 * Configuration options for the BillingOS client
 */
export interface BillingOSClientOptions {
  /**
   * Base URL for the API (defaults to production)
   */
  baseUrl?: string

  /**
   * Environment (production or sandbox)
   */
  environment?: 'production' | 'sandbox'

  /**
   * API version to use
   */
  version?: string

  /**
   * Custom headers to include in all requests
   */
  headers?: Record<string, string>

  /**
   * Timeout for requests in milliseconds
   */
  timeout?: number
}

/**
 * Main BillingOS API client
 */
export class BillingOSClient {
  private sessionToken: string
  private baseUrl: string
  private headers: Record<string, string>
  private timeout: number

  constructor(sessionToken: string, options: BillingOSClientOptions = {}) {
    if (!sessionToken) {
      throw new Error('Session token is required')
    }

    this.sessionToken = sessionToken
    this.timeout = options.timeout || 30000

    // Set base URL based on environment
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl
    } else if (options.environment === 'sandbox') {
      this.baseUrl = 'https://sandbox.billingos.com/api'
    } else {
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    }

    // Setup default headers
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.sessionToken}`,
      'X-BillingOS-Version': options.version || '2026-01-01',
      ...options.headers,
    }
  }

  /**
   * Internal method to make HTTP requests
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T
      }

      // Parse response
      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')
      const data = isJson ? await response.json() : await response.text()

      // Handle errors
      if (!response.ok) {
        const errorData = isJson ? (data as APIErrorResponse) : { error: { message: data } }
        const errorMessage = errorData.error?.message || `Request failed with status ${response.status}`

        switch (response.status) {
          case 400:
            throw new ValidationError(errorMessage, errorData)
          case 401:
            throw new UnauthorizedError(errorMessage, errorData)
          case 404:
            throw new NotFoundError(errorMessage, errorData)
          case 429:
            throw new RateLimitError(errorMessage, errorData)
          case 500:
          case 502:
          case 503:
          case 504:
            throw new ServerError(errorMessage, errorData)
          default:
            throw new BillingOSError(errorMessage, response.status, errorData)
        }
      }

      return data as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof BillingOSError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timeout')
      }

      throw new NetworkError('Network request failed', error)
    }
  }

  /**
   * GET request helper
   */
  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' })
  }

  /**
   * POST request helper
   */
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PATCH request helper
   */
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETE request helper
   */
  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }

  // =============================================================================
  // CUSTOMERS API
  // =============================================================================

  /**
   * Create a new customer
   */
  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    return this.post<Customer>('/customers', input)
  }

  /**
   * Get a customer by ID
   */
  async getCustomer(id: string): Promise<Customer> {
    return this.get<Customer>(`/customers/${id}`)
  }

  /**
   * List customers (paginated)
   */
  async listCustomers(params?: {
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Customer>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())

    const queryString = query.toString()
    return this.get<PaginatedResponse<Customer>>(
      `/customers${queryString ? `?${queryString}` : ''}`
    )
  }

  /**
   * Update a customer
   */
  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    return this.patch<Customer>(`/customers/${id}`, input)
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    return this.delete<void>(`/customers/${id}`)
  }

  // =============================================================================
  // SUBSCRIPTIONS API
  // =============================================================================

  /**
   * Create a new subscription
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
    return this.post<Subscription>('/subscriptions', input)
  }

  /**
   * Get a subscription by ID
   */
  async getSubscription(id: string): Promise<Subscription> {
    return this.get<Subscription>(`/subscriptions/${id}`)
  }

  /**
   * List subscriptions (paginated)
   */
  async listSubscriptions(params?: {
    customer_id?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Subscription>> {
    const query = new URLSearchParams()
    if (params?.customer_id) query.set('customer_id', params.customer_id)
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())

    const queryString = query.toString()
    return this.get<PaginatedResponse<Subscription>>(
      `/subscriptions${queryString ? `?${queryString}` : ''}`
    )
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    id: string,
    input: UpdateSubscriptionInput
  ): Promise<Subscription> {
    return this.patch<Subscription>(`/subscriptions/${id}`, input)
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(id: string, immediately = false): Promise<Subscription> {
    return this.post<Subscription>(`/subscriptions/${id}/cancel`, { immediately })
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(id: string): Promise<Subscription> {
    return this.post<Subscription>(`/subscriptions/${id}/reactivate`)
  }

  /**
   * Preview subscription changes
   */
  async previewSubscription(
    id: string,
    input: UpdateSubscriptionInput
  ): Promise<SubscriptionPreview> {
    return this.post<SubscriptionPreview>(`/subscriptions/${id}/preview`, input)
  }

  // =============================================================================
  // ENTITLEMENTS API
  // =============================================================================

  /**
   * Check if a customer has access to a feature
   */
  async checkEntitlement(input: CheckEntitlementInput): Promise<Entitlement> {
    return this.post<Entitlement>('/entitlements/check', input)
  }

  /**
   * List all entitlements for a customer
   */
  async listEntitlements(customerId: string): Promise<Entitlement[]> {
    return this.get<Entitlement[]>(`/entitlements?customer_id=${customerId}`)
  }

  // =============================================================================
  // USAGE TRACKING API
  // =============================================================================

  /**
   * Track a usage event
   */
  async trackUsage(event: UsageEvent): Promise<void> {
    return this.post<void>('/usage/track', event)
  }

  /**
   * Get usage metrics for a customer and feature
   */
  async getUsageMetrics(customerId: string, featureKey: string): Promise<UsageMetrics> {
    return this.get<UsageMetrics>(
      `/usage/metrics?customer_id=${customerId}&feature_key=${featureKey}`
    )
  }

  // =============================================================================
  // INVOICES API
  // =============================================================================

  /**
   * Get an invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice> {
    return this.get<Invoice>(`/invoices/${id}`)
  }

  /**
   * List invoices for a customer
   */
  async listInvoices(params?: {
    customer_id?: string
    page?: number
    page_size?: number
  }): Promise<PaginatedResponse<Invoice>> {
    const query = new URLSearchParams()
    if (params?.customer_id) query.set('customer_id', params.customer_id)
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())

    const queryString = query.toString()
    return this.get<PaginatedResponse<Invoice>>(
      `/invoices${queryString ? `?${queryString}` : ''}`
    )
  }

  // =============================================================================
  // PAYMENT METHODS API
  // =============================================================================

  /**
   * List payment methods for a customer
   */
  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    return this.get<PaymentMethod[]>(`/payment-methods?customer_id=${customerId}`)
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(id: string): Promise<void> {
    return this.delete<void>(`/payment-methods/${id}`)
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(id: string): Promise<void> {
    return this.post<void>(`/payment-methods/${id}/set-default`)
  }

  // =============================================================================
  // CUSTOMER PORTAL API
  // =============================================================================

  /**
   * Get all portal data for the current customer
   */
  async getCustomerPortal(): Promise<CustomerPortalData> {
    return this.get<CustomerPortalData>('/sdk/customer/portal')
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updatePortalSubscription(
    subscriptionId: string,
    input: PortalUpdateSubscriptionInput
  ): Promise<PortalUpdateSubscriptionResponse> {
    return this.post<PortalUpdateSubscriptionResponse>(
      `/sdk/subscriptions/${subscriptionId}/update`,
      input
    )
  }

  /**
   * Cancel subscription with feedback
   */
  async cancelPortalSubscription(
    subscriptionId: string,
    input: PortalCancelSubscriptionInput
  ): Promise<PortalCancelSubscriptionResponse> {
    return this.post<PortalCancelSubscriptionResponse>(
      `/sdk/subscriptions/${subscriptionId}/cancel`,
      input
    )
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivatePortalSubscription(subscriptionId: string): Promise<void> {
    return this.post<void>(`/sdk/subscriptions/${subscriptionId}/reactivate`)
  }

  /**
   * Add a payment method
   */
  async addPaymentMethod(input: AddPaymentMethodInput): Promise<AddPaymentMethodResponse> {
    return this.post<AddPaymentMethodResponse>('/sdk/payment-methods', input)
  }

  /**
   * Get setup intent for adding a new card
   */
  async getSetupIntent(): Promise<SetupIntentResponse> {
    return this.post<SetupIntentResponse>('/sdk/payment-methods/setup-intent')
  }

  /**
   * Retry a failed invoice
   */
  async retryInvoice(
    invoiceId: string,
    paymentMethodId?: string
  ): Promise<RetryInvoiceResponse> {
    return this.post<RetryInvoiceResponse>(`/sdk/invoices/${invoiceId}/retry`, {
      paymentMethodId,
    })
  }

  /**
   * Update customer billing information
   */
  async updateCustomerBilling(input: UpdateCustomerBillingInput): Promise<CustomerBillingInfo> {
    return this.patch<CustomerBillingInfo>('/sdk/customer/billing', input)
  }

  // =============================================================================
  // CHECKOUT API (Payment Bottom Sheet)
  // =============================================================================

  /**
   * Create a checkout session for purchasing a subscription
   */
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResponse> {
    return this.post<CreateCheckoutResponse>('/v1/checkout/create', input)
  }

  /**
   * Confirm a checkout after payment is processed
   */
  async confirmCheckout(
    clientSecret: string,
    paymentMethodId: string
  ): Promise<ConfirmCheckoutResponse> {
    return this.post<ConfirmCheckoutResponse>(
      `/v1/checkout/${clientSecret}/confirm`,
      { paymentMethodId }
    )
  }

  // =============================================================================
  // PRICING TABLE API
  // =============================================================================

  /**
   * Get all products for the pricing table
   * @param planIds - Optional array of plan IDs to filter
   */
  async getProducts(planIds?: string[]): Promise<GetProductsResponse> {
    const query = new URLSearchParams()
    if (planIds && planIds.length > 0) {
      query.set('planIds', planIds.join(','))
    }
    const queryString = query.toString()
    return this.get<GetProductsResponse>(
      `/v1/products${queryString ? `?${queryString}` : ''}`
    )
  }

  // =============================================================================
  // UPGRADE NUDGE API
  // =============================================================================

  /**
   * Check usage and get nudge trigger if applicable
   */
  async checkUsage(): Promise<UsageCheckResponse> {
    return this.get<UsageCheckResponse>('/sdk/usage/check')
  }
}

/**
 * Factory function to create a BillingOS client instance
 */
export function createBillingOSClient(
  sessionToken: string,
  options?: BillingOSClientOptions
): BillingOSClient {
  return new BillingOSClient(sessionToken, options)
}
