# BillingOS SDK Authentication Flow

## Overview

The SDK uses a two-key authentication system:
1. **Publishable API Key** (`pk_live_...`) - Safe to expose in frontend
2. **Customer Token** (JWT) - Short-lived token for customer-specific operations

This is similar to Stripe's authentication pattern.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  MERCHANT'S BACKEND                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User logs into merchant's app                              │
│  Merchant knows: userId → customerId mapping                │
│                                                              │
│  POST https://api.billingos.com/v1/sdk/customer-tokens      │
│  Headers:                                                    │
│    Authorization: Bearer sk_live_YOUR_SECRET_KEY            │
│  Body:                                                       │
│    {                                                         │
│      "customerId": "cust_abc123",  // From customers table  │
│      "expiresIn": 3600            // 1 hour (optional)      │
│    }                                                         │
│                                                              │
│  Response:                                                   │
│    {                                                         │
│      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",   │
│      "expiresAt": "2026-01-07T15:30:00Z"                    │
│    }                                                         │
│                                                              │
│  Merchant sends token to frontend →                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  MERCHANT'S FRONTEND (React App)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  import { BillingOSProvider } from '@billingos/sdk';        │
│                                                              │
│  function App() {                                           │
│    const [customerToken, setCustomerToken] = useState(null);│
│                                                              │
│    useEffect(() => {                                        │
│      // Fetch token from merchant's backend                │
│      fetch('/api/billing/customer-token')                  │
│        .then(res => res.json())                             │
│        .then(data => setCustomerToken(data.token));        │
│    }, []);                                                  │
│                                                              │
│    return (                                                 │
│      <BillingOSProvider                                     │
│        apiKey="pk_live_YOUR_PUBLISHABLE_KEY"               │
│        customerToken={customerToken}                        │
│      >                                                      │
│        <YourApp />                                          │
│      </BillingOSProvider>                                   │
│    );                                                       │
│  }                                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ SDK makes authenticated requests
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  BILLINGOS API                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Every SDK request includes:                                │
│    X-BillingOS-API-Key: pk_live_YOUR_PUBLISHABLE_KEY       │
│    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...    │
│                                                              │
│  Validation:                                                │
│  1. Decode publishable key → Extract organization_id       │
│  2. Verify JWT signature with secret                       │
│  3. Extract customer_id from JWT payload                   │
│  4. Verify customer belongs to organization                │
│  5. Check token not expired                                │
│                                                              │
│  Scope data to:                                             │
│  - Customer's subscriptions only                            │
│  - Organization's products/features                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  STRIPE API (via Connect)                                   │
│  Uses organization's stripe_account_id from accounts table  │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Model

### Publishable API Key

**Format:** `pk_live_xyz123abc456` or `pk_test_xyz123abc456`

**Purpose:**
- Identifies which organization is making the request
- Safe to expose in frontend code
- Used for public operations (fetch products, create checkout)

**Backend Decoding:**
```typescript
// BillingOS backend decodes key to extract organization
const decoded = decodePublishableKey(apiKey);
// { organizationId: "org_123", environment: "live" }
```

### Customer Token (JWT)

**Format:** Standard JWT with HS256 signature

**Payload:**
```json
{
  "sub": "cust_abc123",                    // Customer ID
  "org": "org_123",                        // Organization ID
  "iat": 1673012345,                       // Issued at (Unix timestamp)
  "exp": 1673015945,                       // Expires at (1 hour later)
  "type": "customer_token"
}
```

**Purpose:**
- Proves customer identity
- Short-lived (1 hour by default)
- Cannot be forged (signed with secret key)

**Backend Validation:**
```typescript
// BillingOS backend validates JWT
const payload = jwt.verify(token, process.env.JWT_SECRET);

// Verify customer belongs to organization from API key
if (payload.org !== organizationIdFromApiKey) {
  throw new Error('Token organization mismatch');
}

// Check expiration
if (payload.exp < Date.now() / 1000) {
  throw new Error('Token expired');
}
```

---

## Token Refresh Strategy

### Client-Side Auto-Refresh

```typescript
// In BillingOSProvider

function BillingOSProvider({ apiKey, customerToken, onTokenRefresh, children }) {
  const [token, setToken] = useState(customerToken);

  useEffect(() => {
    // Parse token to get expiry
    const payload = parseJwt(token);
    const expiresAt = payload.exp * 1000; // Convert to ms

    // Refresh 5 minutes before expiry
    const refreshAt = expiresAt - (5 * 60 * 1000);
    const timeUntilRefresh = refreshAt - Date.now();

    if (timeUntilRefresh > 0) {
      const timer = setTimeout(() => {
        // Call merchant's refresh endpoint
        onTokenRefresh?.().then(newToken => setToken(newToken));
      }, timeUntilRefresh);

      return () => clearTimeout(timer);
    }
  }, [token, onTokenRefresh]);

  // ... rest of provider
}
```

