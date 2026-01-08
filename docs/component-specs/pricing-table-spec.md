# Pricing Table Component Specification

## Component: `<PricingTable>`

### Purpose
Display all subscription plans in a grid with features, pricing, and purchase/upgrade buttons. Shows current plan if customer has an active subscription.

---

## Props Interface

```typescript
interface PricingTableProps {
  /**
   * Optional: Override which plans to show
   * If not provided, shows all active plans
   */
  planIds?: string[];

  /**
   * Optional: Billing interval toggle
   * Default: true (shows monthly/yearly toggle)
   */
  showIntervalToggle?: boolean;

  /**
   * Optional: Default interval
   * Default: 'month'
   */
  defaultInterval?: 'month' | 'year';

  /**
   * Callback when user clicks Buy/Upgrade button
   * Opens PaymentBottomSheet automatically if not provided
   */
  onSelectPlan?: (priceId: string) => void;

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark';
}
```

---

## API Endpoint

### GET `/sdk/products`

**Headers:**
```
X-BillingOS-API-Key: pk_live_xyz123
Authorization: Bearer eyJhbGc... (customer token)
```

**Query Parameters:**
```
organizationId: string (extracted from API key internally)
```

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
        },
        {
          "id": "price_starter_yearly",
          "amount": 29000,
          "currency": "usd",
          "interval": "year",
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
        },
        {
          "id": "feat_projects_5",
          "name": "projects_limit",
          "title": "Up to 5 projects",
          "type": "numeric_limit",
          "properties": {
            "limit": 5,
            "unit": "projects"
          }
        },
        {
          "id": "feat_basic_support",
          "name": "basic_support",
          "title": "Email support",
          "type": "boolean_flag",
          "properties": {}
        }
      ],
      "isCurrentPlan": false,
      "trialDays": 14
    },
    {
      "id": "prod_pro_uuid",
      "name": "Professional",
      "description": "For growing businesses",
      "prices": [
        {
          "id": "price_pro_monthly",
          "amount": 9900,
          "currency": "usd",
          "interval": "month",
          "intervalCount": 1
        },
        {
          "id": "price_pro_yearly",
          "amount": 99000,
          "currency": "usd",
          "interval": "year",
          "intervalCount": 1
        }
      ],
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
          }
        },
        {
          "id": "feat_priority_support",
          "name": "priority_support",
          "title": "Priority support (24h response)",
          "type": "boolean_flag",
          "properties": {}
        },
        {
          "id": "feat_advanced_analytics",
          "name": "advanced_analytics",
          "title": "Advanced analytics dashboard",
          "type": "boolean_flag",
          "properties": {}
        }
      ],
      "isCurrentPlan": true,
      "trialDays": 14
    },
    {
      "id": "prod_enterprise_uuid",
      "name": "Enterprise",
      "description": "For large organizations",
      "prices": [
        {
          "id": "price_enterprise_monthly",
          "amount": 29900,
          "currency": "usd",
          "interval": "month",
          "intervalCount": 1
        }
      ],
      "features": [
        {
          "id": "feat_api_calls_unlimited",
          "name": "api_calls_limit",
          "title": "Unlimited API calls",
          "type": "usage_quota",
          "properties": {
            "limit": -1,
            "period": "month",
            "unit": "calls"
          }
        },
        {
          "id": "feat_projects_unlimited",
          "name": "projects_limit",
          "title": "Unlimited projects",
          "type": "numeric_limit",
          "properties": {
            "limit": -1,
            "unit": "projects"
          }
        },
        {
          "id": "feat_dedicated_support",
          "name": "dedicated_support",
          "title": "Dedicated account manager",
          "type": "boolean_flag",
          "properties": {}
        },
        {
          "id": "feat_sla",
          "name": "sla_99_9",
          "title": "99.9% SLA guarantee",
          "type": "boolean_flag",
          "properties": {}
        }
      ],
      "isCurrentPlan": false,
      "trialDays": 0
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

---

## UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│                      Choose Your Plan                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Billing: [● Monthly] [ Yearly (Save 17%)]                  │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  STARTER    │  │     PRO     │  │ ENTERPRISE  │         │
│  │             │  │ [CURRENT ✓] │  │             │         │
│  │    $29/mo   │  │   $99/mo    │  │   $299/mo   │         │
│  │             │  │             │  │             │         │
│  │ Perfect for │  │ For growing │  │ For large   │         │
│  │ small teams │  │ businesses  │  │ orgs        │         │
│  │             │  │             │  │             │         │
│  │ ─────────── │  │ ─────────── │  │ ─────────── │         │
│  │             │  │             │  │             │         │
│  │ Features:   │  │ Features:   │  │ Features:   │         │
│  │             │  │             │  │             │         │
│  │ ✓ 1,000 API │  │ ✓ 10,000 API│  │ ✓ Unlimited │         │
│  │   calls/mo  │  │   calls/mo  │  │   API calls │         │
│  │             │  │             │  │             │         │
│  │ ✓ Up to 5   │  │ ✓ Up to 50  │  │ ✓ Unlimited │         │
│  │   projects  │  │   projects  │  │   projects  │         │
│  │             │  │             │  │             │         │
│  │ ✓ Email     │  │ ✓ Priority  │  │ ✓ Dedicated │         │
│  │   support   │  │   support   │  │   manager   │         │
│  │             │  │   (24h)     │  │             │         │
│  │             │  │             │  │ ✓ 99.9% SLA │         │
│  │             │  │ ✓ Advanced  │  │   guarantee │         │
│  │             │  │   analytics │  │             │         │
│  │             │  │             │  │             │         │
│  │             │  │             │  │             │         │
│  │ [Buy Now]   │  │ [Current]   │  │ [Upgrade]   │         │
│  │ 14-day      │  │             │  │             │         │
│  │ free trial  │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  All plans include 30-day money-back guarantee              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component States

### 1. Loading State
```
┌──────────────────────────────────────────────────────────────┐
│  Loading plans...                                            │
│  [Skeleton cards]                                            │
└──────────────────────────────────────────────────────────────┘
```

### 2. No Current Subscription
- All plans show "Buy Now" button
- Trial badge shown if `trialDays > 0`

### 3. Has Current Subscription
- Current plan shows "Current Plan" badge
- Higher-tier plans show "Upgrade" button
- Lower-tier plans show "Downgrade" button (or hidden)

### 4. Error State
```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️ Failed to load plans                                     │
│  [Retry Button]                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Behavior

### Monthly/Yearly Toggle

When user toggles interval:
- Show prices for selected interval
- Calculate savings for yearly (e.g., "Save 17%")
- Update button to select yearly price ID

### Click "Buy Now"

1. If `onSelectPlan` prop provided:
   - Call `onSelectPlan(priceId)`
   - Parent handles next step

2. If no `onSelectPlan` prop:
   - Automatically open `<PaymentBottomSheet>` with selected price
   - Pass proration data if upgrade

### Click "Upgrade"

1. Calculate proration preview
2. Open `<PaymentBottomSheet>` with:
   - Selected price ID
   - Proration breakdown
   - Current subscription ID

### Click "Current Plan"

- No action (disabled button)
- Could optionally open Customer Portal

---

## TypeScript Types

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
  features: Feature[];
  isCurrentPlan: boolean;
  trialDays: number;
}

interface Price {
  id: string;
  amount: number; // in cents
  currency: string;
  interval: 'month' | 'year' | 'week' | 'day';
  intervalCount: number;
}

interface Feature {
  id: string;
  name: string; // Technical key
  title: string; // Display name
  type: 'boolean_flag' | 'usage_quota' | 'numeric_limit';
  properties: FeatureProperties;
}

interface FeatureProperties {
  limit?: number; // -1 for unlimited
  period?: 'month' | 'year';
  unit?: string; // e.g., 'calls', 'projects'
}

interface CurrentSubscription {
  id: string;
  productId: string;
  priceId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodEnd: string; // ISO 8601
  cancelAtPeriodEnd: boolean;
}
```

---

## Styling Guidelines

### Card Layout
- **Width:** 320px per card
- **Gap:** 24px between cards
- **Padding:** 32px inside card
- **Border:** 1px solid, highlight current plan with thicker border (2px)
- **Shadow:** Subtle shadow, stronger on hover

### Typography
- **Plan name:** 24px, bold
- **Price:** 36px, bold
- **Interval:** 16px, regular
- **Description:** 14px, gray
- **Features:** 14px, regular, with checkmark icon

### Colors (Light Theme)
- **Background:** White (#FFFFFF)
- **Border:** Gray-200 (#E5E7EB)
- **Current plan border:** Blue-500 (#3B82F6)
- **Text primary:** Gray-900 (#111827)
- **Text secondary:** Gray-600 (#4B5563)
- **Button primary:** Blue-600 (#2563EB)
- **Button hover:** Blue-700 (#1D4ED8)

### Colors (Dark Theme)
- **Background:** Gray-900 (#111827)
- **Border:** Gray-700 (#374151)
- **Current plan border:** Blue-400 (#60A5FA)
- **Text primary:** White (#FFFFFF)
- **Text secondary:** Gray-400 (#9CA3AF)
- **Button primary:** Blue-500 (#3B82F6)
- **Button hover:** Blue-600 (#2563EB)

---

## Responsive Behavior

### Desktop (>= 1024px)
- 3 columns (3 plans side-by-side)
- Cards: 320px width

### Tablet (768px - 1023px)
- 2 columns (2 plans per row)
- Cards: flexible width

### Mobile (< 768px)
- 1 column (stacked)
- Cards: full width
- Horizontal scroll if more than 3 plans (not ideal, but acceptable)

---

## Accessibility

- **Keyboard navigation:** Tab through cards, Enter to select
- **ARIA labels:**
  - `role="group"` on each card
  - `aria-label="Starter plan, $29 per month, 3 features"`
  - `aria-current="true"` on current plan
- **Focus states:** Clear focus ring on all interactive elements
- **Screen reader:** Announce current plan status

---

## Example Usage

```tsx
import { PricingTable } from '@billingos/sdk';

// Basic usage (shows all plans)
<PricingTable />

// Custom plans only
<PricingTable planIds={['prod_starter', 'prod_pro']} />

// Default to yearly
<PricingTable defaultInterval="year" />

// Custom callback
<PricingTable
  onSelectPlan={(priceId) => {
    console.log('User selected:', priceId);
    // Custom logic here
  }}
/>

// Dark theme
<PricingTable theme="dark" />
```

---

## Database Tables Used

### Products
```sql
SELECT id, name, description, recurring_interval, trial_days
FROM products
WHERE organization_id = $1 AND is_archived = false;
```

### Product Prices
```sql
SELECT id, product_id, amount_type, price_amount, price_currency
FROM product_prices
WHERE product_id IN ($1, $2, $3) AND is_archived = false;
```

### Features
```sql
SELECT f.id, f.name, f.title, f.type, f.properties
FROM features f
JOIN product_features pf ON f.id = pf.feature_id
WHERE pf.product_id IN ($1, $2, $3)
ORDER BY pf.display_order;
```

### Subscriptions (for current plan)
```sql
SELECT id, product_id, status, current_period_end, cancel_at_period_end
FROM subscriptions
WHERE customer_id = $1 AND status = 'active'
LIMIT 1;
```

---

## Testing Checklist

- [ ] Shows all products from API
- [ ] Monthly/yearly toggle works
- [ ] Current plan badge displays correctly
- [ ] Buy Now button opens payment sheet
- [ ] Upgrade button calculates proration
- [ ] Trial badge shows when `trialDays > 0`
- [ ] Loading state shows skeletons
- [ ] Error state shows retry button
- [ ] Responsive on mobile/tablet/desktop
- [ ] Keyboard navigation works
- [ ] Dark theme renders correctly
- [ ] Unlimited features show "Unlimited" not "-1"

---

## Next Component

After implementing PricingTable, move to:
**PaymentBottomSheet** - See `payment-bottom-sheet-spec.md`
