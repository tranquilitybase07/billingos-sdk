# @billingos/sdk

React SDK for [BillingOS](https://billingos.dev) — drop-in billing UI components for SaaS apps. Pricing tables, customer portals, checkout, feature gating, and usage metering — all powered by your BillingOS dashboard.

## Installation

```bash
npm install @billingos/sdk @tanstack/react-query
# or
pnpm add @billingos/sdk @tanstack/react-query
```

## Quick Start

### 1. Create a product

Head to your [BillingOS Dashboard](https://app.billingos.dev) and create a product with pricing and features.

### 2. Create an API key

Go to **Settings > API Keys** and generate a secret key (`sk_live_...` or `sk_test_...`).

### 3. Add a backend endpoint

Use [`@billingos/node`](./packages/node) to create a session token endpoint:

```typescript
// app/api/billingos-session/route.ts (Next.js example)
import { BillingOS } from '@billingos/node'

const billing = new BillingOS({
  secretKey: process.env.BILLINGOS_SECRET_KEY!,
})

export async function POST(req: Request) {
  const { userId } = await req.json()

  const { sessionToken, expiresAt } = await billing.createSessionToken({
    externalUserId: userId,
  })

  return Response.json({ sessionToken, expiresAt })
}
```

### 4. Wrap your app with the provider

```tsx
import { BillingOSProvider } from '@billingos/sdk'

export default function App({ children }) {
  return (
    <BillingOSProvider sessionTokenUrl="/api/billingos-session">
      {children}
    </BillingOSProvider>
  )
}
```

That's it. Now use any component or hook in your app.

## Components

### PricingTable

Renders your products as a pricing page with interval toggle, feature comparison, and built-in checkout.

```tsx
import { PricingTable } from '@billingos/sdk'

<PricingTable
  showIntervalToggle={true}
  defaultInterval="month"
  onPlanChanged={(subscription) => console.log('Subscribed!', subscription)}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `planIds` | `string[]` | Filter to specific product IDs |
| `showIntervalToggle` | `boolean` | Show monthly/yearly toggle (default: `true`) |
| `defaultInterval` | `'month' \| 'year'` | Default billing interval |
| `onSelectPlan` | `(priceId: string) => void` | Custom handler (bypasses built-in checkout) |
| `onPlanChanged` | `(subscription) => void` | Called after successful checkout |
| `customer` | `{ email?, name? }` | Prefill customer info in checkout |
| `compact` | `boolean` | Render cards only, no wrapper |
| `footerText` | `string \| null` | Footer note (null to hide) |

### CustomerPortal

Self-service billing portal — subscriptions, invoices, payment methods, plan changes.

```tsx
import { CustomerPortal } from '@billingos/sdk'

<CustomerPortal
  mode="drawer"       // 'drawer' | 'modal' | 'page'
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `'drawer' \| 'modal' \| 'page'` | Display mode (default: `'drawer'`) |
| `isOpen` | `boolean` | Open/close state (drawer/modal modes) |
| `onClose` | `() => void` | Close callback |
| `defaultTab` | `'subscription' \| 'invoices' \| 'payment' \| 'settings'` | Default tab |
| `onSubscriptionUpdate` | `(subscription) => void` | Subscription changed |
| `onSubscriptionCancel` | `() => void` | Subscription cancelled |

### CheckoutModal

Iframe-based checkout dialog. Used automatically by PricingTable, or use standalone:

```tsx
import { CheckoutModal } from '@billingos/sdk'

<CheckoutModal
  open={isOpen}
  onOpenChange={setIsOpen}
  priceId="price_abc123"
  customer={{ email: 'user@example.com' }}
  onSuccess={(subscription) => console.log('Done!', subscription)}
/>
```

### FeatureGate

Conditionally render UI based on feature entitlements:

```tsx
import { FeatureGate } from '@billingos/sdk'

<FeatureGate
  feature="advanced_analytics"
  fallback={<UpgradePrompt feature="advanced_analytics" />}
>
  <AnalyticsDashboard />
</FeatureGate>
```

### UpgradeNudge

Displays an upgrade prompt when usage approaches a threshold:

```tsx
import { UpgradeNudge } from '@billingos/sdk'

<UpgradeNudge
  feature="api_calls"
  threshold={80}
  onUpgradeClick={() => setShowPricing(true)}
/>
```

## Hooks

### Feature Gating

```tsx
import { useHasFeature, useFeature, useEntitlements } from '@billingos/sdk'

// Simple boolean check
const { hasAccess, isLoading } = useHasFeature('advanced_analytics')

// Full feature details (access, usage, limits)
const { data } = useFeature('api_calls')

// All entitlements for current customer
const { data } = useEntitlements()
```

### Usage Tracking

```tsx
import { useTrackUsage, useUsageMetrics } from '@billingos/sdk'

// Track usage events
const track = useTrackUsage()
track.mutate({ featureKey: 'api_calls', quantity: 1 })

// Read usage metrics
const { data } = useUsageMetrics('api_calls')
```

### Subscriptions

```tsx
import { useSubscription } from '@billingos/sdk'

const { data: subscription, isLoading } = useSubscription()
```

## Theming

Customize appearance via the provider:

```tsx
<BillingOSProvider
  sessionTokenUrl="/api/billingos-session"
  appearance={{
    theme: 'dark', // 'light' | 'dark' | 'auto'
    light: {
      colorPrimary: '#2563eb',
      borderRadius: '12px',
    },
    dark: {
      colorPrimary: '#3b82f6',
    },
  }}
>
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `react` | `^18.0.0 \|\| ^19.0.0` |
| `react-dom` | `^18.0.0 \|\| ^19.0.0` |
| `@tanstack/react-query` | `^5.90.0` |

## Environment Detection

The SDK auto-detects your environment from the session token:

- `bos_session_live_*` -> Production API
- `bos_session_test_*` -> Sandbox API

No URL configuration needed.

## License

MIT
