# End-to-End Payment Flow: Pricing to Checkout to Payment

## Overview

This document describes the complete user journey from viewing pricing plans to completing payment, with real-time updates back to the merchant's application. The flow demonstrates how BillingOS SDK enables seamless in-app checkout without redirects.

**Key Principle**: User never leaves merchant's app. Everything happens in modals/overlays within the same page.

---

## Architecture Components

### Frontend Components
```
Merchant's React/Next.js App
├── <PricingTable />          → Native React component (npm)
├── <CheckoutModal />         → React wrapper with iframe (npm)
└── <SubscriptionStatus />    → Native React component (npm)

BillingOS Hosted (Vercel)
└── embed.billingos.com/checkout/[id] → Checkout page in iframe
```

### Backend APIs
```
api.billingos.com
├── POST /checkout/sessions   → Create checkout session
├── POST /subscriptions       → Create subscription
├── POST /payments            → Process payment via Stripe
└── GET /subscriptions/:id    → Fetch subscription status

Stripe
├── Payment Element           → Card input, Apple Pay, Google Pay
├── Payment Intent            → Process payment
└── Webhooks                  → Payment status updates
```

---

## Complete Flow: Step by Step

### Step 1: User Views Pricing Plans

**What User Sees:**
```
┌─────────────────────────────────────────────────────────┐
│  Merchant's App - Pricing Page                          │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Basic     │  │    Pro      │  │  Enterprise │    │
│  │   $10/mo    │  │   $49/mo    │  │   $199/mo   │    │
│  │  [Select]   │  │  [Select]   │  │  [Select]   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Merchant's Code:**
```tsx
// app/pricing/page.tsx
'use client'

import { useState } from 'react'
import { BillingOSProvider, PricingTable, CheckoutModal } from '@billingos/sdk'

export default function PricingPage() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)

  return (
    <BillingOSProvider apiKey={process.env.NEXT_PUBLIC_BILLINGOS_API_KEY}>
      <div className="container mx-auto py-12">
        <h1>Choose Your Plan</h1>

        {/* Step 1: Display pricing plans */}
        <PricingTable
          products={['prod_basic', 'prod_pro', 'prod_enterprise']}
          onSelectPlan={(product) => {
            setSelectedProduct(product)
            setShowCheckout(true)
          }}
        />

        {/* Step 2: Show checkout modal when plan selected */}
        {showCheckout && (
          <CheckoutModal
            productId={selectedProduct.id}
            customerId={user?.id}
            onSuccess={(subscription) => {
              // Step 5: Handle successful payment
              console.log('Subscription created:', subscription)
              setShowCheckout(false)
              router.push('/dashboard?subscribed=true')
            }}
            onClose={() => setShowCheckout(false)}
          />
        )}
      </div>
    </BillingOSProvider>
  )
}
```

**What Happens:**
1. `<PricingTable />` fetches products from `api.billingos.com/products`
2. Renders three plan cards (Basic, Pro, Enterprise)
3. User browses plans, reads features
4. User clicks "Select" button on Pro plan

**Network Activity:**
```http
GET https://api.billingos.com/products
Authorization: Bearer pk_live_abc123

Response:
[
  {
    "id": "prod_basic",
    "name": "Basic",
    "price": 1000,
    "interval": "month",
    "features": ["Feature A", "Feature B"]
  },
  {
    "id": "prod_pro",
    "name": "Pro",
    "price": 4900,
    "interval": "month",
    "features": ["Feature A", "Feature B", "Feature C"]
  }
]
```

---

### Step 2: Checkout Modal Opens

**What User Sees:**
```
┌─────────────────────────────────────────────────────────┐
│  Merchant's App - Pricing Page                          │
│                                                          │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░  ┌───────────────────────────────────────┐  ░░░░░░ │
│  ░░  │    Checkout - Pro Plan                │  ░░░░░░ │
│  ░░  │    $49/month                      [X] │  ░░░░░░ │
│  ░░  │                                        │  ░░░░░░ │
│  ░░  │    Loading payment form...            │  ░░░░░░ │
│  ░░  │    [Spinner animation]                │  ░░░░░░ │
│  ░░  │                                        │  ░░░░░░ │
│  ░░  └───────────────────────────────────────┘  ░░░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────┘
     ↑                                               ↑
   Overlay (dims background)                    Modal dialog
