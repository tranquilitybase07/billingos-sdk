import React from 'react'
import { createRoot } from 'react-dom/client'
import { CheckoutModal, CheckoutModalProps } from './components/CheckoutModal'
import { BillingOSProvider } from './providers/BillingOSProvider'
import { BillingOSClient } from './client'
import type { Subscription } from './client/types'

/**
 * Options for opening the checkout modal programmatically
 */
export interface CheckoutOpenOptions {
  /**
   * The price ID to checkout
   */
  priceId: string

  /**
   * Customer information to pre-populate
   */
  customer?: {
    email?: string
    name?: string
    taxId?: string
  }

  /**
   * Coupon code to apply
   */
  couponCode?: string

  /**
   * Whether to collect billing address
   */
  collectBillingAddress?: boolean

  /**
   * Currency for the checkout (defaults to price currency)
   */
  currency?: string

  /**
   * Existing subscription ID for upgrades/downgrades
   */
  existingSubscriptionId?: string

  /**
   * Custom metadata to attach to the subscription
   */
  metadata?: Record<string, string>

  /**
   * Theme for the checkout modal
   */
  theme?: 'light' | 'dark' | 'auto'

  /**
   * Locale for the checkout (e.g., 'en', 'es', 'fr')
   */
  locale?: string

  /**
   * Success callback with the created subscription
   */
  onSuccess?: (subscription: Subscription) => void

  /**
   * Error callback
   */
  onError?: (error: Error) => void

  /**
   * Cancel callback when user closes without completing
   */
  onCancel?: () => void

  /**
   * Debug mode for development
   */
  debug?: boolean

  /**
   * Session token for authentication (if not using provider)
   */
  sessionToken?: string

  /**
   * API base URL (if not using provider)
   */
  apiUrl?: string
}

/**
 * Programmatic checkout API
 */
export class CheckoutAPI {
  private client?: BillingOSClient
  private container?: HTMLElement
  private root?: ReturnType<typeof createRoot>

  constructor(client?: BillingOSClient) {
    this.client = client
  }

  /**
   * Open the checkout modal programmatically
   */
  async open(options: CheckoutOpenOptions): Promise<{ success: boolean; subscription?: Subscription; error?: Error }> {
    return new Promise((resolve) => {
      // Create container if it doesn't exist
      if (!this.container) {
        this.container = document.createElement('div')
        this.container.id = 'billingos-checkout-container'
        this.container.style.position = 'fixed'
        this.container.style.zIndex = '999999'
        document.body.appendChild(this.container)
      }

      // Create the modal component
      const modalProps: CheckoutModalProps = {
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) {
            this.close()
            if (options.onCancel) {
              options.onCancel()
            }
            resolve({ success: false })
          }
        },
        priceId: options.priceId,
        customer: options.customer,
        couponCode: options.couponCode,
        collectBillingAddress: options.collectBillingAddress,
        currency: options.currency,
        existingSubscriptionId: options.existingSubscriptionId,
        metadata: options.metadata,
        theme: options.theme,
        locale: options.locale,
        onSuccess: (subscription: Subscription) => {
          if (options.onSuccess) {
            options.onSuccess(subscription)
          }
          resolve({ success: true, subscription })
          this.close()
        },
        onError: (error: Error) => {
          if (options.onError) {
            options.onError(error)
          }
          resolve({ success: false, error })
        },
        onCancel: options.onCancel,
        debug: options.debug
      }

      // Render the modal
      if (!this.root) {
        this.root = createRoot(this.container)
      }

      // If we have a client, use it directly
      // Otherwise, create a new one with the provided session token
      if (this.client) {
        // Already have a provider context
        this.root.render(
          React.createElement(CheckoutModal, modalProps)
        )
      } else if (options.sessionToken) {
        // Need to create a provider
        this.root.render(
          React.createElement(
            BillingOSProvider,
            {
              sessionToken: options.sessionToken,
              options: {
                baseUrl: options.apiUrl
              },
              children: React.createElement(CheckoutModal, modalProps)
            }
          )
        )
      } else {
        // No authentication provided
        const error = new Error('No session token or BillingOS client provided')
        if (options.onError) {
          options.onError(error)
        }
        resolve({ success: false, error })
        this.close()
      }
    })
  }

  /**
   * Close the checkout modal
   */
  close() {
    if (this.root) {
      this.root.unmount()
      this.root = undefined
    }
    if (this.container) {
      this.container.remove()
      this.container = undefined
    }
  }
}

/**
 * Global checkout API instance
 */
let globalCheckoutAPI: CheckoutAPI | null = null

/**
 * Get or create the global checkout API instance
 */
export function getCheckoutAPI(client?: BillingOSClient): CheckoutAPI {
  if (!globalCheckoutAPI) {
    globalCheckoutAPI = new CheckoutAPI(client)
  }
  return globalCheckoutAPI
}

/**
 * Convenience function to open checkout modal
 */
export async function openCheckout(options: CheckoutOpenOptions) {
  const api = getCheckoutAPI()
  return api.open(options)
}