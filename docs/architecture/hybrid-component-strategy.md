# Hybrid Component Strategy: Native vs Iframe Architecture

## Overview

BillingOS SDK implements a **hybrid component architecture** that strategically uses native React components and iframe-based embeds based on each component's requirements. This approach balances security, customization, performance, and maintainability.

**Primary Distribution**: Merchants install via `npm install @billingos/sdk` for React/Next.js apps. The SDK includes both native React components (fully customizable) and iframe wrapper components (security-isolated payment forms). All components work seamlessly in-app with no redirects.

**Secondary Distribution**: Optional CDN script (`<script>` tag) for non-React sites (WordPress, static HTML) - not the primary use case.

## Core Principles

### When to Use Native Components
- **Deep customization required** (merchant needs full styling control)
- **SEO critical** (pricing pages, marketing content)
- **Performance sensitive** (dashboard widgets, real-time data)
- **No sensitive data** (public-facing content)
- **Complex interactions** (filters, sorting, data tables)

### When to Use Iframe Components
- **Security critical** (payment data, PCI compliance)
- **Frequent updates needed** (UI improvements without merchant upgrades)
- **Self-service interfaces** (merchant has limited control)
- **Consistent experience** (same UI across all merchants)
- **Payment processing** (isolate sensitive operations)

## Component Classification

### Native Components (Full Merchant Control)

| Component | Why Native | Key Benefits |
|-----------|-----------|--------------|
| **Pricing Table** | SEO + Customization | Google indexes content, full Tailwind styling, custom render functions |
| **Usage Meters** | Dashboard Integration | Real-time WebSocket data, custom charts, deep app integration |
| **Feature Gates** | Performance | Zero latency checks, logic-only (no UI), bundle optimization |
| **Invoice List** | Customization | Custom filtering, sorting, pagination, export functionality |
| **Analytics Dashboard** | Complex Interactions | Custom date ranges, chart types, data visualization |

### Iframe Components (BillingOS Controls)

| Component | Why Iframe | Key Benefits |
|-----------|-----------|--------------|
| **Checkout Modal** | Security + Updates | PCI isolation, instant bug fixes, consistent UX, new payment methods |
| **Payment Form** | PCI Compliance | Card data never touches merchant servers, SAQ A compliance |
| **Customer Portal** | Self-Service | Update subscriptions without merchant deploys, consistent interface |
| **Dunning Controls** | Controlled Experience | Retry logic updates, payment recovery flows, BillingOS manages UX |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Merchant's Application                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         @billingos/sdk (npm package)                      │  │
│  │                                                           │  │
│  │  ┌──────────────────┐        ┌──────────────────┐       │  │
│  │  │ Native Components│        │ Iframe Wrappers  │       │  │
│  │  ├──────────────────┤        ├──────────────────┤       │  │
│  │  │ PricingTable     │        │ CheckoutModal    │───┐   │  │
│  │  │ UsageMeter       │        │ PaymentForm      │   │   │  │
│  │  │ FeatureGate      │        │ CustomerPortal   │   │   │  │
│  │  │ InvoiceList      │        │ DunningControls  │   │   │  │
│  │  └──────────────────┘        └──────────────────┘   │   │  │
│  │                                                      │   │  │
│  │  ┌──────────────────────────────────────────────┐   │   │  │
│  │  │        BillingOSClient (API)                 │   │   │  │
│  │  │  - Subscriptions API                         │   │   │  │
│  │  │  - Entitlements API                          │   │   │  │
│  │  │  - Usage Tracking API                        │   │   │  │
│  │  └──────────────────────────────────────────────┘   │   │  │
│  └───────────────────────────────────────────────────────┘   │  │
└───────────────────────────────────────────────────────────────┘  │
                                                            │      │
                                                            │      │
                          ┌─────────────────────────────────┘      │
                          │ postMessage                            │
                          │ communication                          │
                          ▼                                        │
