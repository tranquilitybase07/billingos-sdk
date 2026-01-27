/**
 * Main BillingOS SDK class
 */

import type {
  BillingOSConfig,
  CreateSessionTokenInput,
  SessionTokenResponse,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../types/index.js';
import { APIClient } from './api-client.js';
import { ValidationError } from '../utils/errors.js';

export class BillingOS {
  private client: APIClient;
  private config: BillingOSConfig;

  constructor(config: BillingOSConfig) {
    // Validate config
    if (!config.secretKey) {
      throw new ValidationError('secretKey is required');
    }

    if (!config.secretKey.startsWith('sk_')) {
      throw new ValidationError('secretKey must start with sk_live_ or sk_test_');
    }

    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:3001',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      ...config,
    };

    // Initialize HTTP client
    this.client = new APIClient({
      baseURL: this.config.apiUrl!,
      timeout: this.config.timeout!,
      maxRetries: this.config.maxRetries!,
      headers: {
        Authorization: `Bearer ${this.config.secretKey}`,
      },
    });
  }

  // ==========================================================================
  // Session Tokens
  // ==========================================================================

  /**
   * Create a session token for a user
   * This is the primary method for enabling session token authentication
   *
   * @example
   * const { sessionToken, expiresAt } = await billing.createSessionToken({
   *   externalUserId: user.id,
   *   expiresIn: 3600, // 1 hour
   * });
   */
  async createSessionToken(
    input: CreateSessionTokenInput
  ): Promise<SessionTokenResponse> {
    // Validate input
    if (!input.externalUserId) {
      throw new ValidationError('externalUserId is required');
    }

    if (input.expiresIn && (input.expiresIn < 60 || input.expiresIn > 86400)) {
      throw new ValidationError('expiresIn must be between 60 and 86400 seconds');
    }

    const response = await this.client.post<SessionTokenResponse>(
      '/v1/session-tokens',
      {
        externalUserId: input.externalUserId,
        externalOrganizationId: input.externalOrganizationId,
        expiresIn: input.expiresIn,
        allowedOperations: input.allowedOperations,
        metadata: input.metadata,
      }
    );

    return {
      sessionToken: response.sessionToken,
      expiresAt: new Date(response.expiresAt),
    };
  }

  /**
   * Revoke a session token
   *
   * @example
   * await billing.revokeSessionToken('tok_abc123');
   */
  async revokeSessionToken(tokenId: string): Promise<void> {
    await this.client.delete(`/v1/session-tokens/${tokenId}`);
  }

  // ==========================================================================
  // Customers
  // ==========================================================================

  /**
   * Create a customer
   *
   * @example
   * const customer = await billing.customers.create({
   *   externalUserId: user.id,
   *   email: user.email,
   *   name: user.name,
   * });
   */
  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    if (!input.externalUserId) {
      throw new ValidationError('externalUserId is required');
    }

    return this.client.post<Customer>('/customers', {
      external_user_id: input.externalUserId,
      external_organization_id: input.externalOrganizationId,
      email: input.email,
      name: input.name,
      metadata: input.metadata,
    });
  }

  /**
   * Get a customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer> {
    return this.client.get<Customer>(`/customers/${customerId}`);
  }

  /**
   * Get a customer by external user ID
   */
  async getCustomerByExternalId(externalUserId: string): Promise<Customer> {
    return this.client.get<Customer>(`/customers/external/${externalUserId}`);
  }

  /**
   * Update a customer
   */
  async updateCustomer(customerId: string, input: UpdateCustomerInput): Promise<Customer> {
    return this.client.patch<Customer>(`/customers/${customerId}`, {
      email: input.email,
      name: input.name,
      metadata: input.metadata,
    });
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(customerId: string): Promise<void> {
    await this.client.delete(`/customers/${customerId}`);
  }

  // ==========================================================================
  // Subscriptions
  // ==========================================================================

  /**
   * Create a subscription
   *
   * @example
   * const subscription = await billing.createSubscription({
   *   customerId: customer.id,
   *   priceId: 'price_123',
   * });
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
    if (!input.customerId) {
      throw new ValidationError('customerId is required');
    }

    if (!input.priceId) {
      throw new ValidationError('priceId is required');
    }

    return this.client.post<Subscription>('/subscriptions', {
      customer_id: input.customerId,
      price_id: input.priceId,
      metadata: input.metadata,
    });
  }

  /**
   * Get a subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    return this.client.get<Subscription>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: string,
    input: UpdateSubscriptionInput
  ): Promise<Subscription> {
    return this.client.patch<Subscription>(`/subscriptions/${subscriptionId}`, {
      price_id: input.priceId,
      cancel_at_period_end: input.cancelAtPeriodEnd,
      metadata: input.metadata,
    });
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    return this.client.post<Subscription>(`/subscriptions/${subscriptionId}/cancel`);
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    return this.client.post<Subscription>(`/subscriptions/${subscriptionId}/reactivate`);
  }

  // ==========================================================================
  // Webhooks
  // ==========================================================================

  /**
   * Verify a webhook signature
   *
   * @example
   * const isValid = billing.verifyWebhook(req.body, req.headers['billingos-signature']);
   */
  verifyWebhook(_payload: any, _signature: string): boolean {
    // TODO: Implement HMAC signature verification
    // This will be implemented in the next phase
    return true;
  }
}
