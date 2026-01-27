# Phase 2: Node SDK + Session Token Architecture - Implementation Plan

**Status:** In Progress
**Start Date:** 2026-01-26
**Target Completion:** 3 weeks

---

## Overview

Build a complete SDK ecosystem for session token-based authentication:

1. **@billingos/node** - Backend SDK for creating session tokens (framework-agnostic)
2. **@billingos/supabase** - Supabase helper for one-line setup
3. **Update @billingos/sdk** - React SDK to work with session tokens

## Architecture Decision

**Package Structure:** Separate packages in monorepo
- ✅ `@billingos/node` - Server-side SDK
- ✅ `@billingos/supabase` - Supabase integration
- ✅ `@billingos/sdk` - Existing React SDK (update for session tokens)

**Authentication Flow:** Session Token Architecture
- Backend uses secret key (`sk_live_*`) to create session tokens
- Frontend uses short-lived session tokens
- Most secure pattern (matches Stripe)

**Auth Providers Priority:**
1. Supabase (dogfooding)
2. Generic/Custom (works with any auth)

**Backend Framework:** Framework-agnostic
- Works with Express, Fastify, NestJS, Hono, etc.
- Pure Node.js with no framework dependencies

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Merchant's Next.js App                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Frontend (React)                                         │
│ ┌────────────────────────────────────────────────────┐  │
│ │ import { BillingOSProvider } from '@billingos/sdk' │  │
│ │                                                     │  │
│ │ <BillingOSProvider                                 │  │
│ │   sessionTokenUrl="/api/billingos-session"         │  │
│ │ >                                                   │  │
│ │   <Dashboard />                                    │  │
│ │ </BillingOSProvider>                               │  │
│ └────────────────────────────────────────────────────┘  │
│                    ↑ (fetch session token)               │
│                    │                                     │
│ Backend (API Route)                                      │
│ ┌────────────────────────────────────────────────────┐  │
│ │ import { billingos } from '@billingos/supabase'    │  │
│ │                                                     │  │
│ │ export const GET = billingos.createSessionRoute(); │  │
│ │ // Auto-detects Supabase auth, creates token      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
                     │ POST /v1/session-tokens
                     │ Authorization: Bearer sk_live_*
                     ↓
┌─────────────────────────────────────────────────────────┐
│ BillingOS API (NestJS Backend)                          │
│ POST /v1/session-tokens                                 │
│ - Validates API key                                     │
│ - Creates signed session token (HMAC-SHA256)            │
│ - Returns: { sessionToken, expiresAt }                  │
└─────────────────────────────────────────────────────────┘
```

---

## Package 1: @billingos/node

### Location
`/Users/ankushkumar/Code/billingos-sdk/packages/node/`

### Structure
```
packages/node/
├── src/
│   ├── client/
│   │   ├── billingos.ts          # Main BillingOS class
│   │   ├── session-tokens.ts     # Session token methods
│   │   ├── webhooks.ts            # Webhook verification
│   │   └── api-client.ts          # HTTP client (fetch-based)
│   ├── helpers/
│   │   └── generic.ts             # Generic auth helper
│   ├── types/
│   │   ├── index.ts               # All TypeScript types
│   │   ├── session-tokens.ts      # Session token types
│   │   └── webhooks.ts            # Webhook types
│   ├── utils/
│   │   ├── crypto.ts              # HMAC verification
│   │   └── errors.ts              # Error classes
│   └── index.ts                   # Main export
├── tests/
│   ├── client.test.ts
│   ├── session-tokens.test.ts
│   └── webhooks.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Core API

```typescript
// Initialize client
import { BillingOS } from '@billingos/node';

const billing = new BillingOS({
  secretKey: process.env.BILLINGOS_SECRET_KEY, // sk_live_*
  apiUrl: 'http://localhost:3001', // Optional
});

// Create session token (primary use case)
const { sessionToken, expiresAt } = await billing.createSessionToken({
  externalUserId: user.id,
  externalOrganizationId: org?.id, // Optional for B2B
  expiresIn: 3600, // 1 hour (default)
  allowedOperations: ['read_subscription'], // Optional scoping
  metadata: { ip: req.ip }, // Optional
});

// Webhook verification
const isValid = billing.verifyWebhook(
  req.body,
  req.headers['billingos-signature']
);

// Direct API calls (backend-only operations)
const customer = await billing.customers.create({
  externalUserId: user.id,
  email: user.email,
});
```

