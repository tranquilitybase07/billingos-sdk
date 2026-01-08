# Customer Portal Component Specification

## Component: `<CustomerPortal>`

### Purpose
Full-featured subscription management dashboard where customers can:
- View current subscription and usage
- Upgrade/downgrade plans
- Manage payment methods
- Download invoices
- Update billing details
- Cancel subscription

---

## Props Interface

```typescript
interface CustomerPortalProps {
  /**
   * Open/close state (for drawer/modal mode)
   */
  isOpen?: boolean;

  /**
   * Callback when user closes portal
   */
  onClose?: () => void;

  /**
   * Display mode
   * - 'drawer': Slide-in from right (default)
   * - 'modal': Centered modal
   * - 'page': Full-page view
   */
  mode?: 'drawer' | 'modal' | 'page';

  /**
   * Default tab to show
   */
  defaultTab?: 'subscription' | 'invoices' | 'payment' | 'settings';

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark';
}
```

---

## API Endpoint

### GET `/sdk/customer/portal`

**Headers:**
```
X-BillingOS-API-Key: pk_live_xyz123
Authorization: Bearer eyJhbGc... (customer token)
```

**Response:**
```json
{
  "subscription": {
    "id": "sub_xyz789",
    "status": "active",
    "product": {
      "id": "prod_pro_uuid",
      "name": "Professional",
      "description": "For growing businesses"
    },
    "price": {
      "id": "price_pro_monthly",
      "amount": 9900,
      "currency": "usd",
      "interval": "month",
      "intervalCount": 1
    },
    "currentPeriodStart": "2026-01-07T00:00:00Z",
    "currentPeriodEnd": "2026-02-07T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "trialEnd": null,
    "canceledAt": null,
    "features": [
      {
        "id": "feat_api_calls_10k",
        "name": "api_calls_limit",
        "title": "10,000 API calls/month",
        "type": "usage_quota",
        "properties": {
          "limit": 10000,
          "period": "month",
          "unit": "calls"
        },
        "usage": {
          "consumed": 6543,
          "limit": 10000,
          "percentage": 65.43,
          "resetDate": "2026-02-07T00:00:00Z"
        }
      },
      {
        "id": "feat_projects_50",
        "name": "projects_limit",
        "title": "Up to 50 projects",
        "type": "numeric_limit",
        "properties": {
          "limit": 50,
          "unit": "projects"
        },
        "usage": {
          "consumed": 12,
          "limit": 50,
          "percentage": 24
        }
      },
      {
        "id": "feat_priority_support",
        "name": "priority_support",
        "title": "Priority support (24h response)",
        "type": "boolean_flag",
        "properties": {},
        "enabled": true
      },
      {
        "id": "feat_advanced_analytics",
        "name": "advanced_analytics",
        "title": "Advanced analytics dashboard",
        "type": "boolean_flag",
        "properties": {},
        "enabled": true
      }
    ]
  },
  "invoices": [
    {
      "id": "inv_001",
      "number": "INV-2026-001",
      "date": "2026-01-07",
      "dueDate": "2026-01-07",
      "status": "paid",
      "amount": 9900,
      "currency": "usd",
      "pdfUrl": "https://api.billingos.com/v1/invoices/inv_001/pdf",
      "lineItems": [
        {
          "description": "Professional Plan (Jan 7 - Feb 7)",
          "quantity": 1,
          "amount": 9900
        }
      ]
    },
    {
      "id": "inv_002",
      "number": "INV-2025-012",
      "date": "2025-12-07",
      "dueDate": "2025-12-07",
      "status": "paid",
      "amount": 9900,
      "currency": "usd",
      "pdfUrl": "https://api.billingos.com/v1/invoices/inv_002/pdf",
      "lineItems": [
        {
          "description": "Professional Plan (Dec 7 - Jan 7)",
          "quantity": 1,
          "amount": 9900
        }
      ]
    },
    {
      "id": "inv_003",
      "number": "INV-2025-011",
      "date": "2025-11-07",
      "dueDate": "2025-11-07",
      "status": "failed",
      "amount": 9900,
      "currency": "usd",
      "pdfUrl": null,
      "lineItems": [
        {
          "description": "Professional Plan (Nov 7 - Dec 7)",
          "quantity": 1,
          "amount": 9900
        }
      ],
      "failureReason": "Your card was declined."
    }
  ],
  "paymentMethods": [
    {
      "id": "pm_visa1234",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2027
      },
      "isDefault": true
    },
    {
      "id": "pm_mastercard5678",
      "type": "card",
      "card": {
        "brand": "mastercard",
        "last4": "5555",
        "expMonth": 8,
        "expYear": 2026
      },
      "isDefault": false
    }
  ],
  "customer": {
    "id": "cust_abc123",
    "email": "john@example.com",
    "name": "John Doe",
    "billingAddress": {
      "line1": "123 Main St",
      "line2": "Apt 4B",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "country": "US"
    }
  },
  "availablePlans": [
    {
      "id": "prod_starter_uuid",
      "name": "Starter",
      "price": {
        "amount": 2900,
        "currency": "usd",
        "interval": "month"
      },
      "type": "downgrade"
    },
    {
      "id": "prod_enterprise_uuid",
      "name": "Enterprise",
      "price": {
        "amount": 29900,
        "currency": "usd",
        "interval": "month"
      },
      "type": "upgrade"
    }
  ]
}
```

