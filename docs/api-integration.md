# BillingOS SDK - API Integration Guide

## Overview

This document describes all API endpoints required for the BillingOS SDK to function. These endpoints will be implemented in `/Users/ankushkumar/Code/billingos/apps/api/src/sdk/`.

---

## Base URL

**Development:** `http://localhost:3001`
**Production:** `https://api.billingos.com/v1`

---

## Authentication

All SDK endpoints require two authentication headers:

```
X-BillingOS-API-Key: pk_live_xyz123 (or pk_test_xyz123)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Endpoint-Specific Auth:

| Endpoint | Publishable Key | Customer Token | Secret Key |
|----------|----------------|----------------|------------|
| Create Customer Token | ❌ | ❌ | ✅ |
| Get Products | ✅ | ❌ | ❌ |
| Create Checkout | ✅ | ✅ | ❌ |
| Get Portal Data | ✅ | ✅ | ❌ |
| All other SDK endpoints | ✅ | ✅ | ❌ |

---

## Endpoint Specifications

### 1. Authentication

#### POST `/sdk/customer-tokens`

**Purpose:** Generate JWT token for customer (called by merchant's backend)

**Auth:** Secret API Key (`sk_live_...`)

**Request:**
```json
{
  "customerId": "cust_abc123",
  "expiresIn": 3600 // optional, default 3600 (1 hour)
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjdXN0X2FiYzEyMyIsIm9yZyI6Im9yZ18xMjMiLCJpYXQiOjE2NzMwMTIzNDUsImV4cCI6MTY3MzAxNTk0NSwidHlwZSI6ImN1c3RvbWVyX3Rva2VuIn0.abc123...",
  "expiresAt": "2026-01-07T15:30:00Z"
}
```

**Implementation:**
```typescript
@Post('customer-tokens')
@UseGuards(SecretKeyGuard)
async createCustomerToken(@Body() dto: CreateCustomerTokenDto) {
  // Decode secret key to get organization ID
  const organizationId = this.decodeSecretKey(dto.secretKey);

  // Verify customer belongs to organization
  const customer = await this.db
    .from('customers')
    .select('id')
    .eq('id', dto.customerId)
    .eq('organization_id', organizationId)
    .single();

  if (!customer) {
    throw new NotFoundException('Customer not found');
  }

  // Create JWT
  const token = this.jwt.sign({
    sub: dto.customerId,
    org: organizationId,
    type: 'customer_token'
  }, {
    expiresIn: dto.expiresIn || 3600
  });

  return {
    token,
    expiresAt: new Date(Date.now() + (dto.expiresIn || 3600) * 1000)
  };
}
```

---

### 2. Products & Pricing

#### GET `/sdk/products`

**Purpose:** Fetch all products with prices and features (for PricingTable)

**Auth:** Publishable Key + Customer Token (optional)

**Query Params:**
- `planIds` (optional): Comma-separated list of product IDs to filter

**Response:**
```json
{
  "products": [
    {
      "id": "prod_starter_uuid",
      "name": "Starter",
      "description": "Perfect for small teams",
      "prices": [
        {
          "id": "price_starter_monthly",
          "amount": 2900,
          "currency": "usd",
          "interval": "month",
          "intervalCount": 1
        }
      ],
      "features": [
        {
          "id": "feat_api_calls_1k",
          "name": "api_calls_limit",
          "title": "1,000 API calls/month",
          "type": "usage_quota",
          "properties": {
            "limit": 1000,
            "period": "month",
            "unit": "calls"
          }
        }
      ],
      "isCurrentPlan": false,
      "trialDays": 14
    }
  ],
  "currentSubscription": {
    "id": "sub_xyz789",
    "productId": "prod_pro_uuid",
    "priceId": "price_pro_monthly",
    "status": "active",
    "currentPeriodEnd": "2026-02-07T00:00:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

**Implementation:**
```typescript
@Get('products')
@UseGuards(PublishableKeyGuard)
async getProducts(
  @Query('planIds') planIds: string,
  @Customer() customer?: Customer
) {
  const organizationId = this.extractOrgFromApiKey(req.headers['x-billingos-api-key']);

  // Fetch products
  const products = await this.db
    .from('products')
    .select(`
      *,
      prices:product_prices(*),
      features:product_features(
        feature:features(*)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_archived', false);

  // If customer provided, check current subscription
  let currentSubscription = null;
  if (customer) {
    currentSubscription = await this.db
      .from('subscriptions')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('status', 'active')
      .single();
  }

  // Mark current plan
  const productsWithCurrentFlag = products.map(p => ({
    ...p,
    isCurrentPlan: currentSubscription?.product_id === p.id
  }));

  return {
    products: productsWithCurrentFlag,
    currentSubscription
  };
}
```

---

### 3. Checkout

#### POST `/sdk/checkout/create`

**Purpose:** Create checkout session for payment

**Auth:** Publishable Key + Customer Token

**Request:**
```json
{
  "priceId": "price_pro_monthly",
  "customerId": "cust_abc123",
  "existingSubscriptionId": "sub_xyz789" // optional, for upgrades
}
```

**Response:**
```json
{
  "checkoutSession": {
    "id": "cs_test_abc123",
    "clientSecret": "cs_test_abc123_secret_xyz789",
    "amount": 9900,
    "currency": "usd",
    "proration": {
      "credited": 5600,
      "charged": 9900,
      "total": 4300,
      "explanation": "You'll be credited $56.00 for the unused portion of your Starter plan."
    },
    "product": {
      "name": "Professional",
      "interval": "month",
      "features": ["10,000 API calls/month", "Priority support"]
    },
    "customer": {
      "email": "john@example.com",
      "name": "John Doe"
    },
    "stripePublishableKey": "pk_test_51ABC...",
    "stripeAccountId": "acct_1ABC..."
  }
}
```

**Implementation:**
```typescript
@Post('checkout/create')
@UseGuards(PublishableKeyGuard, CustomerTokenGuard)
async createCheckoutSession(
  @Body() dto: CreateCheckoutDto,
  @Customer() customer: Customer
) {
  // Fetch organization's Stripe account
  const organization = await this.getOrganization(customer.organization_id);
  const account = organization.account;

  // Fetch price details
  const price = await this.db
    .from('product_prices')
    .select('*, product:products(*)')
    .eq('id', dto.priceId)
    .single();

  // Calculate proration if upgrading
  let proration = null;
  if (dto.existingSubscriptionId) {
    proration = await this.calculateProration(
      dto.existingSubscriptionId,
      dto.priceId,
      account.stripe_id
    );
  }

  // Create Stripe Payment Intent
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: proration?.total || price.price_amount,
    currency: price.price_currency,
    customer: customer.stripe_customer_id,
    metadata: {
      customerId: customer.id,
      priceId: dto.priceId,
      existingSubscriptionId: dto.existingSubscriptionId
    }
  }, {
    stripeAccount: account.stripe_id // Use Connect account
  });

  return {
    checkoutSession: {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: price.price_amount,
      currency: price.price_currency,
      proration,
      product: {
        name: price.product.name,
        interval: price.product.recurring_interval,
        features: price.product.features.map(f => f.title)
      },
      customer: {
        email: customer.email,
        name: customer.name
      },
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      stripeAccountId: account.stripe_id
    }
  };
}
```

#### POST `/sdk/checkout/:clientSecret/confirm`

**Purpose:** Confirm payment and create/update subscription

**Auth:** Publishable Key + Customer Token

**Request:**
```json
{
  "paymentMethodId": "pm_1ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "sub_new_xyz",
  "status": "active",
  "message": "Payment successful! Your subscription is now active."
}
```

---

### 4. Customer Portal

#### GET `/sdk/customer/portal`

**Purpose:** Fetch all data for customer portal (subscription, usage, invoices, payment methods)

**Auth:** Publishable Key + Customer Token

**Response:** *(See customer-portal-spec.md for full response)*

**Implementation:**
```typescript
@Get('customer/portal')
@UseGuards(PublishableKeyGuard, CustomerTokenGuard)
async getCustomerPortal(@Customer() customer: Customer) {
  // Fetch subscription with features and usage
  const subscription = await this.getSubscriptionWithUsage(customer.id);

  // Fetch invoices
  const invoices = await this.getInvoices(customer.id);

  // Fetch payment methods from Stripe
  const paymentMethods = await this.stripe.paymentMethods.list({
    customer: customer.stripe_customer_id,
    type: 'card'
  });

  // Fetch available plans for upgrade/downgrade
  const availablePlans = await this.getAvailablePlans(
    customer.organization_id,
    subscription.product_id
  );

  return {
    subscription,
    invoices,
    paymentMethods: paymentMethods.data,
    customer,
    availablePlans
  };
}
```

---

### 5. Subscription Management

#### POST `/sdk/subscriptions/:id/update`

**Purpose:** Upgrade or downgrade subscription

**Auth:** Publishable Key + Customer Token

**Request:**
```json
{
  "newPriceId": "price_enterprise_monthly",
  "prorationBehavior": "always_invoice"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "sub_xyz789",
    "status": "active",
    "proration": {
      "credited": 5600,
      "charged": 29900,
      "total": 24300
    }
  },
  "upcomingInvoice": {
    "amountDue": 24300,
    "dueDate": "2026-01-07"
  }
}
```

#### POST `/sdk/subscriptions/:id/cancel`

**Purpose:** Cancel subscription

**Auth:** Publishable Key + Customer Token

**Request:**
```json
{
  "cancelAtPeriodEnd": true,
  "cancellationReason": "too_expensive",
  "feedback": "I found a cheaper alternative"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "sub_xyz789",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "canceledAt": "2026-01-07T12:30:00Z",
    "currentPeriodEnd": "2026-02-07T00:00:00Z"
  },
  "message": "Your subscription will remain active until February 7, 2026."
}
```

---

### 6. Payment Methods

#### POST `/sdk/payment-methods`

**Purpose:** Add new payment method

**Auth:** Publishable Key + Customer Token

**Request:**
```json
{
  "paymentMethodId": "pm_1ABC..." // From Stripe SetupIntent
}
```

**Response:**
```json
{
  "paymentMethod": {
    "id": "pm_1ABC...",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2027
    },
    "isDefault": false
  }
}
```

#### DELETE `/sdk/payment-methods/:id`

**Purpose:** Remove payment method

**Auth:** Publishable Key + Customer Token

**Response:**
```json
{
  "success": true,
  "message": "Payment method removed successfully."
}
```

---

### 7. Usage Tracking

#### POST `/sdk/usage/track`

**Purpose:** Track feature usage and enforce limits

**Auth:** Publishable Key + Customer Token

**Request:**
```json
{
  "feature": "api_calls_limit",
  "units": 1,
  "metadata": {
    "endpoint": "/api/data",
    "method": "GET"
  }
}
```

**Response:**
```json
{
  "success": true,
  "usage": {
    "consumed": 6544,
    "limit": 10000,
    "percentage": 65.44,
    "remaining": 3456
  },
  "limitExceeded": false
}
```

#### GET `/sdk/usage/check`

**Purpose:** Check if usage nudge should be shown

**Auth:** Publishable Key + Customer Token

**Response:** *(See upgrade-nudge-spec.md)*

---

### 8. Invoices

#### GET `/sdk/invoices/:id/pdf`

**Purpose:** Download invoice PDF

**Auth:** Publishable Key + Customer Token

**Response:** Binary PDF file

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "type": "authentication_error",
    "code": "token_expired",
    "message": "Customer token has expired. Please refresh the token.",
    "details": {
      "expiresAt": "2026-01-07T14:30:00Z"
    }
  }
}
```

