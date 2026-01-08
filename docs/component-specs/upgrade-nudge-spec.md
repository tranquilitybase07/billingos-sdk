# Upgrade Nudge Component Specification

## Component: `<UpgradeNudge>`

### Purpose
Proactive notification that appears when user approaches usage limits or would benefit from upgrading. Shows relevant plan and features with a quick upgrade button.

---

## Props Interface

```typescript
interface UpgradeNudgeProps {
  /**
   * Nudge trigger data (from API or usage check)
   */
  trigger: NudgeTrigger;

  /**
   * Display style
   * - 'banner': Top banner (non-intrusive)
   * - 'toast': Toast notification (bottom-right)
   * - 'modal': Modal dialog (more prominent)
   */
  style?: 'banner' | 'toast' | 'modal';

  /**
   * Auto-dismiss after N seconds (0 = no auto-dismiss)
   */
  autoDismiss?: number;

  /**
   * Callback when user clicks upgrade
   */
  onUpgrade?: (priceId: string) => void;

  /**
   * Callback when user dismisses nudge
   */
  onDismiss?: () => void;

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark';
}

interface NudgeTrigger {
  type: 'usage_threshold' | 'feature_access' | 'time_based' | 'custom';
  feature?: string; // Which feature triggered (e.g., 'api_calls_limit')
  threshold?: number; // e.g., 80 (percent)
  actual?: number; // e.g., 85.2 (percent)
  message: NudgeMessage;
  suggestedPlan: SuggestedPlan;
}

interface NudgeMessage {
  title: string;
  body: string;
  cta: string; // Call-to-action button text
}

interface SuggestedPlan {
  id: string;
  name: string;
  price: {
    amount: number;
    currency: string;
    interval: string;
  };
  highlights: string[]; // Key features/benefits
}
```

---

## API Endpoint

### GET `/sdk/usage/check`

**Headers:**
```
X-BillingOS-API-Key: pk_live_xyz123
Authorization: Bearer eyJhbGc... (customer token)
```

**Response:**
```json
{
  "shouldShowNudge": true,
  "trigger": {
    "type": "usage_threshold",
    "feature": "api_calls_limit",
    "threshold": 80,
    "actual": 85.2,
    "message": {
      "title": "You're running low on API calls",
      "body": "You've used 85% of your monthly limit. Upgrade to Pro to get 10x more calls and avoid interruptions.",
      "cta": "Upgrade to Pro"
    },
    "suggestedPlan": {
      "id": "prod_pro_uuid",
      "priceId": "price_pro_monthly",
      "name": "Professional",
      "price": {
        "amount": 9900,
        "currency": "usd",
        "interval": "month"
      },
      "highlights": [
        "10,000 API calls/month (10x more)",
        "Up to 50 projects (10x more)",
        "Priority support (24h response)"
      ]
    }
  }
}
```

---

## UI Layouts

### 1. Banner Style (Top of Page)

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  You're running low on API calls                        │
│  You've used 85% of your monthly limit. Upgrade to Pro to   │
│  get 10x more calls and avoid interruptions.                 │
│  [Upgrade to Pro →]  [Maybe Later]                          │
└──────────────────────────────────────────────────────────────┘
```

### 2. Toast Style (Bottom-Right Corner)

```
                                ┌──────────────────────────────┐
                                │ [X]                          │
                                │ ⚠️ Running low on API calls  │
                                │                              │
                                │ You've used 85% of your      │
                                │ limit. Upgrade to get 10x    │
                                │ more.                        │
                                │                              │
                                │ [Upgrade to Pro]             │
                                └──────────────────────────────┘
```

### 3. Modal Style (Centered, Most Prominent)

```
┌──────────────────────────────────────────────────────────────┐
│  [X] Upgrade Your Plan                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ⚠️  You're running low on API calls                         │
│                                                               │
│  You've used 8,520 of 10,000 API calls this month (85%).    │
│  Upgrade to Professional to get more capacity.               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Professional                         ││
│  │                    $99 / month                          ││
│  │                                                         ││
│  │  What you'll get:                                       ││
│  │  ✓ 10,000 API calls/month (10x more)                   ││
│  │  ✓ Up to 50 projects (10x more)                        ││
│  │  ✓ Priority support (24h response)                     ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [Upgrade Now - $99/mo]  [Maybe Later]                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Nudge Triggers

### 1. Usage Threshold

Trigger when feature usage exceeds threshold:

```json
{
  "type": "usage_threshold",
  "feature": "api_calls_limit",
  "threshold": 80,
  "actual": 85.2,
  "message": {
    "title": "You're running low on API calls",
    "body": "You've used 85% of your monthly limit. Upgrade to Pro to get 10x more calls.",
    "cta": "Upgrade to Pro"
  }
}
```

**Recommended thresholds:**
- 80% - First warning (non-intrusive banner)
- 90% - Second warning (toast notification)
- 95% - Final warning (modal, more urgent)
- 100% - Hard limit reached (modal, blocking)

