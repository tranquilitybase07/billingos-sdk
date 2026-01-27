# BillingOS SDK Architecture Documentation

This folder contains comprehensive architecture and system design documentation for the BillingOS SDK.

## Documents

### 1. [Hybrid Component Strategy](./hybrid-component-strategy.md)
**Purpose**: Defines when to use native React components vs iframe-based embeds

**Key Topics**:
- Component classification (native vs iframe)
- Decision matrix for future components
- Security architecture for each approach
- Performance considerations
- Customization capabilities
- Trade-offs analysis

**Read this when**:
- Planning a new component
- Deciding between native or iframe implementation
- Understanding security boundaries
- Evaluating customization requirements

---

### 2. [Deployment Infrastructure](./deployment-infrastructure.md)
**Purpose**: Complete guide to hosting, deployment, and infrastructure strategy

**Key Topics**:
- Three-phase deployment roadmap (MVP → Production → Enterprise)
- Domain strategy and DNS configuration
- Build and CI/CD pipeline
- npm distribution (primary) vs CDN (optional)
- Versioning and caching policies
- Monitoring and rollback procedures
- Cost estimates per phase

**Read this when**:
- Setting up deployment pipeline
- Planning infrastructure costs
- Implementing versioning strategy
- Configuring domains and hosting
- Setting up monitoring/alerting

---

### 3. [End-to-End Payment Flow](./end-to-end-payment-flow.md) ⭐ NEW
**Purpose**: Complete user journey from pricing table to payment completion

**Key Topics**:
- Step-by-step flow with code examples
- Visual diagrams of user experience
- postMessage communication between components
- Real-time status updates
- Network activity and API calls
- Complete sequence diagram
- Implementation checklist

**Read this when**:
- Implementing checkout flow
- Understanding how components communicate
- Debugging payment issues
- Learning the complete integration
- Planning user experience

---

## Quick Reference

### Primary Distribution Method

**For React/Next.js Apps (Main Use Case):**
```bash
npm install @billingos/sdk
```

Merchants get:
- ✅ Native React components (pricing tables, dashboards)
- ✅ Iframe wrapper components (checkout modals, payment forms)
- ✅ TypeScript types
- ✅ API client

**For Non-React Sites (Secondary):**
```html
<script src="https://cdn.jsdelivr.net/npm/@billingos/checkout-embed@latest"></script>
```
- Only for WordPress, static HTML sites
- Not the primary distribution path

### Component Decision Matrix

```
Use NATIVE when:
✓ Deep customization needed (Tailwind, custom renders)
✓ SEO critical (pricing pages)
✓ Performance sensitive (dashboard widgets)
✓ No sensitive data

Use IFRAME when:
✓ Security critical (payment data, PCI)
✓ Frequent updates needed (without merchant deploys)
✓ Self-service interfaces
✓ Consistent UI required across all merchants
```

### Deployment Phases

| Phase | Timeline | Focus | Cost/Month |
|-------|----------|-------|------------|
| **Phase 1: MVP** | Current → 3 months | npm + existing Vercel | $0 |
| **Phase 2: Production** | 3-6 months | Custom subdomain, monitoring | $72 |
| **Phase 3: Enterprise** | 6-12 months | Multi-region, SLAs | $1400+ |

### Current Architecture (Phase 1)

```
Merchant's React App
    ↓
npm install @billingos/sdk
    ↓
<CheckoutModal /> creates iframe
    ↓
billingos.com/checkout/[id] (hosted on Vercel)
    ↓
Stripe Payment Element (card, Apple Pay, Google Pay)
    ↓
Payment success → postMessage to parent
    ↓
Modal closes, user stays in app ✅
```

### User Experience Flow

```
User views pricing → Clicks plan → Modal opens with iframe →
Enters payment → Stripe processes → Modal closes →
User sees subscription active (NO REDIRECT)

Total time: 30-60 seconds
Redirects: 0
Page reloads: 0
```

## Implementation Checklist

When implementing the SDK:

**Phase 1 - Core Components:**
- [ ] Create `@billingos/sdk` npm package
- [ ] Implement `<PricingTable />` native component
- [ ] Implement `<CheckoutModal />` iframe wrapper
- [ ] Build checkout page (`billingos.com/checkout/[id]`)
- [ ] Integrate Stripe Payment Element in iframe
- [ ] Implement postMessage communication

**Phase 2 - Backend Integration:**
- [ ] Create `POST /checkout/sessions` endpoint
- [ ] Create `POST /subscriptions` endpoint
- [ ] Set up Stripe webhooks
- [ ] Implement subscription status API
- [ ] Add security (CSP headers, origin validation)

**Phase 3 - Developer Experience:**
- [ ] Publish to npm registry
- [ ] Write integration docs
- [ ] Create example apps
- [ ] Set up monitoring
- [ ] Add error tracking

## Related Documentation