### Error Types

| Type | HTTP Status | Description |
|------|-------------|-------------|
| `authentication_error` | 401 | Invalid/expired token or API key |
| `authorization_error` | 403 | Customer not authorized for resource |
| `not_found` | 404 | Resource not found |
| `validation_error` | 400 | Invalid request parameters |
| `rate_limit_error` | 429 | Too many requests |
| `stripe_error` | 400 | Stripe API error |
| `internal_error` | 500 | Server error |

---

## Rate Limiting

**Limits:**
- 100 requests per minute per customer
- 1000 requests per minute per organization

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1673012400
```

**Error Response:**
```json
{
  "error": {
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded",
    "message": "You've exceeded the rate limit. Please try again in 23 seconds.",
    "details": {
      "retryAfter": 23
    }
  }
}
```

---

## Webhooks (Optional for SDK)

The SDK can listen to real-time updates via webhooks:

```typescript
// Merchant's backend receives webhook from BillingOS
POST https://merchant.com/webhooks/billingos

{
  "type": "subscription.updated",
  "data": {
    "subscriptionId": "sub_xyz789",
    "status": "active",
    "currentPeriodEnd": "2026-02-07T00:00:00Z"
  }
}
```

**Webhook Types:**
- `subscription.created`
- `subscription.updated`
- `subscription.canceled`
- `invoice.paid`
- `invoice.payment_failed`
- `usage.limit_reached`

---

## Data Models (Database Schema)

### Customers
```sql
SELECT id, email, name, stripe_customer_id, organization_id
FROM customers
WHERE id = $1;
```

### Subscriptions
```sql
SELECT
  s.id,
  s.status,
  s.amount,
  s.currency,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.stripe_subscription_id,
  p.name as product_name