```

**What Happens:**
1. `setShowCheckout(true)` triggers
2. `<CheckoutModal />` component mounts
3. Modal wrapper (React component) renders:
   - Dark overlay (`bg-black/50`)
   - Modal container (`max-w-md`, centered)
   - Loading spinner
4. Modal creates `<iframe>` element pointing to:
   ```
   https://embed.billingos.com/checkout/prod_pro?
     customer=cus_123&
     apiKey=pk_live_abc123
   ```

**Component Implementation:**
```tsx
// Inside @billingos/sdk/src/components/CheckoutModal.tsx

export function CheckoutModal({
  productId,
  customerId,
  onSuccess,
  onClose
}: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      // Security: validate origin
      if (event.origin !== 'https://embed.billingos.com') {
        console.warn('Invalid origin:', event.origin)
        return
      }

      switch (event.data.type) {
        case 'CHECKOUT_LOADED':
          setIsLoading(false)
          break

        case 'CHECKOUT_SUCCESS':
          onSuccess?.(event.data.payload)
          break

        case 'CHECKOUT_CLOSE':
          onClose?.()
          break

        case 'CHECKOUT_ERROR':
          console.error('Checkout error:', event.data.error)
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onSuccess, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md h-[650px] overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          src={`https://embed.billingos.com/checkout/${productId}?customer=${customerId}&apiKey=${process.env.NEXT_PUBLIC_BILLINGOS_API_KEY}`}
          className="w-full h-full border-0"
          allow="payment"  // Enable Web Payments API for Apple Pay
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  )
}
```

---

### Step 3: Payment Form Loads in Iframe

**What User Sees:**
```
┌───────────────────────────────────────────────────────┐
│    Checkout - Pro Plan                           [X]  │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Pro Plan                                             │
│  $49/month                                            │
│                                                       │
│  Features included:                                   │
│  ✓ Feature A                                          │
│  ✓ Feature B                                          │
│  ✓ Feature C                                          │
│                                                       │
│  ─────────────────────────────────────────────────    │
│                                                       │
│  Payment Details                                      │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  1234 5678 9012 3456              [VISA]       │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌──────────────┐  ┌──────┐  ┌─────────────────┐   │
│  │  MM / YY     │  │ CVC  │  │  ZIP            │   │
│  └──────────────┘  └──────┘  └─────────────────┘   │
│                                                       │
│  ─────  OR  ─────────────────────────────────────    │
│                                                       │
│  [  Pay]  [ G Pay]                                   │
│                                                       │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃         Pay $49.00                           ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**What Happens:**
1. Iframe loads Next.js page from your Vercel deployment
2. Page fetches product details from `api.billingos.com/products/prod_pro`
3. Initializes Stripe Payment Element
4. Loads Stripe.js (`https://js.stripe.com/v3/`)
5. Renders payment form with:
   - Card input fields (Stripe Elements)
   - Apple Pay button (if available)
   - Google Pay button (if available)
6. Sends `CHECKOUT_LOADED` message to parent

