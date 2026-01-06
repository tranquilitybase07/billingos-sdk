# BillingOS SDK

Official React SDK for BillingOS - A comprehensive billing, subscriptions, and payments platform.

## Features

- ✅ **React Hooks** - Powerful hooks for subscriptions, entitlements, usage tracking, and more
- ✅ **TypeScript Support** - Full type safety with auto-generated types
- ✅ **React Query Integration** - Automatic caching, refetching, and state management
- ✅ **API Client** - Comprehensive API client with error handling
- ✅ **Money Utilities** - Currency formatting and conversion helpers
- ✅ **Date Utilities** - Date formatting and manipulation
- ✅ **Next.js Compatible** - Works seamlessly with Next.js App Router and Pages Router
- ✅ **Framework Agnostic Core** - Can be extended to other frameworks in the future

## Installation

```bash
# npm
npm install @billingos/sdk

# pnpm
pnpm add @billingos/sdk

# yarn
yarn add @billingos/sdk
```

## Quick Start

### 1. Wrap your app with BillingOSProvider

```tsx
// app/layout.tsx (Next.js App Router)
import { BillingOSProvider } from '@billingos/sdk'
import '@billingos/sdk/styles.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BillingOSProvider
          apiKey={process.env.NEXT_PUBLIC_BILLINGOS_API_KEY}
          customerId="cus_123" // Optional: current user's customer ID
        >
          {children}
        </BillingOSProvider>
      </body>
    </html>
  )
}
```

### 2. Use hooks in your components

```tsx
'use client' // Next.js App Router

import { useSubscriptions, useHasFeature } from '@billingos/sdk'

export default function SubscriptionsPage() {
  const { data: subscriptions, isLoading } = useSubscriptions({
    customer_id: 'cus_123'
  })

  const hasAdvancedAnalytics = useHasFeature('cus_123', 'advanced_analytics')

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Your Subscriptions</h1>
      {subscriptions?.data.map(subscription => (
        <SubscriptionCard key={subscription.id} subscription={subscription} />
      ))}

      {hasAdvancedAnalytics && (
        <AdvancedAnalyticsDashboard />
      )}
    </div>
  )
}
```

## API Reference

### BillingOSProvider

The root provider component that wraps your app.

**Props:**
- `apiKey` (string, required) - Your BillingOS API key
- `customerId` (string, optional) - Current user's customer ID
- `organizationId` (string, optional) - Current organization ID
- `options` (object, optional) - Client configuration options
  - `baseUrl` (string) - Custom API base URL
  - `environment` ('production' | 'sandbox') - Environment
  - `version` (string) - API version
  - `headers` (object) - Additional headers
  - `timeout` (number) - Request timeout in milliseconds

### Subscription Hooks

#### `useSubscription(id, options?)`

Fetch a single subscription by ID.

```tsx
const { data: subscription, isLoading, error } = useSubscription('sub_123')
```

#### `useSubscriptions(params?, options?)`

List all subscriptions with pagination.

```tsx
const { data, isLoading } = useSubscriptions({
  customer_id: 'cus_123',
  page: 1,
  page_size: 10
})
```

#### `useCreateSubscription(options?)`

Create a new subscription.

```tsx
const createSubscription = useCreateSubscription()

const handleSubscribe = () => {
  createSubscription.mutate({
    customer_id: 'cus_123',
    price_id: 'price_pro_plan',
    trial_days: 14
  })
}
```

#### `useUpdateSubscription(subscriptionId, options?)`

Update an existing subscription (upgrade/downgrade).

```tsx
const updateSubscription = useUpdateSubscription('sub_123')

const handleUpgrade = () => {
  updateSubscription.mutate({
    price_id: 'price_enterprise_plan'
  })
}
```

#### `useCancelSubscription(subscriptionId, options?)`

Cancel a subscription.

```tsx
const cancelSubscription = useCancelSubscription('sub_123')

const handleCancel = () => {
  cancelSubscription.mutate({ immediately: false }) // Cancel at period end
}
```

#### `useReactivateSubscription(subscriptionId, options?)`

Reactivate a canceled subscription.

```tsx
const reactivateSubscription = useReactivateSubscription('sub_123')

const handleReactivate = () => {
  reactivateSubscription.mutate()
}
```

#### `useSubscriptionPreview(subscriptionId, input, options?)`

Preview subscription changes before applying.

```tsx
const { data: preview } = useSubscriptionPreview('sub_123', {
  price_id: 'price_pro_plan'
})

console.log(`Proration: $${preview?.proration_amount / 100}`)
console.log(`Next invoice: $${preview?.next_invoice_amount / 100}`)
```

### Entitlement Hooks