### 2. Feature Access

Trigger when user tries to use a premium feature:

```json
{
  "type": "feature_access",
  "feature": "advanced_analytics",
  "message": {
    "title": "Unlock Advanced Analytics",
    "body": "Advanced analytics is available on Pro and Enterprise plans. Get detailed insights into your usage patterns.",
    "cta": "Upgrade to Pro"
  },
  "suggestedPlan": {
    "name": "Professional",
    "highlights": [
      "Advanced analytics dashboard",
      "Custom reports",
      "Data export"
    ]
  }
}
```

### 3. Time-Based

Trigger at specific times (e.g., trial ending):

```json
{
  "type": "time_based",
  "message": {
    "title": "Your trial ends in 3 days",
    "body": "Add a payment method to continue using Professional features after your trial ends.",
    "cta": "Add Payment Method"
  }
}
```

### 4. Custom Triggers

Merchant-defined triggers:

```json
{
  "type": "custom",
  "message": {
    "title": "New Feature: Team Collaboration",
    "body": "Collaborate with your team! Upgrade to Pro to add team members and share projects.",
    "cta": "Learn More"
  }
}
```

---

## Behavior & Rules

### Display Logic

```typescript
// When to show nudge
function shouldShowNudge(usage, subscription): boolean {
  // Don't show if already on highest tier
  if (subscription.product.name === 'Enterprise') {
    return false;
  }

  // Check usage thresholds
  for (const feature of subscription.features) {
    if (feature.type === 'usage_quota' && feature.usage) {
      const percentage = feature.usage.percentage;

      // Show at 80%, 90%, 95%, 100%
      if (percentage >= 80) {
        return true;
      }
    }
  }

  // Check trial ending
  if (subscription.status === 'trialing' && subscription.trialEnd) {
    const daysLeft = daysBetween(new Date(), subscription.trialEnd);
    if (daysLeft <= 3) {
      return true;
    }
  }

  return false;
}
```

### Dismissal Rules

- **Banner:** User can dismiss, don't show again for 24 hours
- **Toast:** Auto-dismiss after 10 seconds, or user can dismiss
- **Modal:** Must be explicitly dismissed by user

### Frequency Limits

Don't annoy users:
- Max 1 nudge per 24 hours (same trigger)
- Max 3 nudges per week (different triggers)
- Never show nudge during onboarding (first 7 days)
- Never show nudge if user dismissed < 24 hours ago

### Priority Order

If multiple triggers active, show in this order:
1. **Hard limit reached** (100% usage) - Modal, urgent
2. **Trial ending** (< 3 days) - Banner
3. **High usage** (90%+) - Toast
4. **Feature access** - Toast
5. **Moderate usage** (80%+) - Banner
6. **Custom** - Banner

---

## Component States

### Loading
```
┌──────────────────────────────────────────────────────────────┐
│  Checking usage...                                           │
└──────────────────────────────────────────────────────────────┘
```

### Shown
Display nudge based on trigger

### Dismissed
Hidden, store dismissal timestamp

### Upgraded
After user clicks upgrade and completes payment:
```
┌──────────────────────────────────────────────────────────────┐
│  ✅ Upgrade Successful!                                      │
│  You're now on the Professional plan. Enjoy your new limits! │
│  [Close]                                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Animation & Transitions

### Banner
- Slide down from top (300ms ease-out)
- Dismiss: Slide up (200ms ease-in)

### Toast
- Slide up from bottom-right (400ms ease-out)
- Auto-dismiss: Fade out + slide down (300ms)

### Modal
- Overlay fade in (200ms)
- Content scale + fade in (300ms)
- Dismiss: Reverse animation

---

## Accessibility

- **Keyboard:** ESC key dismisses
- **Screen reader:** Announce nudge title and message
- **Focus trap:** Modal captures focus
- **ARIA:**
  - `role="alert"` for urgent nudges (100% usage)
  - `role="status"` for informational nudges
  - `aria-live="polite"` for toast

---

## TypeScript Implementation

```typescript
import { useState, useEffect } from 'react';

export function UpgradeNudge({ trigger, style = 'banner', autoDismiss = 0, onUpgrade, onDismiss, theme }: UpgradeNudgeProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss timer
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismiss * 1000);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);

    // Store dismissal timestamp
    const dismissalKey = `nudge_dismissed_${trigger.type}_${trigger.feature}`;
    localStorage.setItem(dismissalKey, Date.now().toString());

    onDismiss?.();
  };

  const handleUpgrade = () => {
    // Open payment sheet with suggested plan
    onUpgrade?.(trigger.suggestedPlan.priceId);
  };

  if (!isVisible) return null;

  switch (style) {
    case 'banner':
      return <BannerNudge {...trigger} onUpgrade={handleUpgrade} onDismiss={handleDismiss} />;
    case 'toast':
      return <ToastNudge {...trigger} onUpgrade={handleUpgrade} onDismiss={handleDismiss} />;
    case 'modal':
      return <ModalNudge {...trigger} onUpgrade={handleUpgrade} onDismiss={handleDismiss} />;
  }
}