---

## UI Layout

### Drawer Mode (Default)

```
┌──────────────────────────────────────────────────────────────┐
│  [Main App Content]                  │ [X] Subscription      │
│                                       │                       │
│                                       │ [Subscription] [Invoices] [Payment] [Settings]
│                                       │                       │
│                                       │ ━━━━━━━━━━━━━━━━━━━ │
│                                       │                       │
│                                       │ Current Plan          │
│                                       │                       │
│                                       │ Professional          │
│                                       │ $99.00 / month        │
│                                       │                       │
│                                       │ Next billing:         │
│                                       │ February 7, 2026      │
│                                       │                       │
│                                       │ [View Other Plans]    │
│                                       │ [Cancel Subscription] │
│                                       │                       │
│                                       │ ──── Usage ────       │
│                                       │                       │
│                                       │ API Calls             │
│                                       │ [████████████░░░░░░░] │
│                                       │ 6,543 / 10,000 (65%) │
│                                       │ Resets: Feb 7         │
│                                       │                       │
│                                       │ Projects              │
│                                       │ [████░░░░░░░░░░░░░░░] │
│                                       │ 12 / 50 (24%)         │
│                                       │                       │
│                                       │ ──── Features ────    │
│                                       │ ✓ Priority support    │
│                                       │ ✓ Advanced analytics  │
│                                       │                       │
└──────────────────────────────────────────────────────────────┘
```

### Tab Navigation