**Iframe Page Implementation:**
```tsx
// apps/embed/src/app/checkout/[productId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function CheckoutPage({
  params,
  searchParams
}: {
  params: { productId: string }
  searchParams: { customer?: string, apiKey?: string }
}) {
  const [product, setProduct] = useState(null)
  const [clientSecret, setClientSecret] = useState(null)

  useEffect(() => {
    // Notify parent that iframe loaded
    window.parent.postMessage({ type: 'CHECKOUT_LOADED' }, '*')

    // Fetch product details
    fetchProduct()

    // Create payment intent
    createPaymentIntent()
  }, [])

  async function fetchProduct() {
    const response = await fetch(
      `https://api.billingos.com/products/${params.productId}`,
      {
        headers: {
          'Authorization': `Bearer ${searchParams.apiKey}`
        }
      }
    )
    const data = await response.json()
    setProduct(data)
  }

  async function createPaymentIntent() {
    const response = await fetch(
      'https://api.billingos.com/checkout/sessions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${searchParams.apiKey}`
        },
        body: JSON.stringify({
          productId: params.productId,
          customerId: searchParams.customer
        })
      }
    )
    const { clientSecret } = await response.json()
    setClientSecret(clientSecret)
  }

  if (!product || !clientSecret) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <button
        onClick={() => window.parent.postMessage({ type: 'CHECKOUT_CLOSE' }, '*')}
        className="absolute top-4 right-4"
      >
        ✕
      </button>

      <div className="max-w-md mx-auto">
        {/* Product details */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="text-3xl font-bold mt-2">
            ${(product.price / 100).toFixed(2)}
            <span className="text-lg text-gray-600">/{product.interval}</span>
          </p>

          <ul className="mt-4 space-y-2">
            {product.features.map((feature) => (
              <li key={feature} className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Stripe Payment Form */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm product={product} customerId={searchParams.customer} />
        </Elements>
      </div>
    </div>
  )
}

function CheckoutForm({ product, customerId }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMessage(null)

    // Confirm payment with Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // Not used (we handle in-place)
      },
      redirect: 'if_required'  // Don't redirect, handle in-place
    })

    if (error) {
      setErrorMessage(error.message)
      setIsProcessing(false)

      // Notify parent of error
      window.parent.postMessage({
        type: 'CHECKOUT_ERROR',
        error: error.message
      }, '*')
    } else if (paymentIntent.status === 'succeeded') {
      // Payment successful! Create subscription
      const subscription = await createSubscription(paymentIntent.id)

      // Notify parent of success
      window.parent.postMessage({
        type: 'CHECKOUT_SUCCESS',
        payload: subscription
      }, '*')
    }
  }

  async function createSubscription(paymentIntentId: string) {
    const response = await fetch('https://api.billingos.com/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BILLINGOS_API_KEY}`
      },
      body: JSON.stringify({
        customerId,
        productId: product.id,
        paymentIntentId
      })
    })
    return response.json()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Payment Details
        </label>
        {/* Stripe Payment Element (includes card, Apple Pay, Google Pay) */}
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : `Pay $${(product.price / 100).toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Secure payment powered by Stripe
      </p>
    </form>
  )
}
```

**Network Activity:**
```http
# 1. Fetch product details
GET https://api.billingos.com/products/prod_pro
Authorization: Bearer pk_live_abc123

Response:
{
  "id": "prod_pro",
  "name": "Pro",
  "price": 4900,
  "interval": "month",
  "features": ["Feature A", "Feature B", "Feature C"]
}

# 2. Create payment intent
POST https://api.billingos.com/checkout/sessions
Authorization: Bearer pk_live_abc123
Content-Type: application/json

{
  "productId": "prod_pro",
  "customerId": "cus_123"
}

Response:
{
  "clientSecret": "pi_abc123_secret_xyz",
  "sessionId": "cs_test_abc123"
}

# 3. Stripe.js loads payment methods
GET https://js.stripe.com/v3/
GET https://api.stripe.com/v1/payment_methods?client_secret=pi_abc123...
```

---

### Step 4: User Enters Payment Info

**What User Does:**
```
Option A: Card Payment
  1. Enters card number: 4242 4242 4242 4242
  2. Enters expiry: 12/25
  3. Enters CVC: 123
  4. Enters ZIP: 12345
  5. Clicks "Pay $49.00"

Option B: Apple Pay
  1. Clicks  Pay button
  2. Authenticates with Face ID/Touch ID
  3. Confirms payment in Apple Pay sheet

Option C: Google Pay
  1. Clicks G Pay button
  2. Selects saved card
  3. Confirms payment in Google Pay sheet
```

**What Happens (Card Payment):**
1. User types card number in Stripe Element
2. Stripe.js validates card in real-time (live validation)
3. Shows card brand icon (Visa, Mastercard, etc.)
4. User completes all fields
5. User clicks "Pay $49.00" button
6. Form submits → `handleSubmit()` function runs

---

### Step 5: Payment Processing

**What User Sees:**
```
┌───────────────────────────────────────────────────────┐
│    Checkout - Pro Plan                           [X]  │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │                                                 │ │
│  │           Processing payment...                │ │
│  │                                                 │ │
│  │           [Spinner animation]                  │ │
│  │                                                 │ │
│  │      Please don't close this window            │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**What Happens (Backend Flow):**

```
1. stripe.confirmPayment() called in iframe
   ↓
