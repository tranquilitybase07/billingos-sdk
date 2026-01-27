# BillingOS Authentication Architecture - Final Plan

**Date:** January 25, 2026
**Status:** Approved
**Pattern:** Hybrid Session Token Architecture

---

## Executive Summary

After analyzing Clerk, Useautumn, Kinde, and Better Auth patterns, we've decided on a **hybrid architecture** that combines:

1. **Session token pattern** (secure, auth-agnostic core)
2. **Auto-config helpers** (simple setup for popular frameworks)
3. **Framework flexibility** (works with ANY backend/frontend)

**Why this approach wins:**
- ✅ **Security**: Secret keys never exposed to frontend
- ✅ **Developer Experience**: 3-5 minute setup for 90% of users
- ✅ **Flexibility**: Works with Python, Go, Node, Ruby, PHP, etc.
- ✅ **Market Differentiation**: "Works with your existing auth" - no vendor lock-in
- ✅ **Battle-tested**: Same pattern used by Stripe, Plaid, Auth0

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        MERCHANT'S APP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend (React/Vue/Svelte)                                   │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  <BillingOSProvider sessionToken={token}>            │     │
│  │    <Dashboard />                                      │     │
│  │  </BillingOSProvider>                                │     │
│  └──────────────────────────────────────────────────────┘     │
│                          ↑                                      │
│                          │ 1. Request session token            │
│                          │                                      │
│  ┌───────────────────────┴──────────────────────────────┐     │
│  │  Backend (Node/Python/Go/Ruby/PHP)                   │     │
│  │  ─────────────────────────────────────────────       │     │
│  │  GET /api/billingos-session                          │     │
│  │                                                       │     │
│  │  1. Verify user's auth session (Clerk/Supabase/etc) │     │
│  │  2. Extract user ID                                  │     │
│  │  3. Call BillingOS API with secret key              │     │
│  │  4. Return session token to frontend                 │     │
│  └──────────────────────────────────────────────────────┘     │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │ 2. Create session token
                           │    (with secret key)
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BILLINGOS API                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /v1/session-tokens                                       │
│  Authorization: Bearer sk_live_secret_key_xyz                  │
│                                                                 │
│  1. Validate API key                                           │
│  2. Look up merchant account                                   │
│  3. Generate signed session token                              │
│  4. Store token metadata in database                           │
│  5. Return token to merchant's backend                         │
│                                                                 │
│  ┌─────────────────────────────────────────────┐              │
│  │  Session Token: bos_session_abc123.sig456   │              │
│  │  - Payload: user_id, org_id, scopes         │              │
│  │  - Signature: HMAC-SHA256                   │              │
│  │  - Expiry: 1 hour (configurable)            │              │
│  └─────────────────────────────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ 3. Frontend makes API calls
                           │    with session token
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BILLINGOS SDK (Frontend)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /v1/subscriptions                                         │
│  Authorization: Bearer bos_session_abc123.sig456               │
│                                                                 │
│  BillingOS validates:                                          │
│  ✓ Token signature is valid                                    │
│  ✓ Token not expired                                           │
│  ✓ Token not revoked                                           │
│  ✓ User has permission for this operation                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **API Keys** (Secret, never exposed)
   - Stored only on merchant's backend
   - Used to request session tokens
   - Format: `sk_live_*` (secret key) or `sk_test_*` (test mode)

2. **Session Tokens** (Short-lived, scoped)
   - Generated by BillingOS API
   - Passed to frontend safely
   - Format: `bos_session_{payload}.{signature}`
   - Default expiry: 1 hour (max 24 hours)

3. **Auto-Config Helpers** (Developer convenience)
   - Pre-built integrations for Supabase, Clerk, NextAuth
   - Extract user ID automatically
   - Handle session token exchange

---

## Authentication Flow

### Flow 1: Initial Setup (One-Time)

```
Developer
    ↓
1. Sign up for BillingOS account
    ↓
2. Create organization/project
    ↓
3. Generate API keys (dashboard or CLI)
    ↓
   ┌─────────────────────────────────┐
   │ sk_live_1234567890abcdef        │  ← Secret key
   │ pk_live_abcdef1234567890        │  ← Publishable key (for webhooks)
   └─────────────────────────────────┘
    ↓
4. Store sk_live_* in backend environment variables
    ↓
5. Install SDK: npm install @billingos/supabase (or /clerk, /nextjs, etc.)
```