#### Subscription Tab
```
┌──────────────────────────────────────────────────────────────┐
│  Current Plan: Professional                                  │
│  $99.00 / month                                              │
│                                                               │
│  Status: [✓ Active]                                          │
│  Next billing: February 7, 2026                              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [View Other Plans]  [Cancel Subscription]               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ──── Usage This Billing Period ────                         │
│                                                               │
│  API Calls                                                   │
│  [████████████████████░░░░░░░░] 6,543 / 10,000 (65%)        │
│  Resets in 31 days (Feb 7, 2026)                            │
│  [View Usage History]                                        │
│                                                               │
│  Projects                                                    │
│  [████████░░░░░░░░░░░░░░░░░░░░] 12 / 50 (24%)              │
│                                                               │
│  ──── Included Features ────                                 │
│  ✓ Priority support (24h response)                           │
│  ✓ Advanced analytics dashboard                              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### Invoices Tab
```
┌──────────────────────────────────────────────────────────────┐
│  Invoice History                                             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ INV-2026-001                                           │ │
│  │ January 7, 2026                        $99.00   [PAID] │ │
│  │ Professional Plan (Jan 7 - Feb 7)                      │ │
│  │ [Download PDF]                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ INV-2025-012                                           │ │
│  │ December 7, 2025                       $99.00   [PAID] │ │
│  │ Professional Plan (Dec 7 - Jan 7)                      │ │
│  │ [Download PDF]                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ INV-2025-011                                           │ │
│  │ November 7, 2025                     $99.00   [FAILED] │ │
│  │ ⚠️ Your card was declined.                             │ │
│  │ [Retry Payment]                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  [Load More]                                                 │
└──────────────────────────────────────────────────────────────┘
```

#### Payment Methods Tab
```
┌──────────────────────────────────────────────────────────────┐
│  Payment Methods                                             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [💳 Visa] •••• 4242                          [DEFAULT] │ │
│  │ Expires 12/2027                                        │ │
│  │ [Set as Default] [Remove]                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [💳 Mastercard] •••• 5555                              │ │
│  │ Expires 08/2026                                        │ │
│  │ [Set as Default] [Remove]                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  [+ Add New Payment Method]                                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### Settings Tab
```
┌──────────────────────────────────────────────────────────────┐
│  Account Settings                                            │
│                                                               │
│  ──── Personal Information ────                              │
│                                                               │
│  Name: [John Doe                    ]                        │
│  Email: [john@example.com           ]                        │
│                                                               │
│  ──── Billing Address ────                                   │
│                                                               │
│  Address Line 1: [123 Main St       ]                        │
│  Address Line 2: [Apt 4B            ]                        │
│  City: [San Francisco               ]                        │
│  State: [CA]  ZIP: [94102]                                   │
│  Country: [United States ▼]                                  │
│                                                               │
│  [Save Changes]                                              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Additional Endpoints

### 1. Update Subscription (Upgrade/Downgrade)

**POST** `/sdk/subscriptions/:id/update`

**Request:**
```json
{
  "newPriceId": "price_enterprise_monthly",
  "prorationBehavior": "always_invoice" // or "create_prorations", "none"
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

### 2. Cancel Subscription

**POST** `/sdk/subscriptions/:id/cancel`

**Request:**
```json
{
  "cancelAtPeriodEnd": true, // or false for immediate cancellation
  "cancellationReason": "too_expensive", // optional
  "feedback": "I found a cheaper alternative" // optional
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

### 3. Add Payment Method

**POST** `/sdk/payment-methods`

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

### 4. Delete Payment Method

**DELETE** `/sdk/payment-methods/:id`

**Response:**
```json
{
  "success": true,
  "message": "Payment method removed successfully."
}
```

### 5. Retry Failed Invoice

**POST** `/sdk/invoices/:id/retry`

**Request:**
```json
{
  "paymentMethodId": "pm_visa1234" // optional, uses default if not provided
}
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "inv_003",
    "status": "paid",
    "amount": 9900
  }
}
```

---

## Modals & Dialogs

### View Other Plans Modal

Shows PricingTable component with upgrade/downgrade options:

```
┌──────────────────────────────────────────────────────────────┐
│  [X] Change Your Plan                                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  You're currently on: Professional ($99/mo)                  │
│                                                               │
│  [PricingTable component embedded here]                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Cancel Subscription Modal

```
┌──────────────────────────────────────────────────────────────┐
│  [X] Cancel Subscription                                     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  We're sorry to see you go!                                  │
│                                                               │
│  Help us improve by telling us why:                          │
│                                                               │
│  [ ] Too expensive                                           │
│  [ ] Missing features I need                                 │
│  [ ] Found a better alternative                              │
│  [ ] No longer need the service                              │
│  [ ] Other                                                   │
│                                                               │
│  Additional feedback (optional):                             │
│  [_________________________________________________]         │
│  [_________________________________________________]         │
│                                                               │
│  When would you like to cancel?                              │
│                                                               │
│  (•) Cancel at period end (Feb 7, 2026)                      │
│      You'll keep access until then.                          │
│                                                               │
│  ( ) Cancel immediately                                      │
│      You'll lose access now. No refunds.                     │
│                                                               │
│  [Keep Subscription]  [Confirm Cancellation]                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Add Payment Method Modal

Uses Stripe SetupIntent for adding cards:

```
┌──────────────────────────────────────────────────────────────┐
│  [X] Add Payment Method                                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Card number:  [____  ____  ____  ____]                     │
│                                                               │
│  Expiry: [MM/YY]     CVC: [___]                             │
│                                                               │
│  Cardholder name: [________________]                         │
│                                                               │
│  Billing ZIP: [_____]                                        │
│                                                               │
│  [✓] Set as default payment method                          │
│                                                               │
│  [Cancel]  [Add Card]                                        │
│                                                               │
│  🔒 Secured by Stripe                                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Component States