#### `useCheckEntitlement(customerId, featureKey, options?)`

Check if a customer has access to a feature.

```tsx
const { data: entitlement } = useCheckEntitlement('cus_123', 'advanced_analytics')

if (entitlement?.has_access) {
  // Show premium feature
}
```

#### `useHasFeature(customerId, featureKey, options?)`

Simplified hook that returns a boolean.

```tsx
const hasAccess = useHasFeature('cus_123', 'advanced_analytics')
```

#### `useEntitlements(customerId, options?)`

Get all entitlements for a customer.

```tsx
const { data: entitlements } = useEntitlements('cus_123')
```

#### `useTrackUsage(options?)`

Track usage events.

```tsx
const trackUsage = useTrackUsage()

const handleAPICall = async () => {
  await makeAPICall()

  trackUsage.mutate({
    customer_id: 'cus_123',
    feature_key: 'api_calls',
    quantity: 1
  })
}
```

#### `useUsageMetrics(customerId, featureKey, options?)`

Get usage metrics for a feature.

```tsx
const { data: metrics } = useUsageMetrics('cus_123', 'api_calls')

console.log(`Usage: ${metrics?.current_usage} / ${metrics?.limit}`)
```

#### `useIsApproachingLimit(customerId, featureKey, threshold?, options?)`

Check if usage is approaching the limit.

```tsx
const isApproachingLimit = useIsApproachingLimit('cus_123', 'api_calls', 80)

if (isApproachingLimit) {
  // Show warning message
}
```

### API Client

You can also use the API client directly for custom requests.

```tsx
import { useBillingOS } from '@billingos/sdk'

function MyComponent() {
  const { client } = useBillingOS()

  const handleCustomRequest = async () => {
    const subscription = await client.getSubscription('sub_123')
    const customer = await client.getCustomer('cus_123')
  }
}
```

**Available Methods:**
- `createCustomer(input)` - Create customer
- `getCustomer(id)` - Get customer
- `listCustomers(params)` - List customers
- `updateCustomer(id, input)` - Update customer
- `deleteCustomer(id)` - Delete customer
- `createSubscription(input)` - Create subscription
- `getSubscription(id)` - Get subscription
- `listSubscriptions(params)` - List subscriptions
- `updateSubscription(id, input)` - Update subscription
- `cancelSubscription(id, immediately)` - Cancel subscription
- `reactivateSubscription(id)` - Reactivate subscription
- `previewSubscription(id, input)` - Preview changes
- `checkEntitlement(input)` - Check feature access
- `listEntitlements(customerId)` - List entitlements
- `trackUsage(event)` - Track usage
- `getUsageMetrics(customerId, featureKey)` - Get metrics
- `getInvoice(id)` - Get invoice
- `listInvoices(params)` - List invoices
- `listPaymentMethods(customerId)` - List payment methods
- `removePaymentMethod(id)` - Remove payment method
- `setDefaultPaymentMethod(id)` - Set default payment method

### Utilities

#### Money Utilities

```tsx
import { Money, formatCurrencyAndAmount, getCentsInDollarString } from '@billingos/sdk'

// Format currency with symbol
Money.format(1050, 'USD') // "$10.50"
Money.formatCompact(1200000, 'USD') // "$12K"
Money.formatWhole(1050, 'USD') // "$10"

// Convert between cents and dollars
Money.fromCents(1050) // 10.5
Money.toCents(10.5) // 1050

// Get currency symbol
Money.getSymbol('USD') // "$"
Money.getSymbol('EUR') // "€"

// Calculations
Money.calculatePercentage(10000, 20) // 2000 (20% of $100)
Money.add(1000, 2000, 3000) // 6000 ($60)
```

#### Date Utilities

```tsx
import { DateUtils, formatDate, formatRelativeTime } from '@billingos/sdk'

// Format dates
DateUtils.format('2024-01-15T10:30:00Z', 'PPP') // "January 15th, 2024"
DateUtils.format(new Date(), 'yyyy-MM-dd') // "2024-01-15"

// Relative time
DateUtils.formatRelative('2024-01-15T08:30:00Z') // "2 hours ago"

// Check dates
DateUtils.isPast('2024-01-01') // true
DateUtils.isFuture('2025-01-01') // true
```

## Examples

### Complete Subscription Management Page

