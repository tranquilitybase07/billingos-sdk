/**
 * Example Usage of the BillingOS Checkout Modal
 *
 * This file demonstrates multiple ways to integrate the iframe-based
 * checkout modal into your application.
 */

import React, { useState } from 'react'
import {
  // Components
  CheckoutModal,
  PricingTable,

  // Hooks
  useCheckout,

  // Provider
  BillingOSProvider,

  // Types
  type CheckoutModalProps,
  type Subscription
} from '@billingos/sdk'

// =============================================================================
// EXAMPLE 1: Direct Component Usage
// =============================================================================

export function DirectCheckoutExample() {
  const [open, setOpen] = useState(false)
  const [selectedPriceId] = useState('price_1234567890')

  return (
    <>
      <button onClick={() => setOpen(true)}>
        Open Checkout
      </button>

      <CheckoutModal
        open={open}
        onOpenChange={setOpen}
        priceId={selectedPriceId}
        customer={{
          email: 'user@example.com',
          name: 'John Doe'
        }}
        couponCode="WELCOME20"
        onSuccess={(subscription: Subscription) => {
          console.log('Subscription created:', subscription)
          // Redirect to success page or update UI
          window.location.href = '/dashboard'
        }}
        onError={(error) => {
          console.error('Checkout error:', error)
          alert('Payment failed. Please try again.')
        }}
        theme="light"
        debug={process.env.NODE_ENV === 'development'}
      />
    </>
  )
}

// =============================================================================
// EXAMPLE 2: Integration with PricingTable
// =============================================================================

export function PricingTableWithCheckoutModal() {
  return (
    <BillingOSProvider
      sessionToken="your-session-token"
      apiUrl="http://localhost:3001"
    >
      <PricingTable
        title="Choose Your Plan"
        description="Select the perfect plan for your needs"
        showIntervalToggle={true}
        defaultInterval="month"

        // Enable the new iframe-based checkout modal
        useCheckoutModal={true}

        // Or handle plan selection manually
        onSelectPlan={(priceId) => {
          console.log('Selected price:', priceId)
          // You can open your own modal here
        }}
      />
    </BillingOSProvider>
  )
}

// =============================================================================
// EXAMPLE 3: Programmatic API Usage (Non-React)
// =============================================================================

// This can be used anywhere in your JavaScript code
export async function openCheckoutProgrammatically() {
  // Using the global billingOS object
  const result = await window.billingOS.checkout.open({
    priceId: 'price_1234567890',
    customer: {
      email: 'user@example.com',
      name: 'John Doe'
    },
    couponCode: 'SAVE10',
    onSuccess: (subscription) => {
      console.log('Success!', subscription)
      // Handle success
      window.location.href = '/welcome'
    },
    onError: (error) => {
      console.error('Error:', error)
      // Handle error
      alert('Payment failed')
    },
    onCancel: () => {
      console.log('User cancelled checkout')
      // Track cancellation
    },

    // Required if not using BillingOSProvider
    sessionToken: 'your-session-token',
    apiUrl: 'http://localhost:3001'
  })

  if (result.success) {
    console.log('Subscription:', result.subscription)
  } else {
    console.error('Checkout failed:', result.error)
  }
}

// =============================================================================
// EXAMPLE 4: Using the useCheckout Hook
// =============================================================================

export function CheckoutWithHook() {
  const { openCheckout, isLoading, error } = useCheckout()

  const handleCheckout = async () => {
    const result = await openCheckout({
      priceId: 'price_1234567890',
      customer: {
        email: 'user@example.com',
        name: 'John Doe'
      },
      metadata: {
        source: 'homepage_hero',
        campaign: 'summer_sale'
      },
      onSuccess: (subscription) => {
        console.log('Subscription created:', subscription)
      }
    })

    if (result.success) {
      // Additional success handling
      console.log('Checkout completed successfully')
    }
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Subscribe Now'}
      </button>

      {error && (
        <p className="error">Error: {error.message}</p>
      )}
    </div>
  )
}

// =============================================================================
// EXAMPLE 5: Advanced Usage with Subscription Upgrades
// =============================================================================

export function UpgradeSubscriptionExample() {
  const [currentSubscriptionId] = useState('sub_existing123')
  const [upgradePriceId] = useState('price_premium456')
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <>
      <button onClick={() => setCheckoutOpen(true)}>
        Upgrade to Premium
      </button>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        priceId={upgradePriceId}

        // Pass existing subscription for upgrade/downgrade
        existingSubscriptionId={currentSubscriptionId}

        customer={{
          email: 'existing.customer@example.com'
        }}

        // Custom metadata for tracking
        metadata={{
          upgrade_source: 'account_settings',
          previous_plan: 'starter',
          user_segment: 'power_user'
        }}

        onSuccess={(subscription) => {
          console.log('Upgrade successful:', subscription)
          // Refresh user's subscription data
          window.location.reload()
        }}

        onError={(error) => {
          console.error('Upgrade failed:', error)
        }}
      />
    </>
  )
}

// =============================================================================
// EXAMPLE 6: Multiple Price Selection (Bundle)
// =============================================================================

export function BundleCheckoutExample() {
  const [selectedPrices, setSelectedPrices] = useState<string[]>([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const addToBundle = (priceId: string) => {
    setSelectedPrices(prev => [...prev, priceId])
  }

  const checkout = () => {
    if (selectedPrices.length === 0) {
      alert('Please select at least one item')
      return
    }

    // For now, checkout with the first price
    // In Phase 3, this will support multiple prices
    setCheckoutOpen(true)
  }

  return (
    <>
      <div>
        <h3>Select Your Bundle</h3>
        <button onClick={() => addToBundle('price_basic')}>
          Add Basic Plan
        </button>
        <button onClick={() => addToBundle('price_addon1')}>
          Add Storage Addon
        </button>
        <button onClick={() => addToBundle('price_addon2')}>
          Add Support Addon
        </button>
      </div>

      <button onClick={checkout}>
        Checkout ({selectedPrices.length} items)
      </button>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        priceId={selectedPrices[0]} // Phase 1: Single price
        // prices={selectedPrices}   // Phase 3: Multiple prices
        onSuccess={(subscription) => {
          console.log('Bundle purchased:', subscription)
        }}
      />
    </>
  )
}

// =============================================================================
// EXAMPLE 7: Custom Styling and Theming
// =============================================================================

export function ThemedCheckoutExample() {
  const [open, setOpen] = useState(false)

  return (
    <CheckoutModal
      open={open}
      onOpenChange={setOpen}
      priceId="price_1234567890"

      // Theme configuration
      theme="dark"  // or 'light' or 'auto'
      locale="es"   // Spanish locale

      // Collect additional information
      collectBillingAddress={true}

      customer={{
        email: 'user@example.com',
        name: 'Juan Pérez',
        taxId: 'ES12345678A'  // VAT number
      }}

      onSuccess={(subscription) => {
        console.log('¡Suscripción exitosa!', subscription)
      }}
    />
  )
}