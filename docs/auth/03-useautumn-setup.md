# Useautumn Setup (Billing-Specific Pattern)

**Pattern:** Catch-All Route with Dashboard Config
**Files:** 2 files
**Code:** ~30 lines
**Magic Level:** ⭐⭐⭐⭐

---

## Installation

```bash
npm install autumn-js
```

---

## Setup Files

### File 1: `app/api/autumn/[...all]/route.ts`

```typescript
import { autumnHandler } from "autumn-js/next";
import { auth } from "@/lib/auth"; // Your existing auth

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    // Extract user from YOUR auth system
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    return {
      customerId: session.user.id, // YOUR user ID
      customerData: {
        name: session.user.name,
        email: session.user.email,
      },
    };
  },
});
```

**What this handles:**
- `/api/autumn/subscription` - Get subscription
- `/api/autumn/features` - Check feature access
- `/api/autumn/usage` - Track usage
- `/api/autumn/checkout` - Create checkout session

All in ONE file via catch-all `[...all]` route!

---

### File 2: `app/layout.tsx`

```typescript
import { AutumnProvider } from "autumn-js/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AutumnProvider>
          {children}
        </AutumnProvider>
      </body>
    </html>
  );
}
```

---

## Usage Examples

### Check Feature Access

```typescript
'use client';
import { useCustomer } from "autumn-js/react";

export function ChatComponent() {
  const { customer, allowed, refetch } = useCustomer();

  const handleSendMessage = async () => {
    if (allowed({ featureId: "messages" })) {
      await sendMessage();
      await refetch(); // Update usage balance

      const remaining = customer?.features.messages?.balance;
      console.log(`Messages remaining: ${remaining}`);
    } else {
      alert("You're out of messages. Upgrade to send more!");
    }
  };

  return <button onClick={handleSendMessage}>Send</button>;
}
```

### Create Checkout Session

```typescript
'use client';
import { autumn } from "autumn-js";

export function UpgradeButton() {
  const handleUpgrade = async () => {
    const result = await autumn.checkout({
      planId: 'pro-plan',
      customerId: 'user_123',
    });

    if (result.url) {
      window.location.href = result.url; // Redirect to Stripe
    }
  };

  return <button onClick={handleUpgrade}>Upgrade to Pro</button>;
}
```

### Display Current Plan

```typescript
'use client';
import { useCustomer } from "autumn-js/react";

export function CurrentPlan() {
  const { customer, loading } = useCustomer();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Current Plan: {customer?.plan?.name}</h2>
      <p>Status: {customer?.subscription?.status}</p>
    </div>
  );
}
```

---

## Dashboard Configuration

### The Magic: Zero Env Vars in Code

Everything configured via Autumn dashboard:

**Products & Pricing:**
- Create products (Free, Pro, Enterprise)
- Define pricing tiers
- Set billing intervals (monthly, yearly)

**Features:**
- Define feature flags
- Set usage limits
- Configure metering

**Integrations:**
- Connect Stripe account
- Generate API keys
- Webhook configuration

**No code changes needed** - Update pricing without deployments!

---

## Integration with Different Auth Providers

### With Better Auth

```typescript
import { autumnHandler } from "autumn-js/next";
import { auth } from "@/lib/auth";

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return {
      customerId: session?.user.id,
      customerData: {
        name: session?.user.name,
        email: session?.user.email,
      },
    };
  },
});
```

### With Clerk

```typescript
import { autumnHandler } from "autumn-js/next";
import { currentUser } from "@clerk/nextjs/server";

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    const user = await currentUser();

    if (!user) throw new Error('Not authenticated');

    return {
      customerId: user.id,
      customerData: {
        name: user.firstName + ' ' + user.lastName,
        email: user.emailAddresses[0].emailAddress,
      },
    };
  },
});
```

### With Supabase

```typescript
import { autumnHandler } from "autumn-js/next";
import { createClient } from "@/lib/supabase/server";

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    return {
      customerId: user.id,
      customerData: {
        name: user.user_metadata.name,
        email: user.email,
      },
    };
  },
});
```

---

## B2B vs B2C Usage

### B2C (User-Level Billing)

```typescript
export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    const session = await getSession(request);

    return {
      customerId: session.user.id, // Bill per user
      customerData: {
        name: session.user.name,
        email: session.user.email,
      },
    };
  },
});
```

### B2B (Organization-Level Billing)

```typescript
export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    const session = await getSession(request);
    const orgId = request.headers.get('x-organization-id');

    if (orgId) {
      // Verify user belongs to org
      const membership = await checkMembership(session.user.id, orgId);
      if (!membership) throw new Error('Not authorized');

      return {
        customerId: orgId, // Bill per organization
        customerData: {
          name: membership.organization.name,
          email: membership.organization.billingEmail,
        },
      };
    }

    // Fallback to user-level
    return {
      customerId: session.user.id,
      customerData: {
        name: session.user.name,
        email: session.user.email,
      },
    };
  },
});
```

---

## Pros & Cons

### Pros ✅

- **Simple setup** - Only 2 files
- **Auth agnostic** - Works with any auth provider
- **Dashboard config** - No env vars in code
- **Open source** - Can self-host (Apache 2.0)
- **No webhooks required** - Query for data when needed
- **Clear patterns** - B2C, B2B, or hybrid

### Cons ❌

- **Requires route file** - Not fully automatic like Clerk
- **Less documentation** - Newer tool, smaller community
- **Manual identify function** - Must write auth extraction logic
- **Not pure frontend** - Still needs backend route

---

## When to Use Useautumn Pattern

✅ **Use if:**
- You want flexibility with auth providers
- You prefer dashboard configuration
- You're building billing/subscription features
- You value open-source options

❌ **Don't use if:**
- You want zero route files (use Clerk pattern)
- You need extensive documentation
- You prefer everything in code (not dashboard)

---

## For BillingOS SDK

**Learnings:**
- Single catch-all route is clean pattern
- `identify` callback gives flexibility
- Dashboard config reduces code in repos
- Works seamlessly with any auth provider

**Application:**
- Use catch-all route pattern (`/api/billingos/[...all]`)
- Provide `identify` callback for auth integration
- Consider dashboard for product/pricing config
- Support both B2C and B2B use cases
