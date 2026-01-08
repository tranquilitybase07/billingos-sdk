# Payment Bottom Sheet Component Specification

## Component: `<PaymentBottomSheet>`

### Purpose
Mobile-first slide-up payment widget that displays when user clicks "Buy Now" or "Upgrade". Uses Stripe Elements for payment processing with prominent Apple Pay/Google Pay options.

---

## Props Interface

```typescript
interface PaymentBottomSheetProps {
  /**
   * Price ID to purchase
   */
  priceId: string;

  /**
   * Open/close state
   */
  isOpen: boolean;

  /**
   * Callback when user closes sheet
   */
  onClose: () => void;

  /**
   * Callback when payment succeeds
   */
  onSuccess: (subscriptionId: string) => void;

  /**
   * Optional: Subscription ID if upgrading
   */
  existingSubscriptionId?: string;

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark';
}
```

---

## API Endpoints

### 1. Create Checkout Session

**POST** `/sdk/checkout/create`

**Headers:**
```
X-BillingOS-API-Key: pk_live_xyz123
Authorization: Bearer eyJhbGc... (customer token)
Content-Type: application/json
```

**Request Body:**
```json
{
  "priceId": "price_pro_monthly",
  "customerId": "cust_abc123",
  "existingSubscriptionId": "sub_xyz789" // Optional, for upgrades
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
      "features": [
        "10,000 API calls/month",
        "Priority support (24h)",
        "Advanced analytics dashboard"
      ]
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

### 2. Confirm Checkout

**POST** `/sdk/checkout/:clientSecret/confirm`

**Headers:**
```
X-BillingOS-API-Key: pk_live_xyz123
Authorization: Bearer eyJhbGc... (customer token)
Content-Type: application/json
```

**Request Body:**
```json
{
  "paymentMethodId": "pm_1ABC123" // From Stripe Elements
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

## UI Layout

### New Subscription (No Proration)

```
┌──────────────────────────────────────────────────────────────┐
│                     ▼ Complete Payment                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Subscribing to: Professional Plan                           │
│  $99.00 / month                                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Features Included:                                      ││
│  │ ✓ 10,000 API calls/month                                ││
│  │ ✓ Priority support (24h)                                ││
│  │ ✓ Advanced analytics dashboard                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Amount Due Today:                      $99.00           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │   [🍎 Apple Pay]  [G Google Pay]  [🔗 Link]            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ──────────── or pay with card ────────────                 │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┤
│  │ Card number:  [____  ____  ____  ____]                  │
│  │                                                           │
│  │ Expiry: [MM/YY]     CVC: [___]                          │
│  │                                                           │
│  │ Cardholder name: [________________]                      │
│  └──────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────────┤
│  │ Billing details:                                         │
│  │                                                           │
│  │ Email: john@example.com                                  │
│  │ [✓] Save this card for future payments                  │
│  └──────────────────────────────────────────────────────────┤
│                                                               │
│  [Subscribe - $99.00]                                        │
│                                                               │
│  🔒 Secured by Stripe • Cancel anytime                       │
└──────────────────────────────────────────────────────────────┘
```

### Upgrade with Proration

```
┌──────────────────────────────────────────────────────────────┐
│                     ▼ Complete Payment                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Upgrading to: Enterprise Plan                               │
│  $299.00 / month                                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ New Features:                                           ││
│  │ ✓ Unlimited API calls (was 10,000)                      ││
│  │ ✓ Unlimited projects (was 50)                           ││
│  │ ✓ Dedicated account manager                             ││
│  │ ✓ 99.9% SLA guarantee                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Amount Due Today:                                       ││
│  │                                                         ││
│  │ Enterprise Plan                             $299.00    ││
│  │ Credit (Pro Plan - 18 days remaining)       -$56.00    ││
│  │ ────────────────────────────────────────────────────── ││
│  │ Total Due Now                               $243.00    ││
│  │                                                         ││
│  │ ℹ️  You'll be credited $56.00 for the unused portion   ││
│  │    of your Pro plan.                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │   [🍎 Apple Pay]  [G Google Pay]  [🔗 Link]            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ──────────── or pay with card ────────────                 │
│                                                               │
│  [Payment form - same as above]                              │
│                                                               │
│  [Upgrade Now - $243.00]                                     │
│                                                               │
│  🔒 Secured by Stripe • Your billing date remains Feb 7     │
└──────────────────────────────────────────────────────────────┘
```

---

## Stripe Integration

### Setup Stripe Elements

```tsx
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

function PaymentBottomSheet({ priceId, isOpen, onClose, onSuccess }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [checkoutSession, setCheckoutSession] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch checkout session
      createCheckoutSession(priceId).then(session => {
        setCheckoutSession(session);

        // Initialize Stripe with Connect account
        const stripe = loadStripe(
          session.stripePublishableKey,
          {
            stripeAccount: session.stripeAccountId
          }
        );
        setStripePromise(stripe);
      });
    }
  }, [isOpen, priceId]);

  if (!checkoutSession || !stripePromise) {
    return <LoadingSpinner />;
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: checkoutSession.clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#3B82F6'
            }
          }
        }}
      >
        <PaymentForm
          checkoutSession={checkoutSession}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </Elements>
    </Drawer>
  );
}
```

### Payment Form Component

```tsx
function PaymentForm({ checkoutSession, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Confirm payment with Stripe
    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/billing/success'
      },
      redirect: 'if_required'
    });

    if (submitError) {
      setError(submitError.message);
      setIsProcessing(false);
      return;
    }

    // Confirm with BillingOS backend
    try {
      const result = await confirmCheckout(checkoutSession.clientSecret);
      onSuccess(result.subscriptionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Express Checkout (Apple Pay, Google Pay) */}
      <ExpressCheckoutElement
        options={{
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          }
        }}
        onConfirm={handleExpressCheckout}
      />

      <div className="separator">or pay with card</div>

      {/* Card Payment Form */}
      <PaymentElement />

      {/* Error Message */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Submit Button */}
      <button type="submit" disabled={!stripe || isProcessing}>
        {isProcessing ? (
          'Processing...'
        ) : (
          `Subscribe - $${(checkoutSession.proration?.total || checkoutSession.amount) / 100}`
        )}
      </button>

      <div className="security-badge">
        🔒 Secured by Stripe
      </div>
    </form>
  );
}
```

---

## Animation & Behavior

### Opening Animation
1. Overlay fades in (300ms ease)
2. Sheet slides up from bottom (400ms ease-out)
3. Content fades in (200ms delay)

### Closing Animation
1. Content fades out (150ms)
2. Sheet slides down (300ms ease-in)
3. Overlay fades out (200ms)

### Prevent Accidental Close
- Show confirmation dialog if user tries to close during payment processing
- "Are you sure? Your payment is being processed."

### Mobile Gestures
- Swipe down to close (if not processing payment)
- Pull-to-close threshold: 80px drag

---

## Component States

### 1. Loading
```
┌──────────────────────────────────────────────────────────────┐
│  Loading payment details...                                  │
│  [Spinner]                                                   │
└──────────────────────────────────────────────────────────────┘
```

### 2. Ready
- Show all content
- Payment form interactive

### 3. Processing
```
┌──────────────────────────────────────────────────────────────┐
│  Processing payment...                                       │
│  [Progress spinner]                                          │
│  Please don't close this window                              │
└──────────────────────────────────────────────────────────────┘
```

### 4. Success
```
┌──────────────────────────────────────────────────────────────┐
│  ✅ Payment Successful!                                      │
│                                                               │
│  Your subscription to Professional is now active.            │
│                                                               │
│  [Close]                                                     │
└──────────────────────────────────────────────────────────────┘
```

### 5. Error
```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️ Payment Failed                                           │
│                                                               │
│  Your card was declined. Please try a different card.        │
│                                                               │
│  [Try Again]  [Use Different Card]                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (>= 768px)
- Sheet appears centered as modal (not bottom sheet)
- Max width: 500px
- Rounded corners on all sides

### Mobile (< 768px)
- Full-width bottom sheet
- Rounded corners on top only
- Swipe-to-close enabled
- Takes up 80% of viewport height

---

## Error Handling

### Payment Errors

| Error Code | Message | Action |
|------------|---------|--------|
| `card_declined` | Your card was declined. | Try different card |
| `insufficient_funds` | Insufficient funds. | Try different card |
| `expired_card` | Your card has expired. | Update card details |
| `incorrect_cvc` | Incorrect CVC code. | Re-enter CVC |
| `processing_error` | Payment processing error. | Retry payment |
| `network_error` | Connection failed. | Check internet |

### API Errors

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Example
{
  "code": "subscription_already_active",
  "message": "You already have an active subscription to this plan.",
  "details": {
    "currentSubscriptionId": "sub_xyz"
  }
}
```

---

## Accessibility

- **Focus trap:** Focus stays within sheet when open
- **ESC key:** Closes sheet (with confirmation if processing)
- **ARIA labels:**
  - `role="dialog"` on sheet
  - `aria-labelledby="payment-title"`
  - `aria-describedby="payment-description"`
- **Screen reader:** Announce amount and features clearly

---

## Security Considerations

### PCI Compliance
- **Never** collect card details directly
- Use Stripe Elements (iframe) for all payment input
- Card data never touches your servers

### Stripe Connect
- Always pass `stripeAccount` parameter
- Uses merchant's Connect account ID
- Platform fee applied automatically (if configured)

### Customer Token Validation
- Verify token on every checkout creation
- Short TTL prevents replay attacks

---

## TypeScript Types

```typescript
interface CheckoutSession {
  id: string;
  clientSecret: string;
  amount: number; // in cents
  currency: string;
  proration?: ProrationDetails;
  product: ProductSummary;
  customer: CustomerInfo;
  stripePublishableKey: string;
  stripeAccountId: string;
}

interface ProrationDetails {
  credited: number; // cents
  charged: number; // cents
  total: number; // cents
  explanation: string;
}

interface ProductSummary {
  name: string;
  interval: 'month' | 'year';
  features: string[];
}

interface CustomerInfo {
  email: string;
  name: string;
}

interface PaymentResult {
  success: boolean;
  subscriptionId: string;
  status: 'active' | 'trialing';
  message: string;
}
```

---

## Example Usage

```tsx
import { PaymentBottomSheet } from '@billingos/sdk';

function PricingPage() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState(null);

  const handleSelectPlan = (priceId) => {
    setSelectedPriceId(priceId);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (subscriptionId) => {
    console.log('Subscription created:', subscriptionId);
    setIsPaymentOpen(false);
    // Show success message, redirect, etc.
  };

  return (
    <>
      <PricingTable onSelectPlan={handleSelectPlan} />

      <PaymentBottomSheet
        priceId={selectedPriceId}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
```

---

## Testing Checklist

- [ ] Opens with slide-up animation
- [ ] Fetches checkout session on mount
- [ ] Shows proration for upgrades
- [ ] Apple Pay button appears on iOS
- [ ] Google Pay button appears on Android/Chrome
- [ ] Card form validates correctly
- [ ] Submit button disabled during processing
- [ ] Error messages display for failed payments
- [ ] Success state shows after payment
- [ ] Closes with confirmation if processing
- [ ] Swipe-to-close works on mobile
- [ ] ESC key closes sheet
- [ ] Focus trap works correctly
- [ ] Works in dark theme

---

## Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
Expired card: 4000 0000 0000 0069

Any future expiry (12/34)
Any CVC (123)
```

---

## Next Component

After implementing PaymentBottomSheet, move to:
**CustomerPortal** - See `customer-portal-spec.md`