┌─────────────────────────────────────────────────────────────────┘
│                 Iframe Content (BillingOS Hosted)
│  ┌───────────────────────────────────────────────────────────┐
│  │            embed.billingos.com or billingos.com           │
│  │                                                            │
│  │  /checkout/[productId]    → Checkout page                 │
│  │  /payment-form            → Payment element               │
│  │  /portal/[customerId]     → Customer portal               │
│  │  /dunning/[subscriptionId]→ Dunning controls              │
│  │                                                            │
│  │  ┌────────────────────────────────────────────────────┐   │
│  │  │  Security: CSP headers, origin validation,         │   │
│  │  │  signed JWT tokens, embed_origin tracking          │   │
│  │  └────────────────────────────────────────────────────┘   │
│  └───────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ API calls (Bearer token)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    api.billingos.com                             │
│  - Authentication (JWT validation)                               │
│  - Stripe integration                                            │
│  - Subscription management                                       │
│  - Usage tracking                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Communication Patterns

### Native Component Flow
```
Merchant App
    │
    ├─> Import <PricingTable />
    │   Renders directly in merchant's DOM
    │   Full access to merchant's state/context
    │
    └─> API calls via BillingOSClient
        └─> api.billingos.com
```

### Iframe Component Flow (In-App Modal Experience)
```
Merchant's React App
    │
    ├─> User clicks plan on <PricingTable />
    │   setState shows <CheckoutModal /> (native React wrapper)
    │
    ├─> <CheckoutModal /> creates <iframe> element
    │   Sets src = embed.billingos.com/checkout/[id]
    │   Modal renders over merchant's app (no redirect)
    │
    ├─> Iframe loads payment form
    │   - Stripe Payment Element (card, Apple Pay, Google Pay)
    │   - Product details
    │   - Submit button
    │
    ├─> User enters payment → Stripe processes
    │   Backend creates subscription
    │
    ├─> Iframe sends postMessage: { type: 'CHECKOUT_SUCCESS', payload }
    │   Parent window receives message
    │   Triggers onSuccess callback
    │   setState closes modal
    │
    └─> ✅ User stays in merchant's app (no redirect)
```

## Security Architecture

### Native Component Security
- API calls use merchant's API key
- Bearer token authentication
- CORS policies on API endpoints
- Rate limiting per merchant
- Merchant controls all data flow

### Iframe Component Security
1. **Origin Validation**
   - Iframe validates parent origin via postMessage
   - Database stores approved embed origins per merchant
   - Backend validates embed_origin in API calls

2. **Content Security Policy**
   ```
   frame-ancestors: https://approved-merchant-domain.com
   script-src: 'self' https://js.stripe.com
   connect-src: https://api.billingos.com https://api.stripe.com
   ```

3. **Authentication Flow**
   ```
   Merchant Backend → Generate signed JWT
                   → Pass to iframe via postMessage
                   → Iframe validates with api.billingos.com
                   → Creates short-lived session
   ```

4. **PCI Compliance**
   - Card data only exists in iframe context
   - Never passes through merchant's JavaScript
   - Stripe Elements loaded in isolated iframe
   - Merchant qualifies for SAQ A (simplest PCI validation)

## Performance Considerations

### Native Components
- **Bundle Size**: Included in merchant's bundle (~50-150KB per component)
- **Load Time**: Loaded with merchant's app
- **Runtime**: Same JavaScript context (fast)
- **Memory**: Shared with merchant's app

### Iframe Components
- **Bundle Size**: Minimal wrapper (~2-5KB)
- **Load Time**: Additional HTTP request (~50-200ms)
- **Runtime**: Separate JavaScript context (isolated)
- **Memory**: Separate DOM tree and runtime

### Optimization Strategies
- Lazy load iframe components on-demand
- Preload iframe URLs for critical paths
- Use single iframe for portal sections (avoid multiple iframes)
- CDN caching for iframe content (7-day cache)
- Resource hints: `<link rel="preconnect" href="https://embed.billingos.com">`

## Versioning Strategy

### Native Components (npm versioning)
- Semantic versioning: MAJOR.MINOR.PATCH
- Merchants control upgrade timing
- Breaking changes in MAJOR versions only
- 12-month LTS for previous major versions

