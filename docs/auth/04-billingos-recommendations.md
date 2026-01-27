# BillingOS SDK Authentication - Recommended Approaches

**Date:** January 24, 2025
**Based on:** Clerk, Useautumn, Kinde, Better Auth analysis

---

## Executive Summary

After analyzing industry-leading auth and billing tools, we recommend a **hybrid approach** that combines:

1. **Supabase-specific auto-config** (zero setup for primary users)
2. **Generic catch-all handler** (flexibility for other auth providers)
3. **Optional middleware pattern** (for advanced use cases)

This balances **simplicity** (like Clerk) with **flexibility** (like Useautumn).

---

## Option A: Supabase Auto-Config (Recommended for MVP)

**Target:** Developers using Supabase Auth
**Setup Time:** < 5 minutes
**Files:** 2 files, ~10 lines

### Installation

```bash
npm install @billingos/supabase @billingos/react
```

### Setup

#### File 1: `app/api/billingos/[...all]/route.ts`

```typescript
import { billingosHandler } from '@billingos/supabase';

export const { GET, POST } = billingosHandler();
// That's it! Auto-detects Supabase auth
```

**What it does automatically:**
- ✅ Calls `createClient()` from `@supabase/ssr`
- ✅ Extracts user with `supabase.auth.getUser()`
- ✅ Checks `x-organization-id` header for B2B
- ✅ Validates membership in `user_organizations` table
- ✅ Returns `externalId` (user.id or org.id)

#### File 2: `app/layout.tsx`

```typescript
import { BillingOSProvider } from '@billingos/react';

export default function RootLayout({ children }) {
  return (
    <BillingOSProvider apiUrl="/api/billingos">
      {children}
    </BillingOSProvider>
  );
}
```

### Usage

```typescript
import { useBilling } from '@billingos/react';

export function Dashboard() {
  const { subscription, hasFeature } = useBilling();

  return (
    <div>
      <h1>Plan: {subscription?.plan}</h1>
      {hasFeature('advanced-analytics') && <AnalyticsDashboard />}
    </div>
  );
}
```

### Customization (Optional)

```typescript
export const { GET, POST } = billingosHandler({
  // Override defaults if needed
  organizationTable: 'organizations', // default: 'user_organizations'
  onUnauthorized: (error) => {
    return new Response('Unauthorized', { status: 401 });
  },
});
```

---

## Option B: Generic Handler (For Other Auth Providers)

**Target:** Developers using Clerk, Kinde, Auth.js, custom auth
**Setup Time:** ~10 minutes
**Files:** 2 files, ~30 lines

### Installation

```bash
npm install @billingos/nextjs @billingos/react
```

### Setup

#### File 1: `app/api/billingos/[...all]/route.ts`

```typescript
import { billingosHandler } from '@billingos/nextjs';
import { currentUser } from '@clerk/nextjs/server'; // Or your auth

export const { GET, POST } = billingosHandler({
  auth: async (request) => {
    // Your auth logic here
    const user = await currentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // For B2C
    return {
      externalId: user.id,
      organizationId: null,
    };

    // For B2B (check header for org context)
    const orgId = request.headers.get('x-organization-id');
    if (orgId) {
      // Verify user belongs to org
      const membership = await checkMembership(user.id, orgId);
      if (!membership) throw new Error('Not authorized');

      return {
        externalId: orgId,
        organizationId: orgId,
      };
    }
  },
});
```

#### File 2: `app/layout.tsx`

```typescript
import { BillingOSProvider } from '@billingos/react';

export default function RootLayout({ children }) {
  return (
    <BillingOSProvider apiUrl="/api/billingos">
      {children}
    </BillingOSProvider>
  );
}
```

---

## Option C: Middleware Pattern (Advanced)

**Target:** Zero route files, maximum magic
**Setup Time:** ~5 minutes
**Files:** 2 files, ~15 lines

### Installation

```bash
npm install @billingos/nextjs @billingos/react
```

### Setup

#### File 1: `middleware.ts`

```typescript
import { billingosMiddleware } from '@billingos/nextjs';
import { createClient } from '@/lib/supabase/middleware';

export default billingosMiddleware({
  auth: async (request) => {
    const supabase = createClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return {
      externalId: user.id,
      organizationId: null,
    };
  },
  routes: {
    billing: '/api/billingos', // BillingOS will handle all /api/billingos/* routes
  },
});

export const config = {
  matcher: ['/api/billingos/:path*'],
};
```

#### File 2: `app/layout.tsx`

```typescript
import { BillingOSProvider } from '@billingos/react';

export default function RootLayout({ children }) {
  return (
    <BillingOSProvider apiUrl="/api/billingos">
      {children}
    </BillingOSProvider>
  );
}
```

