// BillingOS SDK - Main Entry Point

// Import global styles (injected at runtime; CSS string is substituted at build time)
import './styles/inject'

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