### Flow 2: Runtime Session Token Exchange

```
User visits app
    ↓
Frontend loads
    ↓
1. Frontend: "I need billing data"
    ↓
   fetch('/api/billingos-session')
    ↓
2. Backend: Verify user's auth session
    ↓
   const user = await getUser(request)  // Your existing auth
    ↓
3. Backend: Request session token from BillingOS
    ↓
   POST https://api.billingos.com/v1/session-tokens
   Authorization: Bearer sk_live_1234567890abcdef
   Content-Type: application/json

   {
     "external_user_id": "user_abc123",        // Your user ID
     "external_organization_id": "org_xyz",    // Optional (B2B)
     "allowed_operations": [                   // Optional scoping
       "read_subscription",
       "update_payment_method"
     ],
     "expires_in": 3600                        // 1 hour
   }
    ↓
4. BillingOS: Validate API key & generate token
    ↓
   {
     "session_token": "bos_session_payload123.signature456",
     "expires_at": "2026-01-25T13:00:00Z"
   }
    ↓
5. Backend: Return token to frontend
    ↓
   Response: { "sessionToken": "bos_session_..." }
    ↓
6. Frontend: Initialize BillingOS provider
    ↓
   <BillingOSProvider sessionToken={token}>
     <App />
   </BillingOSProvider>
    ↓
7. Frontend: Make API calls with session token
    ↓
   GET https://api.billingos.com/v1/subscriptions
   Authorization: Bearer bos_session_payload123.signature456
    ↓
8. BillingOS: Validate token & return data scoped to user
    ↓
   {
     "subscription": {
       "plan": "pro",
       "status": "active",
       "features": ["feature_1", "feature_2"]
     }
   }
```

### Flow 3: Token Refresh (When Expired)

```
Frontend makes API call with expired token
    ↓
BillingOS returns 401 Unauthorized
    ↓
Frontend catches error
    ↓
Automatically refetches new session token
    ↓
Retries original request
```

---

## Token Design

### Session Token Structure

**Format:** `bos_session_{base64_payload}.{hmac_signature}`

**Example:**
```
bos_session_eyJ1c2VyX2lkIjoidXNlcl9hYmMxMjMiLCJvcmdfaWQiOiJvcmdfeHl6Iiwic2NvcGVzIjpbInJlYWQiXSwiZXhwIjoxNzM3ODIwODAwfQ.a3b5c8d9e1f2g3h4i5j6k7l8m9n0o1p2
                  └────────────────────── Payload (Base64) ───────────────────────┘  └────── Signature (HMAC-SHA256) ──────┘
```

### Payload Contents (Before Base64 Encoding)

```json
{
  "jti": "tok_1234567890abcdef",           // Unique token ID (for revocation)
  "iat": 1737817200,                       // Issued at (Unix timestamp)
  "exp": 1737820800,                       // Expires at (Unix timestamp)
  "merchant_id": "merch_xyz",              // BillingOS merchant ID
  "external_user_id": "user_abc123",       // Merchant's user ID
  "external_organization_id": "org_xyz",   // Optional (B2B)
  "allowed_operations": [                  // Optional scope
    "read_subscription",
    "update_payment_method",
    "cancel_subscription"
  ],
  "metadata": {                            // Optional merchant data
    "ip_address": "203.0.113.45",
    "user_agent": "Mozilla/5.0..."
  }
}
```

### Signature Generation

**Algorithm:** HMAC-SHA256

**Process:**
```
1. Encode payload as Base64URL
   payload_b64 = base64url_encode(json_payload)

2. Create signing input
   signing_input = "bos_session_" + payload_b64

3. Generate HMAC signature
   secret = merchant.signing_secret  // Stored in DB
   signature = hmac_sha256(secret, signing_input)
   signature_hex = hex_encode(signature)

4. Combine parts
   token = signing_input + "." + signature_hex
```

**Why HMAC-SHA256?**
- ✅ Fast verification (no public key needed)
- ✅ Industry standard (JWT uses RS256/HS256)
- ✅ Tamper-proof (signature invalidates if payload modified)
- ✅ Symmetric key simplicity

### Token Validation (On Each Request)