2. Stripe.js sends payment details to Stripe API
   ↓
3. Stripe processes payment (charges card)
   ↓
4. Stripe returns PaymentIntent { status: 'succeeded' }
   ↓
5. Iframe calls api.billingos.com/subscriptions
   ↓
6. BillingOS backend:
   - Verifies payment with Stripe
   - Creates subscription record in database
   - Creates customer record (if new)
   - Sends confirmation email
   - Returns subscription object
   ↓
7. Iframe sends postMessage to parent window
   ↓
8. Parent window receives success message
   ↓
9. Calls onSuccess callback
   ↓
10. Modal closes
```

**Backend Implementation:**
```typescript
// apps/api/src/checkout/checkout.controller.ts

@Controller('checkout')
export class CheckoutController {

  @Post('sessions')
  @UseGuards(ApiKeyGuard)
  async createSession(
    @Body() dto: CreateCheckoutSessionDto,
    @ApiKey() apiKey: string
  ) {
    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: dto.product.price,
      currency: 'usd',
      customer: dto.customerId,
      metadata: {
        productId: dto.productId,
        organizationId: apiKey.organizationId
      }
    })

    return {
      clientSecret: paymentIntent.client_secret,
      sessionId: `cs_${paymentIntent.id}`
    }
  }
}

// apps/api/src/subscriptions/subscriptions.controller.ts

@Controller('subscriptions')
export class SubscriptionsController {

  @Post()
  @UseGuards(ApiKeyGuard)
  async createSubscription(
    @Body() dto: CreateSubscriptionDto,
    @ApiKey() apiKey: string
  ) {
    // Verify payment succeeded
    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      dto.paymentIntentId
    )

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment not completed')
    }

    // Create Stripe subscription
    const stripeSubscription = await this.stripe.subscriptions.create({
      customer: dto.customerId,
      items: [{ price: dto.priceId }],
      payment_behavior: 'default_incomplete',
      default_payment_method: paymentIntent.payment_method
    })

    // Save to database
    const subscription = await this.db.subscriptions.create({
      data: {
        id: stripeSubscription.id,
        customerId: dto.customerId,
        productId: dto.productId,
        status: 'active',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        organizationId: apiKey.organizationId
      }
    })

    // Send confirmation email
    await this.emailService.sendSubscriptionConfirmation(subscription)

    return subscription
  }
}
```

**Network Activity:**
```http
# 1. Stripe confirms payment
POST https://api.stripe.com/v1/payment_intents/pi_abc123/confirm
Authorization: Bearer pk_live_abc123

{
  "payment_method": "pm_card_xyz",
  "return_url": "https://embed.billingos.com/checkout/prod_pro"
}

Response:
{
  "id": "pi_abc123",
  "status": "succeeded",
  "amount": 4900,
  "payment_method": "pm_card_xyz"
}

# 2. Create subscription in BillingOS
POST https://api.billingos.com/subscriptions
Authorization: Bearer pk_live_abc123

{
  "customerId": "cus_123",
  "productId": "prod_pro",
  "paymentIntentId": "pi_abc123"
}

Response:
{
  "id": "sub_xyz789",
  "status": "active",
  "productId": "prod_pro",
  "currentPeriodStart": "2026-01-14T00:00:00Z",
  "currentPeriodEnd": "2026-02-14T00:00:00Z"
}
```

---

### Step 6: Success - Modal Closes

**What User Sees:**
```
Modal disappears ✨

Back to merchant's app:

┌─────────────────────────────────────────────────────────┐
│  Merchant's App - Dashboard                              │
│                                                          │
│  ✅ Subscription activated!                             │
│                                                          │
│  Welcome to Pro Plan                                     │
│  Your subscription is now active.                        │
│                                                          │
│  [Go to Dashboard]                                       │
└─────────────────────────────────────────────────────────┘

User stayed in app the entire time! No redirect occurred.
```

**What Happens:**
```
1. Iframe sends postMessage:
   {
     type: 'CHECKOUT_SUCCESS',
     payload: {
       subscriptionId: 'sub_xyz789',
       status: 'active',
       productId: 'prod_pro',
       currentPeriodEnd: '2026-02-14T00:00:00Z'
     }
   }

2. Parent window receives message
   handleMessage() function runs