// Check if nudge was recently dismissed
function wasRecentlyDismissed(trigger: NudgeTrigger): boolean {
  const dismissalKey = `nudge_dismissed_${trigger.type}_${trigger.feature}`;
  const dismissedAt = localStorage.getItem(dismissalKey);

  if (!dismissedAt) return false;

  const hoursSinceDismissal = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
  return hoursSinceDismissal < 24;
}
```

---

## Usage Tracking

Track nudge interactions for analytics:

```typescript
// When nudge is shown
trackEvent('nudge_shown', {
  trigger: trigger.type,
  feature: trigger.feature,
  style: style,
  suggestedPlan: trigger.suggestedPlan.name
});

// When user clicks upgrade
trackEvent('nudge_upgrade_clicked', {
  trigger: trigger.type,
  suggestedPlan: trigger.suggestedPlan.name
});

// When user dismisses
trackEvent('nudge_dismissed', {
  trigger: trigger.type,
  feature: trigger.feature
});
```

---

## Example Usage

```tsx
import { UpgradeNudge, useUsageCheck } from '@billingos/sdk';

function App() {
  const { nudgeTrigger, isLoading } = useUsageCheck();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState(null);

  if (isLoading) return null;

  return (
    <>
      {/* Main app content */}
      <div>Your app...</div>

      {/* Upgrade nudge (shows automatically when triggered) */}
      {nudgeTrigger && (
        <UpgradeNudge
          trigger={nudgeTrigger}
          style="toast"
          autoDismiss={10}
          onUpgrade={(priceId) => {
            setSelectedPriceId(priceId);
            setIsPaymentOpen(true);
          }}
        />
      )}

      {/* Payment bottom sheet */}
      <PaymentBottomSheet
        priceId={selectedPriceId}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />
    </>
  );
}
```

---

## Testing Scenarios

### Test Cases

1. **80% Usage Threshold**
   - Set API calls to 8,000 / 10,000
   - Verify banner nudge appears
   - Verify dismisses for 24 hours

2. **90% Usage Threshold**
   - Set API calls to 9,000 / 10,000
   - Verify toast nudge appears
   - Verify auto-dismisses after 10 seconds

3. **100% Usage (Hard Limit)**
   - Set API calls to 10,000 / 10,000
   - Verify modal nudge appears (urgent)
   - Verify cannot be auto-dismissed

4. **Feature Access**
   - Try to access "Advanced Analytics" on Starter plan
   - Verify modal showing upgrade prompt

5. **Trial Ending**
   - Set trial end date to 2 days from now
   - Verify banner appears with payment method CTA

6. **Recent Dismissal**
   - Dismiss nudge
   - Trigger same nudge within 24 hours
   - Verify does not appear

7. **Multiple Triggers**
   - Trigger both 90% usage AND feature access
   - Verify only highest priority nudge shows

---

## Customization Options

Merchants can configure nudge behavior:

```typescript
// In BillingOSProvider

<BillingOSProvider
  apiKey="pk_live_..."
  customerToken="..."
  nudgeConfig={{
    enabled: true,
    styles: ['banner', 'toast'], // Disable modals
    thresholds: [85, 95], // Custom thresholds (instead of 80, 90, 95)
    dismissalHours: 48, // Don't show for 48 hours after dismissal
    maxPerWeek: 2 // Max 2 nudges per week
  }}
>
```

---

## Database Tables Used

### Usage Records
```sql
SELECT consumed_units, limit_units
FROM usage_records
WHERE customer_id = $1
  AND feature_id = $2
  AND period_start <= NOW()
  AND period_end >= NOW();
```

### Subscriptions
```sql
SELECT status, trial_end, product_id
FROM subscriptions
WHERE customer_id = $1 AND status = 'active';
```

---

## Testing Checklist

- [ ] Banner nudge displays at 80% usage
- [ ] Toast nudge displays at 90% usage
- [ ] Modal nudge displays at 100% usage
- [ ] Feature access nudge works
- [ ] Trial ending nudge shows 3 days before
- [ ] Dismissal stores timestamp correctly
- [ ] Auto-dismiss works (toast only)
- [ ] Upgrade button opens payment sheet
- [ ] Frequency limits respected (max 1/day, 3/week)
- [ ] Priority order works (urgent nudges first)
- [ ] Animations smooth
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Dark theme works

---

## Summary

The UpgradeNudge component is:
- **Proactive** - Shows automatically based on usage
- **Contextual** - Suggests relevant plan based on trigger
- **Non-intrusive** - Uses banners/toasts, not blocking modals (unless urgent)
- **Respectful** - Respects dismissal, doesn't spam
- **Effective** - Clear CTA, easy upgrade path

Combined with PricingTable, PaymentBottomSheet, and CustomerPortal, this completes the full SDK component suite.