### Iframe Components (auto-update)
- BillingOS controls deployment
- Non-breaking updates deployed instantly
- Breaking changes communicated 30+ days in advance
- Feature flags for gradual rollouts
- Version pinning available for enterprise customers

## Customization Capabilities

### Native Components: Full Control
```tsx
<PricingTable
  products={products}
  className="custom-tailwind-classes"
  renderPrice={(price) => <CustomPrice value={price} />}
  renderFeature={(feature) => <CustomFeature {...feature} />}
  onPlanSelect={(plan) => customAnalytics(plan)}
  theme={{
    colors: { primary: '#FF0000' },
    fonts: { heading: 'CustomFont' }
  }}
/>
```

### Iframe Components: Limited Control
```tsx
<CheckoutModal
  productId="prod_123"
  theme="dark"                    // Preset themes only
  accentColor="#FF0000"           // Limited styling
  locale="en"                     // Localization
  onSuccess={(data) => {}}        // High-level events only
/>
```

## Migration Path

### From Pure Native to Hybrid

**Phase 1: Current State (All Native)**
- All components rendered as native React
- Full customization but requires npm upgrades
- Merchants must deploy to get updates

**Phase 2: Hybrid Implementation**
- Checkout, payment forms move to iframe
- Pricing, dashboards stay native
- Maintain backward compatibility via feature flags

**Phase 3: Optimization**
- Monitor iframe performance metrics
- Collect merchant feedback on customization needs
- Adjust native vs iframe boundaries

### Backward Compatibility
```tsx
// v1.x (native checkout)
<Checkout productId="prod_123" />

// v2.x (iframe checkout with backward compat)
<Checkout
  productId="prod_123"
  renderMode="native"  // Opt-out of iframe for existing merchants
/>
```

## Trade-offs Summary

### Native Components

**Advantages:**
- Full customization (Tailwind, custom render functions)
- SEO friendly (content indexed by Google)
- Better performance (no iframe overhead)
- Deep integration with merchant's app state

**Disadvantages:**
- Requires npm upgrade for updates
- Larger bundle size
- Inconsistent UI across merchants
- More support burden (different versions)

### Iframe Components

**Advantages:**
- Instant updates (no merchant deploys)
- Consistent UI across all merchants
- Security isolation (PCI compliance)
- Smaller merchant bundle

**Disadvantages:**
- Limited customization
- Not SEO friendly (iframe content not indexed)
- Performance overhead (extra HTTP request)
- Complex auth/session management

## Decision Matrix

Use this matrix to classify future components:

```
                    High Customization Need
                            │
                            │
         Native Components  │  Hybrid Approach
         (Pricing, Lists)   │  (Consider both)
                            │
    ────────────────────────┼────────────────────────
                            │
         Hybrid Approach    │  Iframe Components
         (Analytics)        │  (Checkout, Payment)
                            │
                            │
                    High Security/Update Need
```

**Questions to Ask:**
1. Does this handle payment data? → Iframe
2. Does this need SEO? → Native
3. Will we update UI frequently? → Iframe
4. Does merchant need deep customization? → Native
5. Is this a self-service interface? → Iframe
6. Is this performance critical (dashboard widget)? → Native

## Future Considerations

### Potential Improvements
- **Server Components**: Use React Server Components for native components (reduce bundle size)
- **Web Components**: Explore framework-agnostic web components
- **Progressive Enhancement**: Native component with iframe fallback
- **Micro-frontends**: Independent deployment of iframe apps
- **GraphQL Subscriptions**: Real-time updates for native components
- **Edge Rendering**: Deploy iframe content to edge (lower latency)

### Monitoring & Analytics
- Track adoption rate of native vs iframe components
- Measure performance metrics (load time, memory usage)
- Collect merchant feedback on customization limits
- Monitor security incidents and compliance issues
- A/B test iframe vs native for hybrid candidates

## References

- Stripe's hybrid approach: Native Stripe.js + iframe Elements
- Polar's embed strategy: npm package + jsDelivr CDN
- Clerk's native-only approach: Full control, manual upgrades
- Calendly's iframe-only approach: Consistent UI, auto-updates