- **Component Specs**: `/docs/component-specs/` - Detailed specs for each component
- **API Integration**: `/docs/api-integration.md` - Backend API usage
- **Authentication Flow**: `/docs/authentication-flow.md` - Auth patterns
- **Getting Started**: `/docs/GETTING_STARTED.md` - Developer quickstart

## Architecture Principles

### 1. In-App Experience (No Redirects)
- All interactions happen in modals/overlays
- User never leaves merchant's app
- Seamless, native feel

### 2. Security First
- PCI compliance for payment data (iframe isolation)
- Origin validation for embedded widgets
- Signed JWT tokens for iframe authentication
- CSP headers and frame-ancestors policies

### 3. Developer Experience
- Simple `npm install` for React apps
- TypeScript types for all components
- Comprehensive documentation
- Minimal integration code

### 4. Performance
- Lazy load iframe components
- Native components for speed-critical UI
- Bundle size optimization
- Tree-shaking support

### 5. Flexibility
- Native components: full customization
- Iframe components: preset themes
- Backward compatibility via feature flags
- Gradual migration paths

### 6. Observability
- Error tracking (Sentry)
- Performance monitoring (Core Web Vitals)
- Version adoption metrics
- Business metrics (conversion rates)

## FAQ

### Why hybrid approach instead of all-iframe or all-native?

**All-iframe** (like Calendly):
- ✅ Easy updates, consistent UI
- ❌ Limited customization, poor SEO

**All-native** (like Clerk):
- ✅ Full customization, better performance
- ❌ Slow adoption of updates, version fragmentation

**Hybrid** (like Stripe):
- ✅ Security where needed (payment = iframe)
- ✅ Customization where needed (pricing = native)
- ✅ Best of both worlds

### Why npm instead of CDN for React apps?

**npm Benefits:**
- TypeScript types included
- Tree-shaking (smaller bundles)
- Version pinning control
- Integrates with build tools
- Standard React workflow

**CDN drawbacks for React:**
- No TypeScript support
- Can't tree-shake
- Global namespace pollution
- Not idiomatic React

**Conclusion**: npm is the correct choice for React/Next.js apps. CDN is only for non-React sites.

### How do users pay without leaving the app?

1. User clicks plan on pricing table
2. `<CheckoutModal />` component renders (React)
3. Modal creates iframe pointing to your checkout page
4. User enters payment in iframe (Stripe Elements)
5. Payment processes
6. Iframe sends success message via postMessage
7. Parent window receives message, closes modal
8. User stays in merchant's app the entire time

See [End-to-End Payment Flow](./end-to-end-payment-flow.md) for complete details.

### How does iframe communicate with parent?

```tsx
// Inside iframe (checkout page)
window.parent.postMessage({
  type: 'CHECKOUT_SUCCESS',
  payload: { subscriptionId: 'sub_123' }
}, '*')

// Parent window (merchant's app)
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://billingos.com') return

  if (event.data.type === 'CHECKOUT_SUCCESS') {
    // Close modal, show success
    onSuccess(event.data.payload)
  }
})
```

Security: Always validate `event.origin` before processing messages.

### What payment methods are supported?

All methods supported by Stripe Payment Element:
- Credit/Debit Cards
- Apple Pay
- Google Pay
- Bank transfers (ACH, SEPA)
- Buy Now Pay Later (Klarna, Affirm)
- Digital wallets

All work seamlessly in the iframe.

### How to handle authentication in iframes?

**Recommended approach**:
1. Merchant backend generates signed JWT token
2. Token passed to iframe via URL parameter (secure)
3. Iframe validates with `api.billingos.com`
4. Creates short-lived session (1 hour)

**Security**:
- Token scoped to specific customer
- Time-limited (expires)
- Signed with secret key
- Origin validation

See [End-to-End Payment Flow](./end-to-end-payment-flow.md) for implementation details.

### Can merchants customize the checkout UI?

**Limited customization** (preset options):
- Theme (light/dark)
- Accent color
- Logo upload
- Localization

**Why limited?**
- Security: Checkout handles payment data (must be controlled)
- Updates: We can improve UI without merchant deploys
- Consistency: Same experience for all users

**Pricing table** (native component) has **full customization**.

## Contributing

When updating architecture:

1. Update relevant document (hybrid strategy, deployment, or flow)
2. Update this README if adding new docs
3. Update implementation checklist if needed
4. Add entry to changelog (if significant change)
5. Notify team via Slack/email

## Changelog

- **2026-01-14**: Initial architecture documentation
  - Created hybrid component strategy guide
  - Defined three-phase deployment roadmap
  - Documented MVP infrastructure (npm-first approach)
  - Added complete end-to-end payment flow documentation
  - Clarified npm vs CDN distribution strategy

---

**Last Updated**: 2026-01-14
**Maintained By**: BillingOS Core Team
**Review Frequency**: Quarterly or on major architecture changes