### Key Features
- ✅ Framework-agnostic (Express, Fastify, NestJS, Hono)
- ✅ Session token creation (primary use case)
- ✅ Webhook verification with HMAC
- ✅ Full API client for backend operations
- ✅ TypeScript-first with complete type safety
- ✅ Error handling with typed errors
- ✅ Automatic retries with exponential backoff
- ✅ Request timeout (30s default, configurable)

### TypeScript Types
```typescript
export interface BillingOSConfig {
  secretKey: string;
  apiUrl?: string;
  timeout?: number;
}

export interface CreateSessionTokenInput {
  externalUserId: string;
  externalOrganizationId?: string;
  expiresIn?: number; // seconds, default 3600, max 86400
  allowedOperations?: string[];
  metadata?: Record<string, any>;
}

export interface SessionTokenResponse {
  sessionToken: string;
  expiresAt: Date;
}
```

---

## Package 2: @billingos/supabase

### Location
`/Users/ankushkumar/Code/billingos-sdk/packages/supabase/`

### Structure
```
packages/supabase/
├── src/
│   ├── middleware/
│   │   ├── create-session-route.ts   # Route factory (App Router)
│   │   ├── create-session-handler.ts # Handler factory (Pages Router)
│   │   └── extract-user.ts           # Supabase user extraction
│   ├── utils/
│   │   └── supabase-client.ts        # Supabase client helpers
│   ├── types/
│   │   └── index.ts                  # TypeScript types
│   └── index.ts                      # Main export
├── tests/
│   └── middleware.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Core API

**3-minute setup (Next.js App Router):**
```typescript
// app/api/billingos-session/route.ts
import { billingos } from '@billingos/supabase';

export const GET = billingos.createSessionRoute();
// That's it! Auto-detects Supabase auth
```

**Pages Router:**
```typescript
// pages/api/billingos-session.ts
import { billingos } from '@billingos/supabase';

export default billingos.createSessionHandler();
```

**Custom configuration:**
```typescript
export const GET = billingos.createSessionRoute({
  expiresIn: 7200, // 2 hours
  allowedOperations: ['read_subscription'],

  // Optional: Custom user extraction
  extractUserId: async (req) => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  },

  // Optional: Custom organization extraction (B2B)
  extractOrganizationId: async (req) => {
    return req.headers.get('x-organization-id');
  },
});
```

### Key Features
- ✅ One-line setup for Supabase users
- ✅ Auto-detects Supabase auth from cookies/headers
- ✅ Works with both App Router and Pages Router
- ✅ TypeScript-first
- ✅ Error handling (returns 401 if not authenticated)
- ✅ Supports B2C and B2B patterns

---

## Package 3: Updates to @billingos/sdk

### 1. Add Session Token Support to BillingOSProvider

**File:** `src/providers/BillingOSProvider.tsx`

**New props:**
```typescript
interface BillingOSProviderProps {
  // NEW: Session token support (recommended)
  sessionTokenUrl?: string;    // Auto-fetches from endpoint
  sessionToken?: string;        // Manual token

  // LEGACY: Direct API key (less secure)
  apiKey?: string;

  // Other props
  customerId?: string;
  organizationId?: string;
  children: React.ReactNode;
}
```

**Usage:**
```typescript
// Recommended: Auto-fetch session token
<BillingOSProvider sessionTokenUrl="/api/billingos-session">
  <App />
</BillingOSProvider>

// Or: Provide token manually
<BillingOSProvider sessionToken={token}>
  <App />
</BillingOSProvider>

// Legacy: Direct API key
<BillingOSProvider apiKey="pk_live_...">
  <App />
</BillingOSProvider>
```

### 2. Add Session Token Hook

**New file:** `src/hooks/useSessionToken.ts`

```typescript
export function useSessionToken(tokenUrl?: string) {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  // Fetch initial token
  const fetchToken = async () => {
    const response = await fetch(tokenUrl);
    const { sessionToken, expiresAt } = await response.json();
    setToken(sessionToken);
    setExpiresAt(new Date(expiresAt));
  };

  // Auto-refresh 5 minutes before expiry
  useEffect(() => {
    if (!expiresAt) return;

    const msUntilExpiry = expiresAt.getTime() - Date.now();
    const refreshAt = msUntilExpiry - 5 * 60 * 1000;

    if (refreshAt > 0) {
      const timer = setTimeout(fetchToken, refreshAt);
      return () => clearTimeout(timer);
    }
  }, [expiresAt]);

  return { token, expiresAt, refresh: fetchToken };
}
```

### 3. Update BillingOSClient

**File:** `src/client/index.ts`

**Changes:**
```typescript
private getAuthHeader(): string {
  // Session token takes precedence (most secure)
  if (this.sessionToken) {
    return `Bearer ${this.sessionToken}`;
  }
  // Fallback to API key (legacy)
  return `Bearer ${this.apiKey}`;
}
```

---

## Generic Auth Helper (in @billingos/node)

**File:** `packages/node/src/helpers/generic.ts`

**Usage with any auth provider:**
```typescript
// app/api/billingos-session/route.ts
import { createSessionRoute } from '@billingos/node/helpers/generic';
import { getUser } from '@/lib/auth'; // Your auth