### Merchant Implementation

```typescript
// Merchant's backend - Token refresh endpoint

app.post('/api/billing/customer-token', authenticateUser, async (req, res) => {
  // Get customer ID from merchant's user session
  const customerId = await getCustomerIdForUser(req.user.id);

  // Call BillingOS to create token
  const response = await fetch('https://api.billingos.com/v1/sdk/customer-tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BILLINGOS_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ customerId })
  });

  const { token, expiresAt } = await response.json();

  res.json({ token, expiresAt });
});
```

---

## API Key Types

### Development vs Production

| Type | Prefix | Environment | Stripe Mode |
|------|--------|-------------|-------------|
| Test Publishable | `pk_test_` | Development | Test mode |
| Live Publishable | `pk_live_` | Production | Live mode |
| Test Secret | `sk_test_` | Development | Test mode |
| Live Secret | `sk_live_` | Production | Live mode |

**Important:**
- Never expose secret keys (`sk_`) in frontend code
- Only use publishable keys (`pk_`) in SDK initialization
- Secret keys are only used in merchant's backend for token creation

---

## Error Handling

### Invalid API Key

```json
{
  "error": {
    "type": "invalid_api_key",
    "message": "The API key provided is invalid or has been revoked.",
    "code": "api_key_invalid"
  }
}
```

### Expired Token

```json
{
  "error": {
    "type": "authentication_error",
    "message": "Customer token has expired. Please refresh the token.",
    "code": "token_expired"
  }
}
```

### Token Mismatch

```json
{
  "error": {
    "type": "authentication_error",
    "message": "Customer does not belong to the organization for this API key.",
    "code": "org_mismatch"
  }
}
```

---

## Best Practices

### 1. Token Storage

**DO:**
- Store token in React state (ephemeral)
- Pass token through React Context

**DON'T:**
- Store token in localStorage (security risk if XSS)
- Store token in cookies (not necessary for this flow)

### 2. Token Refresh

**DO:**
- Implement auto-refresh 5 minutes before expiry
- Handle refresh failures gracefully
- Show login prompt if refresh fails repeatedly

**DON'T:**
- Wait for 401 error to refresh (poor UX)
- Retry infinite times (avoid DOS)

### 3. API Key Management

**DO:**
- Use environment variables for keys
- Rotate keys quarterly
- Use test keys in development

**DON'T:**
- Commit keys to git
- Share keys between environments
- Use production keys in dev/test

---

## Example: Complete Integration

```typescript
// ===== Merchant Backend =====

import express from 'express';
import fetch from 'node-fetch';

const app = express();

// Endpoint to create customer token
app.post('/api/billing/customer-token', authenticateUser, async (req, res) => {
  const user = req.user;

  // Map user to BillingOS customer ID
  // (This mapping is stored in your database)
  const customerId = user.billingosCustomerId;

  // Create token via BillingOS API
  const response = await fetch('https://api.billingos.com/v1/sdk/customer-tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BILLINGOS_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ customerId })
  });

  const data = await response.json();
  res.json(data);
});

// ===== Merchant Frontend =====

import React, { useState, useEffect } from 'react';
import { BillingOSProvider, PricingTable, CustomerPortal } from '@billingos/sdk';

function App() {
  const [customerToken, setCustomerToken] = useState(null);

  useEffect(() => {
    fetchCustomerToken();
  }, []);

  async function fetchCustomerToken() {
    const res = await fetch('/api/billing/customer-token', {
      credentials: 'include' // Send session cookie
    });
    const data = await res.json();
    setCustomerToken(data.token);
  }

  if (!customerToken) {
    return <div>Loading...</div>;
  }

  return (
    <BillingOSProvider
      apiKey={process.env.REACT_APP_BILLINGOS_PUBLISHABLE_KEY}
      customerToken={customerToken}
      onTokenRefresh={fetchCustomerToken}
    >
      <div>
        <h1>My App</h1>

        {/* Pricing page */}
        <PricingTable />

        {/* Account settings page */}
        <CustomerPortal />
      </div>
    </BillingOSProvider>
  );
}
```

---

## Summary

**Key Points:**
1. Merchant's backend creates customer tokens using secret key
2. Frontend initializes SDK with publishable key + customer token
3. All SDK requests include both keys for authentication
4. Tokens are short-lived (1 hour) and auto-refreshed
5. BillingOS validates both keys and scopes data appropriately

**Security:**
- Publishable key is safe in frontend (like Stripe)
- Customer token proves identity without exposing secrets
- Short TTL limits damage if token is compromised
- Organization scoping prevents cross-tenant data access
