// BillingOS SDK - Main Entry Point

// Log SDK version on load
console.log(
  '%c🎯 BillingOS SDK v1.1.0 loaded with Iframe Checkout',
  'background: #3b82f6; color: white; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;'
)

// Import global styles (will be bundled)
import './styles/globals.css'

// Client
export * from './client'

// Hooks
export * from './hooks'

// Components
export * from './components'

// Providers
export * from './providers'

// Utils
export * from './utils'

// Checkout API
export { openCheckout, getCheckoutAPI, CheckoutAPI } from './checkout'
export type { CheckoutOpenOptions } from './checkout'

// Create a global billingOS object for imperative API
import { BillingOSClient } from './client'
import { getCheckoutAPI } from './checkout'

declare global {
  interface Window {
    billingOS?: {
      checkout: {
        open: (options: import('./checkout').CheckoutOpenOptions) => Promise<{
          success: boolean
          subscription?: import('./client/types').Subscription
          error?: Error
        }>
      }
      client?: BillingOSClient
    }
  }
}

// Initialize global billingOS object if in browser
if (typeof window !== 'undefined') {
  window.billingOS = {
    checkout: {
      open: async (options) => {
        const api = getCheckoutAPI()
        return api.open(options)
      }
    }
  }
}