3. Calls onSuccess callback:
   onSuccess({ subscriptionId: 'sub_xyz789', ... })

4. Merchant's code runs:
   - Shows success toast/banner
   - Redirects to dashboard: router.push('/dashboard?subscribed=true')
   - Updates local state
   - Refetches user data

5. Modal closes:
   setShowCheckout(false)
   <CheckoutModal /> unmounts
   Iframe removed from DOM
```

---

### Step 7: Real-Time Status Update on Merchant's App

**What User Sees:**
```
┌─────────────────────────────────────────────────────────┐
│  Merchant's App - Dashboard                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Your Subscription                                 │ │
│  │                                                    │ │
│  │  Pro Plan - $49/month                             │ │
│  │  Status: ● Active                                 │ │
│  │  Next billing: Feb 14, 2026                       │ │
│  │                                                    │ │
│  │  [Manage Subscription]  [View Invoice]            │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Available Features                                │ │
│  │  ✓ Feature A                                       │ │
│  │  ✓ Feature B                                       │ │
│  │  ✓ Feature C (newly unlocked!)                     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Merchant's Code (Dashboard):**
```tsx
// app/dashboard/page.tsx
'use client'

import { useSubscription } from '@billingos/sdk'

export default function Dashboard() {
  // Real-time subscription data
  const { data: subscription, isLoading } = useSubscription()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Dashboard</h1>

      {subscription ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2>Your Subscription</h2>
          <p className="text-2xl font-bold">{subscription.product.name}</p>
          <p className="text-gray-600">
            ${(subscription.product.price / 100).toFixed(2)}/{subscription.product.interval}
          </p>

          <div className="flex items-center mt-2">
            <span className="text-green-600 font-semibold">● Active</span>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>

          <div className="mt-6 space-x-4">
            <button className="btn-primary">Manage Subscription</button>
            <button className="btn-secondary">View Invoice</button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-lg">
          <p>No active subscription</p>
          <a href="/pricing" className="btn-primary mt-4">Subscribe Now</a>
        </div>
      )}

      {/* Feature-gated content */}
      <FeatureGate feature="advanced_analytics">
        <AdvancedAnalyticsDashboard />
      </FeatureGate>
    </div>
  )
}
```

**Real-Time Updates via React Query:**
```tsx
// Inside @billingos/sdk/src/hooks/useSubscription.ts

import { useQuery } from '@tanstack/react-query'
import { useBillingOS } from '../providers/BillingOSProvider'

export function useSubscription() {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => client.subscriptions.getCurrent(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true // Refetch when user returns to tab
  })
}
```

---

## Complete Sequence Diagram