export const GET = createSessionRoute(
  {
    secretKey: process.env.BILLINGOS_SECRET_KEY!,
    expiresIn: 3600,
  },
  async (req) => {
    const user = await getUser(req);

    if (!user) {
      throw new Error('Unauthorized');
    }

    return {
      userId: user.id,
      organizationId: user.orgId, // Optional for B2B
    };
  }
);
```

---

## Implementation Timeline

### Week 1: @billingos/node Core (Days 1-5)

**Day 1-2: Setup & Core Client**
- [ ] Create package structure
- [ ] Build BillingOS class with config
- [ ] Implement HTTP client (fetch-based)
- [ ] Add error handling
- [ ] TypeScript types

**Day 3: Session Token Methods**
- [ ] `createSessionToken()` method
- [ ] API integration (`POST /v1/session-tokens`)
- [ ] Response parsing
- [ ] Error handling

**Day 4: Webhook Verification**
- [ ] HMAC signature verification
- [ ] Webhook types
- [ ] Event parsing

**Day 5: API Methods**
- [ ] Customer methods
- [ ] Subscription methods
- [ ] Generic helper function

### Week 2: @billingos/supabase + SDK Updates (Days 6-10)

**Day 6-7: Supabase Package**
- [ ] Package setup
- [ ] `createSessionRoute()` for App Router
- [ ] `createSessionHandler()` for Pages Router
- [ ] Auto-detect Supabase auth

**Day 8-9: Update @billingos/sdk**
- [ ] Add session token support to BillingOSProvider
- [ ] Build `useSessionToken()` hook
- [ ] Update BillingOSClient
- [ ] Backwards compatibility

**Day 10: Testing**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

### Week 3: Documentation & Examples (Days 11-15)

**Day 11-12: Documentation**
- [ ] README for @billingos/node
- [ ] README for @billingos/supabase
- [ ] Update main SDK docs
- [ ] API reference

**Day 13-14: Example Apps**
- [ ] Next.js App Router + Supabase example
- [ ] Next.js Pages Router example
- [ ] Express + generic auth example

**Day 15: Polish & Publish**
- [ ] Code review
- [ ] Fix bugs
- [ ] Build packages
- [ ] Publish to npm

---

## Developer Experience Examples

### Example 1: Supabase (3-minute setup)

**Install:**
```bash
npm install @billingos/sdk @billingos/supabase
```

**Backend route:**
```typescript
// app/api/billingos-session/route.ts
import { billingos } from '@billingos/supabase';
export const GET = billingos.createSessionRoute();
```

**Frontend:**
```typescript
// app/layout.tsx
import { BillingOSProvider } from '@billingos/sdk';

export default function Layout({ children }) {
  return (
    <BillingOSProvider sessionTokenUrl="/api/billingos-session">
      {children}
    </BillingOSProvider>
  );
}
```

### Example 2: Custom Auth (5-minute setup)

**Install:**
```bash
npm install @billingos/sdk @billingos/node
```

**Backend route:**
```typescript
// app/api/billingos-session/route.ts
import { createSessionRoute } from '@billingos/node/helpers/generic';
import { getUser } from '@/lib/auth';

export const GET = createSessionRoute(
  { secretKey: process.env.BILLINGOS_SECRET_KEY! },
  async (req) => {
    const user = await getUser(req);
    return { userId: user.id };
  }
);
```

**Frontend:** (same as Supabase example)

---

## Success Criteria

✅ **Setup Time:**
- Supabase: < 3 minutes
- Custom auth: < 5 minutes

✅ **DX Quality:**
- TypeScript autocomplete
- Clear error messages
- One-line setup for Supabase
- Zero configuration for common cases

✅ **Security:**
- Secret keys never in frontend
- Session tokens auto-refresh
- HMAC webhook verification

✅ **Compatibility:**
- Framework-agnostic backend
- App Router + Pages Router support
- Backwards compatible

---

## Next Steps

1. Start with @billingos/node package setup
2. Build core BillingOS class
3. Implement session token creation
4. Add Supabase helper
5. Update React SDK
6. Write documentation
7. Create examples
8. Publish to npm