**Note:** No `/api/billingos/[...all]/route.ts` file needed - middleware handles it!

---

## Comparison of Options

| Option | Files | Lines | Auth Support | Complexity | Magic |
|--------|-------|-------|--------------|------------|-------|
| **A: Supabase** | 2 | ~10 | Supabase only | ⭐ Easiest | ⭐⭐⭐⭐⭐ |
| **B: Generic** | 2 | ~30 | Any | ⭐⭐ Easy | ⭐⭐⭐⭐ |
| **C: Middleware** | 2 | ~15 | Any | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ |

---

## Implementation Priority

### Phase 1 (MVP): Option A + Option B

Build both patterns:

1. **`@billingos/supabase`** - Zero-config for Supabase users
2. **`@billingos/nextjs`** - Generic handler for all others

This covers 90% of use cases with simple setup.

### Phase 2: Option C

Add middleware pattern for developers who want Clerk-style magic.

### Phase 3: Framework-Specific Integrations

Add pre-built integrations:
- `@billingos/clerk` - Auto-config for Clerk
- `@billingos/kinde` - Auto-config for Kinde
- `@billingos/auth-js` - Auto-config for Auth.js

---

## Frontend Components

All options use the same React components:

### Core Hooks

```typescript
import { useBilling, useCustomer } from '@billingos/react';

const { subscription, hasFeature, trackUsage } = useBilling();
const { customer, loading } = useCustomer();
```

### UI Components

```typescript
import {
  PricingTable,
  SubscriptionPortal,
  FeatureGate
} from '@billingos/components';

<PricingTable products={products} onSelectPlan={handleUpgrade} />
<SubscriptionPortal />
<FeatureGate featureKey="advanced-analytics" fallback={<UpgradePrompt />}>
  <AnalyticsDashboard />
</FeatureGate>
```

---

## Security Model

### Backend Requirements

All patterns require backend route because:

1. **API Key Protection** - Secret keys never exposed to frontend
2. **Customer Validation** - Verify user owns billing record
3. **Session Scoping** - Prevent users accessing other customers' data
4. **Token Generation** - Short-lived tokens reduce attack surface
5. **Audit Trail** - Server-side logging of billing access

### Request Flow

```
Frontend (React)
    ↓ fetch('/api/billingos/subscription')
Merchant Backend (Next.js route)
    ↓ Validate user session
    ↓ Extract user/org ID
    ↓ Call BillingOS API with secret key
BillingOS Backend
    ↓ Validate API key
    ↓ Lookup customer by external_id
    ↓ Return billing data scoped to customer
Merchant Backend
    ↓ Return data to frontend
Frontend
    ✓ Display billing info
```

### Customer ID Strategy

Use **merchant's own IDs** (external_id):
- ✅ No customer ID sync needed
- ✅ Simpler integration
- ✅ Works with any auth provider
- ✅ Real-time data without webhooks

**Example:**
```typescript
// BillingOS API call
GET /customers/external/user_2abc123?organization_id=org_xyz
Authorization: Bearer sk_live_...

// BillingOS looks up:
SELECT * FROM customers
WHERE external_id = 'user_2abc123'
  AND organization_id = 'org_xyz'
  AND deleted_at IS NULL
```

---

## Developer Experience Goals

### 5-Minute Setup (Supabase)

```bash
# 1. Install
npm install @billingos/supabase @billingos/react

# 2. Create route (copy-paste)
# app/api/billingos/[...all]/route.ts
import { billingosHandler } from '@billingos/supabase';
export const { GET, POST } = billingosHandler();

# 3. Wrap app (copy-paste)
# app/layout.tsx
import { BillingOSProvider } from '@billingos/react';
<BillingOSProvider>{children}</BillingOSProvider>

# 4. Use in components
import { useBilling } from '@billingos/react';
const { hasFeature } = useBilling();
```

**Total:** 2 files, 10 lines, 5 minutes

### 10-Minute Setup (Other Auth)

Add `auth` callback to extract user from your auth system.

**Total:** 2 files, 30 lines, 10 minutes

---

## Next Steps

1. Build `@billingos/node` - Core SDK
2. Build `@billingos/nextjs` - Generic handler
3. Build `@billingos/supabase` - Auto-config for Supabase
4. Build `@billingos/react` - React hooks and provider
5. Build `@billingos/components` - UI components
6. Create example apps for each pattern
7. Write documentation and quickstart guides

---

## Success Metrics

✅ Supabase users: < 5 min setup
✅ Other auth users: < 10 min setup
✅ Zero webhooks required for basic integration
✅ Type-safe TypeScript experience
✅ Pre-built UI components
✅ Works with any auth provider
✅ Feature parity with Flowglad/Autumn