```
User          Merchant App       PricingTable    CheckoutModal    Iframe (embed.billingos.com)    API (api.billingos.com)    Stripe
 │                 │                   │               │                      │                            │                    │
 │  Views pricing  │                   │               │                      │                            │                    │
 ├────────────────>│                   │               │                      │                            │                    │
 │                 ├──────────────────>│               │                      │                            │                    │
 │                 │                   ├──────────────────────────────────────────────GET /products────────>│                    │
 │                 │                   │<─────────────────────────────────────────────[products]───────────┤                    │
 │                 │<──────────────────┤               │                      │                            │                    │
 │  Displays plans │                   │               │                      │                            │                    │
 │<────────────────┤                   │               │                      │                            │                    │
 │                 │                   │               │                      │                            │                    │
 │  Clicks "Pro"   │                   │               │                      │                            │                    │
 ├────────────────>│                   │               │                      │                            │                    │
 │                 ├──────────────────>│               │                      │                            │                    │
 │                 │ onSelectPlan()    │               │                      │                            │                    │
 │                 │                   ├──────────────>│                      │                            │                    │
 │                 │                   │ setState(true)│                      │                            │                    │
 │                 │                   │               ├─────────────────────>│                            │                    │
 │                 │                   │               │ Creates iframe       │                            │                    │
 │                 │                   │               │                      ├───────GET /products/prod_pro────────────────────>│
 │                 │                   │               │                      │<──────────[product]──────────────────────────────┤
 │                 │                   │               │                      ├───────POST /checkout/sessions───────────────────>│
 │                 │                   │               │                      │<──────────[clientSecret]─────────────────────────┤
 │                 │                   │               │<─────────────────────┤                            │                    │
 │                 │                   │               │ postMessage: LOADED  │                            │                    │
 │  Shows modal    │                   │               │                      │                            │                    │
 │<────────────────┴───────────────────┴───────────────┤                      │                            │                    │
 │                                                      │  Payment form shown  │                            │                    │
 │                                                      │<─────────────────────┤                            │                    │
 │  Enters card    │                                    │                      │                            │                    │
 ├──────────────────────────────────────────────────────────────────────────>│                            │                    │
 │  Clicks Pay     │                                    │                      │                            │                    │
 ├──────────────────────────────────────────────────────────────────────────>│                            │                    │
 │                 │                                    │                      ├────────────────────────────────stripe.confirmPayment()──>│
 │                 │                                    │                      │                            │<─────[succeeded]────┤
 │                 │                                    │                      ├───────POST /subscriptions──────────────────────>│
 │                 │                                    │                      │                            ├────Create in DB────┤
 │                 │                                    │                      │                            ├────Send email──────┤
 │                 │                                    │                      │<──────[subscription]──────────────────────────┤
 │                 │                                    │<─────────────────────┤                            │                    │
 │                 │<───────────────────────────────────┤ postMessage: SUCCESS │                            │                    │
 │                 │ onSuccess(subscription)            │                      │                            │                    │
 │                 ├──setState(false)                   │                      │                            │                    │
 │                 ├──router.push('/dashboard')         │                      │                            │                    │
 │  Modal closes   │                                    │                      │                            │                    │
 │<────────────────┤                                    │                      │                            │                    │
 │                 │                                    │                      │                            │                    │
 │  Redirects to   │                                    │                      │                            │                    │
 │  dashboard      │                                    │                      │                            │                    │
 ├────────────────>│                                    │                      │                            │                    │
 │                 ├────────────────────────────────────────────────────────────────GET /subscriptions─────>│                    │
 │                 │<───────────────────────────────────────────────────────────────[subscription]─────────┤                    │
 │  Shows active   │                                    │                      │                            │                    │
 │  subscription   │                                    │                      │                            │                    │
 │<────────────────┤                                    │                      │                            │                    │
```

---

## Key Takeaways

### No Redirects
- User **never leaves** merchant's app
- Modal opens → Payment → Modal closes
- Seamless in-app experience

### Iframe Security
- Payment data isolated in iframe
- PCI compliant (SAQ A)
- Card details never touch merchant's JavaScript
- Stripe handles all sensitive data

### Real-Time Updates
- postMessage for instant communication
- React Query for automatic refetching
- User sees updated subscription status immediately

### Payment Methods
- Card (Stripe Elements)
- Apple Pay (Web Payments API)
- Google Pay (Web Payments API)
- All work seamlessly in iframe

### Error Handling
- Card declined → Show error in modal
- Network error → Retry mechanism
- Invalid card → Real-time validation
- All errors handled gracefully without page reload

---

## Implementation Checklist

To implement this flow:

- [ ] Create `<PricingTable />` native React component
- [ ] Create `<CheckoutModal />` iframe wrapper component
- [ ] Build checkout page for iframe (`embed.billingos.com/checkout/[id]`)
- [ ] Implement postMessage communication (parent ↔ iframe)
- [ ] Integrate Stripe Payment Element in iframe
- [ ] Create backend endpoints:
  - [ ] `POST /checkout/sessions` → Create PaymentIntent
  - [ ] `POST /subscriptions` → Create subscription after payment
  - [ ] `GET /subscriptions` → Fetch subscription status
- [ ] Set up Stripe webhook handlers
- [ ] Implement real-time updates with React Query
- [ ] Add error handling and loading states
- [ ] Test all payment methods (card, Apple Pay, Google Pay)
- [ ] Add security headers (CSP, frame-ancestors)
- [ ] Deploy iframe app to Vercel
- [ ] Publish SDK to npm

---

**Complete Flow Time**: ~30-60 seconds from viewing pricing to active subscription
**User Redirects**: 0
**Page Reloads**: 0
**Payment Methods**: Card, Apple Pay, Google Pay
**Security**: PCI Compliant (iframe isolation)
**Developer Experience**: Simple `<CheckoutModal />` component