```tsx
'use client'

import {
  useSubscriptions,
  useUpdateSubscription,
  useCancelSubscription,
  useSubscriptionPreview
} from '@billingos/sdk'

export default function SubscriptionsPage() {
  const { data, isLoading } = useSubscriptions({ customer_id: 'cus_123' })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Your Subscriptions</h1>
      {data?.data.map(subscription => (
        <SubscriptionCard key={subscription.id} subscription={subscription} />
      ))}
    </div>
  )
}

function SubscriptionCard({ subscription }) {
  const updateSubscription = useUpdateSubscription(subscription.id)
  const cancelSubscription = useCancelSubscription(subscription.id)
  const { data: preview } = useSubscriptionPreview(subscription.id, {
    price_id: 'price_pro_plan'
  })

  const handleUpgrade = () => {
    if (confirm(`Upgrade for $${preview?.proration_amount / 100}?`)) {
      updateSubscription.mutate({ price_id: 'price_pro_plan' })
    }
  }

  const handleCancel = () => {
    if (confirm('Cancel subscription?')) {
      cancelSubscription.mutate({ immediately: false })
    }
  }

  return (
    <div className="border p-4 rounded-lg">
      <h2>Status: {subscription.status}</h2>
      <p>Period: {subscription.current_period_start} - {subscription.current_period_end}</p>

      <div className="mt-4 flex gap-2">
        <button onClick={handleUpgrade}>Upgrade</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  )
}
```

### Feature Gating

```tsx
'use client'

import { useHasFeature } from '@billingos/sdk'

export default function DashboardPage() {
  const hasAnalytics = useHasFeature('cus_123', 'advanced_analytics')
  const hasExport = useHasFeature('cus_123', 'data_export')

  return (
    <div>
      <h1>Dashboard</h1>

      {hasAnalytics ? (
        <AdvancedAnalytics />
      ) : (
        <UpgradePrompt feature="Advanced Analytics" />
      )}

      {hasExport && <ExportButton />}
    </div>
  )
}
```

### Usage Tracking

```tsx
'use client'

import { useTrackUsage, useUsageMetrics } from '@billingos/sdk'

export default function APICallButton() {
  const trackUsage = useTrackUsage()
  const { data: metrics } = useUsageMetrics('cus_123', 'api_calls')

  const handleAPICall = async () => {
    try {
      // Make API call
      await fetch('/api/data')

      // Track usage
      trackUsage.mutate({
        customer_id: 'cus_123',
        feature_key: 'api_calls',
        quantity: 1
      })
    } catch (error) {
      console.error('API call failed:', error)
    }
  }

  return (
    <div>
      <p>Usage: {metrics?.current_usage} / {metrics?.limit} calls</p>
      <button onClick={handleAPICall}>Make API Call</button>
    </div>
  )
}
```

## Error Handling

The SDK includes typed error classes for better error handling:

```tsx
import {
  isValidationError,
  isUnauthorizedError,
  isNotFoundError
} from '@billingos/sdk'

try {
  await client.getSubscription('sub_123')
} catch (error) {
  if (isUnauthorizedError(error)) {
    console.error('Invalid API key')
  } else if (isNotFoundError(error)) {
    console.error('Subscription not found')
  } else if (isValidationError(error)) {
    console.error('Validation failed:', error.data)
  }
}
```

## TypeScript

The SDK is built with TypeScript and includes full type definitions.

```tsx
import type {
  Subscription,
  Customer,
  Entitlement,
  CreateSubscriptionInput,
  UpdateSubscriptionInput
} from '@billingos/sdk'

const subscription: Subscription = {
  id: 'sub_123',
  customer_id: 'cus_123',
  price_id: 'price_pro',
  status: 'active',
  // ... other fields
}
```

## Next.js Integration

### App Router

```tsx
// app/layout.tsx
import { BillingOSProvider } from '@billingos/sdk'
import '@billingos/sdk/styles.css'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <BillingOSProvider apiKey={process.env.NEXT_PUBLIC_BILLINGOS_API_KEY}>
          {children}
        </BillingOSProvider>
      </body>
    </html>
  )
}

// app/subscriptions/page.tsx
'use client'

import { useSubscriptions } from '@billingos/sdk'

export default function SubscriptionsPage() {
  const { data } = useSubscriptions()
  return <div>{/* ... */}</div>
}
```

### Pages Router

```tsx
// pages/_app.tsx
import { BillingOSProvider } from '@billingos/sdk'
import '@billingos/sdk/styles.css'

export default function App({ Component, pageProps }) {
  return (
    <BillingOSProvider apiKey={process.env.NEXT_PUBLIC_BILLINGOS_API_KEY}>
      <Component {...pageProps} />
    </BillingOSProvider>
  )
}

// pages/subscriptions.tsx
import { useSubscriptions } from '@billingos/sdk'

export default function SubscriptionsPage() {
  const { data } = useSubscriptions()
  return <div>{/* ... */}</div>
}
```

## Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## License

MIT

## Support

- Documentation: https://docs.billingos.com
- Issues: https://github.com/billingos/sdk/issues
- Email: support@billingos.com