```
1. Split token into parts
   [prefix_payload, signature] = token.split('.')

2. Extract payload
   payload_b64 = prefix_payload.replace('bos_session_', '')
   payload = base64url_decode(payload_b64)

3. Verify signature
   expected_sig = hmac_sha256(merchant.signing_secret, prefix_payload)
   if (signature !== expected_sig) → REJECT

4. Check expiry
   if (payload.exp < now()) → REJECT (expired)

5. Check revocation (optional)
   if (token_id in revoked_tokens) → REJECT

6. Check allowed operations (if scoped)
   if (operation not in payload.allowed_operations) → REJECT

7. Accept request
   Return data scoped to payload.external_user_id
```

---

## API Key System

### Key Types

| Key Type | Prefix | Purpose | Exposure |
|----------|--------|---------|----------|
| **Secret Key** | `sk_live_*` | Create session tokens, access backend APIs | Backend only (never frontend) |
| **Test Secret Key** | `sk_test_*` | Development/testing mode | Backend only |
| **Publishable Key** | `pk_live_*` | Webhook signature verification, public operations | Can be in frontend (limited power) |
| **Test Publishable Key** | `pk_test_*` | Testing webhooks | Can be in frontend |

### Key Generation Process

**When:** Merchant creates a new project/organization in BillingOS

**Step-by-step:**
```
1. Merchant creates organization via dashboard or API
    ↓
2. BillingOS generates key set

   Generate random bytes (cryptographically secure):
   secret_key_bytes = crypto.randomBytes(32)  // 256 bits

   Encode as base58 (avoid confusing characters):
   secret_key = "sk_live_" + base58_encode(secret_key_bytes)

   Example: sk_live_YOUR_SECRET_KEY_HERE

    ↓
3. Generate signing secret (for token signatures)

   signing_secret_bytes = crypto.randomBytes(64)  // 512 bits
   signing_secret = base64_encode(signing_secret_bytes)

    ↓
4. Store in database

   INSERT INTO api_keys (
     merchant_id,
     key_type,
     key_prefix,
     key_hash,
     signing_secret,
     created_at,
     last_used_at
   ) VALUES (
     'merch_123',
     'secret',
     'sk_live_xxxxx',  -- First 13 chars for display
     sha256('sk_live_YOUR_SECRET_KEY_HERE'),  -- Hash only
     'base64_signing_secret_here',
     NOW(),
     NULL
   )

    ↓
5. Show full key to merchant ONCE

   ⚠️ Save this key - it won't be shown again!

   Secret Key: sk_live_YOUR_SECRET_KEY_HERE

    ↓
6. Merchant stores in environment variables

   BILLINGOS_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
```

### Key Storage (Security)

**Never store plaintext keys** - Use hash + prefix pattern:

```sql
-- ❌ WRONG (plaintext)
api_keys {
  key: "sk_live_YOUR_SECRET_KEY_HERE"
}

-- ✅ CORRECT (hashed)
api_keys {
  key_prefix: "sk_live_xxxxx",           -- First 13 chars (for display)
  key_hash: "sha256_hash_of_full_key",   -- SHA-256 hash
  signing_secret: "base64_secret"        -- For HMAC (needed for validation)
}
```

**Validation process:**
```
1. Merchant sends: sk_live_YOUR_SECRET_KEY_HERE

2. BillingOS hashes it:
   hash = sha256('sk_live_YOUR_SECRET_KEY_HERE')

3. Lookup in database:
   SELECT * FROM api_keys WHERE key_hash = hash

4. If found:
   - Load signing_secret
   - Use for session token generation
```

### Key Rotation

**Recommended:** Rotate keys every 90 days

**Process:**
```
1. Generate new key (keep old active)
    ↓
2. Update backend with new key
    ↓
3. Verify new key works
    ↓
4. Revoke old key
    ↓
   UPDATE api_keys SET revoked_at = NOW() WHERE key_hash = old_hash
```

**Grace period:** Allow 24-hour overlap for zero-downtime rotation

---

## Database Schema

### Required Tables in BillingOS

#### 1. `merchants` (Organizations using BillingOS)

```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Billing
  stripe_customer_id VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_merchants_email ON merchants(email);
```

#### 2. `api_keys` (Secret keys for authentication)

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Key data
  key_type VARCHAR(20) NOT NULL,  -- 'secret' or 'publishable'
  environment VARCHAR(10) NOT NULL,  -- 'live' or 'test'
  key_prefix VARCHAR(20) NOT NULL,  -- First 13 chars (for display)
  key_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 of full key

  -- Signing secret (for HMAC)
  signing_secret TEXT NOT NULL,  -- Base64-encoded 512-bit secret

  -- Metadata
  name VARCHAR(255),  -- Optional label ("Production API", "Staging", etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  revoked_at TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_key_type CHECK (key_type IN ('secret', 'publishable')),
  CONSTRAINT valid_environment CHECK (environment IN ('live', 'test'))
);