FROM subscriptions s
JOIN products p ON s.product_id = p.id
WHERE s.customer_id = $1;
```

### Usage Records
```sql
SELECT
  consumed_units,
  limit_units,
  period_start,
  period_end,
  feature_id
FROM usage_records
WHERE customer_id = $1
  AND subscription_id = $2
  AND period_end >= NOW();
```

---

## Implementation Checklist

### Phase 1: Authentication
- [ ] `POST /sdk/customer-tokens` - Create JWT
- [ ] Create `SecretKeyGuard` (validates `sk_` keys)
- [ ] Create `PublishableKeyGuard` (validates `pk_` keys)
- [ ] Create `CustomerTokenGuard` (validates JWT)

### Phase 2: Products
- [ ] `GET /sdk/products` - Fetch products with features
- [ ] Query products, prices, features, product_features tables
- [ ] Check current subscription if customer token provided

### Phase 3: Checkout
- [ ] `POST /sdk/checkout/create` - Create Payment Intent
- [ ] Calculate proration for upgrades
- [ ] Integrate with Stripe Connect (pass `stripeAccount`)
- [ ] `POST /sdk/checkout/:clientSecret/confirm` - Create subscription

### Phase 4: Customer Portal
- [ ] `GET /sdk/customer/portal` - Fetch all portal data
- [ ] Query subscriptions, usage, invoices
- [ ] Fetch payment methods from Stripe

### Phase 5: Subscription Management
- [ ] `POST /sdk/subscriptions/:id/update` - Upgrade/downgrade
- [ ] `POST /sdk/subscriptions/:id/cancel` - Cancel subscription
- [ ] Update both Stripe and database

### Phase 6: Payment Methods
- [ ] `POST /sdk/payment-methods` - Add card via SetupIntent
- [ ] `DELETE /sdk/payment-methods/:id` - Remove card

### Phase 7: Usage Tracking
- [ ] `POST /sdk/usage/track` - Track feature usage
- [ ] `GET /sdk/usage/check` - Check nudge triggers
- [ ] Update usage_records table

### Phase 8: Invoices
- [ ] `GET /sdk/invoices/:id/pdf` - Download PDF from Stripe

---

## Testing with Postman/cURL

### Example: Create Customer Token

```bash
curl -X POST http://localhost:3001/sdk/customer-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_test_YOUR_SECRET_KEY" \
  -d '{
    "customerId": "cust_abc123"
  }'
```

### Example: Get Products

```bash
curl -X GET http://localhost:3001/sdk/products \
  -H "X-BillingOS-API-Key: pk_test_YOUR_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Summary

This API provides everything the SDK needs:
1. **Authentication** - Customer tokens with JWT
2. **Products** - Pricing table data
3. **Checkout** - Payment processing with Stripe Elements
4. **Portal** - Full subscription management
5. **Usage** - Feature tracking and limits
6. **Nudges** - Upgrade prompts

All endpoints use Stripe Connect to charge the organization's connected account.
