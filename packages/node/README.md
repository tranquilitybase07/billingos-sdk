# @billingos/node

Server-side Node.js SDK for [BillingOS](https://billingos.dev). Create session tokens, manage customers, subscriptions, track usage, and check entitlements from your backend.

## Installation

```bash
npm install @billingos/node
# or
pnpm add @billingos/node
```

## Quick Start

```typescript
import { BillingOS } from '@billingos/node'

const billing = new BillingOS({
  secretKey: process.env.BILLINGOS_SECRET_KEY!, // sk_live_... or sk_test_...
})
```

### Create a session token endpoint

The most common use case — create a session token for your frontend SDK:

```typescript
// Next.js App Router example
import { BillingOS } from '@billingos/node'

const billing = new BillingOS({
  secretKey: process.env.BILLINGOS_SECRET_KEY!,
})

export async function POST(req: Request) {
  const { userId } = await req.json()

  const { sessionToken, expiresAt } = await billing.createSessionToken({
    externalUserId: userId,
    expiresIn: 3600, // 1 hour (default)
  })

  return Response.json({ sessionToken, expiresAt })
}
```

## API Reference

### Session Tokens

```typescript
// Create a session token
const { sessionToken, expiresAt } = await billing.createSessionToken({
  externalUserId: 'user_123',
  externalOrganizationId: 'org_456', // optional, for B2B
  expiresIn: 3600,                    // optional, 60-86400 seconds
})

// Revoke a session token
await billing.revokeSessionToken('tok_abc123')
```

### Customers

```typescript
// Create a customer
const customer = await billing.createCustomer({
  externalUserId: 'user_123',
  email: 'user@example.com',
  name: 'Jane Smith',
})

// Get customer by ID
const customer = await billing.getCustomer('cus_abc123')

// Get customer by your user ID
const customer = await billing.getCustomerByExternalId('user_123')

// Update a customer
const updated = await billing.updateCustomer('cus_abc123', {
  email: 'new@example.com',
})

// Delete a customer
await billing.deleteCustomer('cus_abc123')
```

### Subscriptions

```typescript
// Create a subscription
const subscription = await billing.createSubscription({
  customerId: 'cus_abc123',
  priceId: 'price_pro_monthly',
})

// Get a subscription
const subscription = await billing.getSubscription('sub_xyz')

// Update a subscription (e.g., change plan)
const updated = await billing.updateSubscription('sub_xyz', {
  priceId: 'price_enterprise_monthly',
})

// Cancel a subscription (at period end)
const cancelled = await billing.cancelSubscription('sub_xyz')

// Reactivate a cancelled subscription
const reactivated = await billing.reactivateSubscription('sub_xyz')
```

### Usage Tracking

```typescript
// Track usage
const result = await billing.trackUsage({
  customerId: 'user_123',
  featureKey: 'api_calls',
  quantity: 1,
  idempotencyKey: 'req_abc123', // optional, for deduplication
})

// Check entitlement
const entitlement = await billing.checkEntitlement('user_123', 'api_calls')
if (entitlement.has_access) {
  // Allow the action
}

// Get usage metrics
const metrics = await billing.getUsageMetrics('user_123', 'api_calls')
```

## Auto-Environment Detection

The SDK automatically routes to the correct API based on your key prefix:

| Key prefix | Environment | API URL |
|------------|-------------|---------|
| `sk_test_*` | Sandbox | `sandbox-api.billingos.dev` |
| `sk_live_*` | Production | `api.billingos.dev` |

Override with `apiUrl` or the `BILLINGOS_API_URL` env var if needed.

## Configuration

```typescript
const billing = new BillingOS({
  secretKey: 'sk_live_...',  // required
  apiUrl: 'https://...',     // optional override
  timeout: 30000,            // request timeout in ms (default: 30000)
  maxRetries: 3,             // retry failed requests (default: 3)
})
```

## Error Handling

```typescript
import { BillingOS, ValidationError, NotFoundError, AuthenticationError } from '@billingos/node'

try {
  await billing.createSessionToken({ externalUserId: '' })
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message)
  } else if (error instanceof AuthenticationError) {
    console.error('Bad API key')
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found')
  }
}
```

## License

MIT