### Empty States

#### No Subscription
```
┌──────────────────────────────────────────────────────────────┐
│  You don't have an active subscription.                      │
│                                                               │
│  [Browse Plans]                                              │
└──────────────────────────────────────────────────────────────┘
```

#### No Invoices
```
┌──────────────────────────────────────────────────────────────┐
│  No invoices yet.                                            │
│  Your first invoice will appear here after your first        │
│  billing cycle.                                              │
└──────────────────────────────────────────────────────────────┘
```

#### No Payment Methods
```
┌──────────────────────────────────────────────────────────────┐
│  No payment methods on file.                                 │
│                                                               │
│  [+ Add Payment Method]                                      │
└──────────────────────────────────────────────────────────────┘
```

### Warning States

#### Trial Ending Soon
```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️ Your trial ends in 3 days                                │
│  Add a payment method to continue after Feb 10, 2026.        │
│  [Add Payment Method]                                        │
└──────────────────────────────────────────────────────────────┘
```

#### Payment Failed
```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️ Payment Failed                                           │
│  Your last payment was declined. Update your payment method  │
│  to avoid service interruption.                              │
│  [Update Payment Method]  [Retry Payment]                    │
└──────────────────────────────────────────────────────────────┘
```

#### Subscription Canceled
```
┌──────────────────────────────────────────────────────────────┐
│  Your subscription is canceled                               │
│  You'll have access until February 7, 2026.                  │
│  [Reactivate Subscription]                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## TypeScript Types

```typescript
interface Subscription {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  product: Product;
  price: Price;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  canceledAt: string | null;
  features: FeatureWithUsage[];
}

interface FeatureWithUsage {
  id: string;
  name: string;
  title: string;
  type: 'boolean_flag' | 'usage_quota' | 'numeric_limit';
  properties: any;
  usage?: UsageInfo;
  enabled?: boolean;
}

interface UsageInfo {
  consumed: number;
  limit: number;
  percentage: number;
  resetDate?: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  status: 'paid' | 'open' | 'failed' | 'void';
  amount: number;
  currency: string;
  pdfUrl: string | null;
  lineItems: LineItem[];
  failureReason?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  amount: number;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: CardDetails;
  isDefault: boolean;
}

interface CardDetails {
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  last4: string;
  expMonth: number;
  expYear: number;
}

interface Customer {
  id: string;
  email: string;
  name: string;
  billingAddress?: Address;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

---

## Example Usage

```tsx
import { CustomerPortal } from '@billingos/sdk';

// As a drawer (sidebar)
function App() {
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsPortalOpen(true)}>
        Manage Subscription
      </button>

      <CustomerPortal
        isOpen={isPortalOpen}
        onClose={() => setIsPortalOpen(false)}
        mode="drawer"
      />
    </>
  );
}

// As a full page
function BillingPage() {
  return (
    <CustomerPortal mode="page" />
  );
}
```

---

## Testing Checklist

- [ ] Tabs switch correctly
- [ ] Usage bars display accurate percentages
- [ ] Upgrade/downgrade modals work
- [ ] Cancel subscription flow works (both immediate & end of period)
- [ ] Add payment method uses Stripe SetupIntent
- [ ] Remove payment method works (prevents removing default)
- [ ] Invoice PDF downloads work
- [ ] Retry failed payment works
- [ ] Update billing details saves correctly
- [ ] Empty states show when no data
- [ ] Warning states show for trial ending / payment failed
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark theme works
- [ ] Drawer/modal animations smooth

---

## Next Component

After implementing CustomerPortal, move to:
**UpgradeNudge** - See `upgrade-nudge-spec.md`