-- Indexes
CREATE INDEX idx_api_keys_merchant ON api_keys(merchant_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
```

#### 3. `session_tokens` (Track active tokens)

```sql
CREATE TABLE session_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,

  -- Token data
  token_id VARCHAR(50) NOT NULL UNIQUE,  -- jti from payload (for revocation)
  external_user_id VARCHAR(255) NOT NULL,  -- Merchant's user ID
  external_organization_id VARCHAR(255),  -- Optional (B2B)

  -- Permissions
  allowed_operations JSONB,  -- ["read_subscription", "update_payment"]

  -- Lifecycle
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  last_used_at TIMESTAMP,

  -- Metadata
  metadata JSONB,  -- IP, user agent, etc.

  -- Indexes for fast lookups
  CONSTRAINT valid_external_user CHECK (external_user_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_session_tokens_merchant ON session_tokens(merchant_id);
CREATE INDEX idx_session_tokens_user ON session_tokens(external_user_id);
CREATE INDEX idx_session_tokens_org ON session_tokens(external_organization_id) WHERE external_organization_id IS NOT NULL;
CREATE INDEX idx_session_tokens_expiry ON session_tokens(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_session_tokens_token_id ON session_tokens(token_id) WHERE revoked_at IS NULL;

-- Auto-cleanup expired tokens (run daily)
CREATE INDEX idx_session_tokens_cleanup ON session_tokens(created_at) WHERE expires_at < NOW() AND revoked_at IS NULL;
```

#### 4. `customers` (Merchant's end customers)

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- External IDs (merchant's system)
  external_user_id VARCHAR(255) NOT NULL,  -- Merchant's user ID
  external_organization_id VARCHAR(255),  -- Optional (B2B)

  -- Stripe
  stripe_customer_id VARCHAR(255) UNIQUE,

  -- Customer data
  email VARCHAR(255),
  name VARCHAR(255),

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,

  -- Unique constraint
  CONSTRAINT unique_customer_per_merchant UNIQUE (merchant_id, external_user_id, external_organization_id)
);

-- Indexes
CREATE INDEX idx_customers_merchant ON customers(merchant_id);
CREATE INDEX idx_customers_external_user ON customers(merchant_id, external_user_id);
CREATE INDEX idx_customers_external_org ON customers(merchant_id, external_organization_id) WHERE external_organization_id IS NOT NULL;
CREATE INDEX idx_customers_stripe ON customers(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
```

#### 5. `subscriptions` (Customer subscriptions)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

  -- Stripe
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),

  -- Subscription details
  plan_id UUID REFERENCES plans(id),
  status VARCHAR(50) NOT NULL,  -- active, past_due, canceled, etc.

  -- Billing
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing'))
);

-- Indexes
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_merchant ON subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(merchant_id, status);
```

---

## Security Model

### Threat Model & Mitigations

| Threat | Mitigation |
|--------|-----------|
| **API key exposure in frontend** | Keys never leave backend; session tokens used in frontend |
| **Session token stolen** | Short expiry (1 hour), revocation support, IP binding optional |
| **Token tampering** | HMAC signature validation - any change invalidates token |
| **Replay attacks** | Token IDs (jti) tracked, can be revoked, expiry enforced |
| **User impersonation** | Backend validates auth before creating token |
| **Brute force key guessing** | 256-bit keys (2^256 combinations), rate limiting |
| **Database breach** | Keys hashed (SHA-256), signing secrets encrypted at rest |
| **MITM attacks** | HTTPS only, HSTS enabled, certificate pinning recommended |

### Security Layers

**Layer 1: API Key Protection**
- Never in frontend code
- Never in git repositories
- Environment variables only
- Hash storage in database

**Layer 2: Session Token Scoping**
- Short expiration (1 hour default)
- Operation-level permissions
- User/org binding
- Revocation capability

**Layer 3: Request Validation**
- HMAC signature check
- Expiry enforcement
- Rate limiting (100 req/min per token)
- IP whitelist (optional)

**Layer 4: Transport Security**
- HTTPS/TLS 1.3 only
- HSTS headers
- Certificate validation
- No mixed content

**Layer 5: Audit & Monitoring**
- All token creation logged
- Failed auth attempts tracked
- Anomaly detection (unusual IP, volume)
- Webhook alerts for suspicious activity

### Rate Limiting

**API Key Operations:**
- Session token creation: 100/min per key
- Webhook processing: 1000/min per key

**Session Token Operations:**
- API calls: 1000/min per token
- Failed auth: 10/min (then block)

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

**Goal:** Session token API working end-to-end

**Tasks:**
1. Database schema
   - Create migrations for all tables
   - Set up indexes
   - Test constraints

2. API key generation
   - Build key generation endpoint
   - Implement hashing/storage
   - Create dashboard UI for key management

3. Session token API
   - `POST /v1/session-tokens` endpoint
   - Token generation logic
   - HMAC signing implementation
   - Token validation middleware

4. Testing
   - Unit tests for crypto functions
   - Integration tests for token flow
   - Security audit of implementation

**Deliverable:** Working session token API that merchants can call

### Phase 2: SDK Development (Week 3-4)

**Goal:** Easy merchant integration

**Tasks:**
1. `@billingos/node` SDK
   - `createSessionToken(userId, options)` function
   - Error handling
   - TypeScript types
   - Documentation

2. `@billingos/react` SDK
   - `BillingOSProvider` component
   - `useBilling()` hook
   - Auto-refresh on expiry
   - TypeScript types

3. `@billingos/supabase` helper
   - Auto-detect Supabase auth
   - Extract user ID automatically
   - One-line setup

4. Example apps
   - Next.js + Supabase example
   - Express + Clerk example
   - Documentation site

**Deliverable:** Merchants can integrate in < 10 minutes

### Phase 3: Additional Helpers (Week 5-6)

**Goal:** Support popular auth providers

**Tasks:**
1. `@billingos/clerk` helper
2. `@billingos/nextauth` helper
3. `@billingos/kinde` helper
4. Python SDK (`billingos-python`)
5. Go SDK (`billingos-go`)

**Deliverable:** Coverage of 90% of market

### Phase 4: Advanced Features (Week 7-8)

**Goal:** Enterprise-grade security

**Tasks:**
1. Token revocation API
2. IP whitelisting
3. Webhook alerts for security events
4. Audit log API
5. Dashboard analytics (token usage, etc.)
6. Key rotation automation

**Deliverable:** Production-ready security features

---

## Developer Experience Examples

### Example 1: Supabase (3-minute setup)

**Step 1:** Install SDK
```bash
npm install @billingos/supabase @billingos/react
```

**Step 2:** Create backend route
```typescript
// app/api/billingos-session/route.ts
import { createBillingOSSession } from '@billingos/supabase';

export const { GET } = createBillingOSSession();
// That's it! Auto-detects Supabase auth
```

**Step 3:** Wrap app
```typescript
// app/layout.tsx
import { BillingOSProvider } from '@billingos/react';

export default function Layout({ children }) {
  return <BillingOSProvider>{children}</BillingOSProvider>;
}
```

**Step 4:** Use in components
```typescript
import { useBilling } from '@billingos/react';

function Dashboard() {
  const { subscription, hasFeature } = useBilling();

  return (
    <div>
      <h1>Plan: {subscription?.plan}</h1>
      {hasFeature('analytics') && <Analytics />}
    </div>
  );
}
```

---

### Example 2: Clerk (5-minute setup)

**Step 1:** Install SDK
```bash
npm install @billingos/clerk @billingos/react
```

**Step 2:** Create backend route
```typescript
// app/api/billingos-session/route.ts
import { createBillingOSSession } from '@billingos/clerk';

export const { GET } = createBillingOSSession();
// Auto-detects Clerk auth
```

**Step 3 & 4:** Same as Supabase example above

---

### Example 3: Custom Auth (10-minute setup)

**Step 1:** Install SDK
```bash
npm install @billingos/nextjs @billingos/react
```

**Step 2:** Create backend route with auth callback
```typescript
// app/api/billingos-session/route.ts
import { createBillingOSSession } from '@billingos/nextjs';
import { getUser } from '@/lib/auth';  // Your auth

export const { GET } = createBillingOSSession({
  auth: async (request) => {
    const user = await getUser(request);

    if (!user) {
      throw new Error('User not authenticated');
    }

    // For B2C (user-level billing)
    return {
      userId: user.id,
    };

    // For B2B (organization-level billing)
    // const orgId = request.headers.get('x-organization-id');
    // return {
    //   userId: user.id,
    //   organizationId: orgId,
    // };
  }
});
```

**Step 3 & 4:** Same as Supabase example above

---

### Example 4: Python Backend (Flask)

**Step 1:** Install SDK
```bash
pip install billingos
```

**Step 2:** Create session endpoint
```python
from flask import Flask, jsonify
from billingos import BillingOS
from your_auth import get_current_user

app = Flask(__name__)
billing = BillingOS(secret_key="sk_live_...")

@app.route('/api/billingos-session')
def create_session():
    user = get_current_user()

    token = billing.create_session_token(
        external_user_id=user.id,
        expires_in=3600
    )

    return jsonify({'sessionToken': token})
```

**Step 3:** Frontend same as above examples

---

## Integration Patterns

### Pattern 1: B2C (User-Level Billing)

**Use case:** SaaS app where each user has their own subscription

```typescript
// Backend: Session token creation
export const { GET } = createBillingOSSession({
  auth: async (req) => {
    const user = await getUser(req);
    return {
      userId: user.id,  // Bill per user
    };
  }
});

// Frontend: Access user's subscription
const { subscription } = useBilling();
// Returns subscription for current user
```

---

### Pattern 2: B2B (Organization-Level Billing)

**Use case:** Team collaboration app where organization owns subscription

```typescript
// Backend: Session token creation
export const { GET } = createBillingOSSession({
  auth: async (req) => {
    const user = await getUser(req);
    const orgId = req.headers.get('x-organization-id');

    // Verify user belongs to org
    const membership = await checkMembership(user.id, orgId);
    if (!membership) throw new Error('Unauthorized');

    return {
      userId: user.id,
      organizationId: orgId,  // Bill per organization
    };
  }
});

// Frontend: Pass org context
<BillingOSProvider organizationId="org_123">
  <TeamDashboard />
</BillingOSProvider>

// Access organization's subscription
const { subscription } = useBilling();
// Returns subscription for organization
```

---

### Pattern 3: Hybrid (User + Organization)

**Use case:** App supports both individual and team plans

```typescript
// Backend: Flexible session token
export const { GET } = createBillingOSSession({
  auth: async (req) => {
    const user = await getUser(req);
    const orgId = req.headers.get('x-organization-id');

    if (orgId) {
      // Organization context
      const membership = await checkMembership(user.id, orgId);
      if (!membership) throw new Error('Unauthorized');

      return {
        userId: user.id,
        organizationId: orgId,
      };
    } else {
      // Personal context
      return {
        userId: user.id,
      };
    }
  }
});

// Frontend: Switch context
<BillingOSProvider organizationId={currentOrg?.id}>
  <Dashboard />
</BillingOSProvider>

// Automatically scoped to user or org
const { subscription } = useBilling();
```

---

## Success Criteria

### Technical Metrics

✅ **Setup time:**
- Supabase/Clerk users: < 3 minutes
- Custom auth users: < 10 minutes
- Non-Next.js backends: < 15 minutes

✅ **Security:**
- Zero frontend key exposure
- < 1% false positive rate on token validation
- < 5 second token generation time
- 99.99% uptime for token API

✅ **Performance:**
- Token creation: < 100ms p95
- Token validation: < 10ms p95
- Support 10,000 req/sec token validation

### Developer Experience Metrics

✅ **Documentation:**
- < 5 minute quickstart guide
- Copy-paste examples for top 5 auth providers
- Video tutorials for each pattern

✅ **Adoption:**
- > 80% of merchants use auto-config helpers
- < 5% churn due to integration complexity
- NPS > 50 on integration experience

---

## Conclusion

This hybrid session token architecture provides:

1. **Security**: Secret keys never exposed, cryptographic signing, short-lived tokens
2. **Flexibility**: Works with any auth provider, any backend language, any frontend framework
3. **Simplicity**: 3-minute setup for 90% of users via auto-config helpers
4. **Scalability**: Battle-tested pattern used by Stripe, Plaid, Auth0

**Next steps:**
1. Review and approve this plan
2. Create database migrations (Phase 1)
3. Build session token API (Phase 1)
4. Develop core SDKs (Phase 2)
5. Launch with documentation (Phase 3)

**Timeline:** 8 weeks to production-ready MVP
