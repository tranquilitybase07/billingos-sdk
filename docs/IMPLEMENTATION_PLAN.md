# BillingOS SDK Implementation Plan

## Overview
Create a React SDK library at `~/Code/billingos-sdk` with:
- Pre-built UI components (Checkout, Subscription Portal, Customer Portal)
- React hooks for data fetching (subscriptions, entitlements, usage tracking)
- Headless API client for custom implementations
- Tailwind CSS + shadcn styling
- TypeScript + Vite build system
- npm publishing ready

## Framework Compatibility

### Current Support
- ✅ **React** 18+ and 19+
- ✅ **Next.js** (App Router & Pages Router)
- ✅ **Vite + React**
- ✅ **Create React App**
- ✅ **Remix**
- ✅ **Any React-based framework**

### Future Multi-Framework Support

If we need to support Vue, Svelte, or other frameworks later:

#### Phase 1: Extract Core Logic (2-3 days)
```
packages/
├── core/              # NEW: @billingos/core
│   ├── client/        # API client (vanilla JS/TS)
│   ├── types/         # Shared TypeScript types
│   └── utils/         # Money, date utilities (framework-agnostic)
│
├── react/             # RENAME: @billingos/react
│   ├── hooks/         # React hooks (wraps @billingos/core)
│   ├── components/    # React components
│   └── providers/     # React context providers
│
├── vue/               # NEW: @billingos/vue (if needed)
│   ├── composables/   # Vue composables (wraps @billingos/core)
│   └── components/    # Vue components
│
└── svelte/            # NEW: @billingos/svelte (if needed)
    ├── stores/        # Svelte stores (wraps @billingos/core)
    └── components/    # Svelte components
```

#### Phase 2: Framework Adapter Pattern
```typescript
// @billingos/core (vanilla JS/TS)
export class BillingOSClient {
  constructor(apiKey: string, options?: ClientOptions) { }

  async getSubscription(id: string): Promise<Subscription> {
    return this.request(`/subscriptions/${id}`)
  }

  async createSubscription(data: CreateSubscriptionInput) { }
  async cancelSubscription(id: string) { }
  // ... all API methods
}

// @billingos/react (React wrapper)
export function useSubscription(id: string) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: ['subscription', id],
    queryFn: () => client.getSubscription(id)
  })
}

// @billingos/vue (Vue wrapper - future)
export function useSubscription(id: Ref<string>) {
  const { client } = inject(BillingOSKey)

  return useQuery({
    queryKey: computed(() => ['subscription', id.value]),
    queryFn: () => client.getSubscription(id.value)
  })
}

// @billingos/svelte (Svelte wrapper - future)
export function subscriptionStore(id: string) {
  const { client } = getContext('billingos')

  return createQuery({
    queryKey: ['subscription', id],
    queryFn: () => client.getSubscription(id)
  })
}
```

#### Migration Path (When Multi-Framework is Needed):
1. **Create** `@billingos/core` package (vanilla TypeScript)
2. **Move** API client & utils from React SDK → core
3. **Rename** `@billingos/sdk` → `@billingos/react`
4. **Update** React SDK to import from core: `import { BillingOSClient } from '@billingos/core'`
5. **Publish** both packages to npm
6. **Users upgrade**: `npm install @billingos/react` (same functionality, new package name)
7. **Add** Vue/Svelte packages as needed

#### Benefits of Multi-Package Architecture:
- ✅ Share core logic across frameworks
- ✅ Tree-shakeable (users only install what they need)
- ✅ Maintain single API client
- ✅ Each framework gets idiomatic APIs (hooks for React, composables for Vue, stores for Svelte)

---

## Phase 1: Project Setup (Day 1)

### 1.1 Initialize Project Structure
```bash
cd ~/Code
mkdir billingos-sdk
cd billingos-sdk
pnpm init
```

### 1.2 Install Dependencies
**Build Tools:**
- vite, typescript, @vitejs/plugin-react
- vite-plugin-dts (TypeScript declarations)
- tailwindcss, postcss, autoprefixer

**React Ecosystem:**
- react, react-dom (peer dependencies)
- @tanstack/react-query
- react-hook-form
- @stripe/stripe-js, @stripe/react-stripe-js

**Utilities:**
- zod (validation)
- clsx, tailwind-merge (CSS utilities)
- date-fns (date formatting)

### 1.3 Setup Configuration Files
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration for library mode
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `.npmignore` - Files to exclude from npm package
- `package.json` - Package metadata and scripts

### 1.4 Create Directory Structure
```
billingos-sdk/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── client/                     # API client
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── errors.ts
│   ├── hooks/                      # React hooks
│   │   ├── useCheckout.ts
│   │   ├── useSubscription.ts
│   │   ├── useEntitlements.ts
│   │   ├── useUsage.ts
│   │   └── useCustomer.ts
│   ├── components/                 # React components
│   │   ├── ui/                     # Base components (from BillingOS)
│   │   ├── Checkout/
│   │   ├── Subscription/
│   │   └── CustomerPortal/
│   ├── providers/                  # React context providers
│   │   ├── BillingOSProvider.tsx
│   │   └── CheckoutProvider.tsx
│   ├── utils/                      # Utilities
│   │   ├── money.ts
│   │   ├── date.ts
│   │   └── validation.ts
│   └── styles/                     # CSS
│       └── globals.css
├── examples/                       # Usage examples
├── docs/                          # Documentation
└── package.json
```

## Phase 2: Core SDK Development (Week 1)

### 2.1 Build API Client (`src/client/`)
- Create base client with fetch wrapper
- Add authentication (API key in headers)
- Implement error handling classes
- Add TypeScript types for API responses
- Support for backend endpoints:
  - Customers: create, get, list, update
  - Subscriptions: create, get, list, update, cancel
  - Entitlements: check, list
  - Usage: track, metrics

### 2.2 Extract UI Components from BillingOS
Copy from `apps/web/src/components/atoms/`:
- Input, Select, Checkbox, Switch, Button
- Card, Alert
- MoneyInput, PercentageInput
- FormattedDateTime
- CountryPicker, CountryStatePicker
- Update imports and dependencies

### 2.3 Build React Hooks (`src/hooks/`)
**Checkout Hooks:**
- `useCheckout(checkoutId)` - Fetch checkout session
- `useCheckoutConfirm()` - Confirm checkout mutation

**Subscription Hooks:**
- `useSubscription(id)` - Fetch subscription
- `useSubscriptions()` - List subscriptions
- `useCreateSubscription()` - Create subscription
- `useUpdateSubscription()` - Upgrade/downgrade
- `useCancelSubscription()` - Cancel subscription

**Entitlement Hooks:**
- `useEntitlements()` - Fetch entitlements
- `useHasFeature(key)` - Check feature access
- `useFeatureUsage(key)` - Get usage metrics

**Customer Hooks:**
- `useCustomer()` - Get customer
- `useCustomerInvoices()` - List invoices

### 2.4 Create Providers (`src/providers/`)
**BillingOSProvider:**
- Initialize API client with API key
- Wrap React Query provider
- Provide client context to hooks

**CheckoutProvider:**
- Manage checkout session state
- Handle Stripe Elements setup

### 2.5 Build Utilities (`src/utils/`)
Copy from BillingOS:
- `money.ts` - Currency formatting (from `apps/web/src/lib/money.ts`)
- `date.ts` - Date formatting utilities
- `validation.ts` - Zod schemas for validation

## Phase 3: Checkout Components (Week 1-2)

### 3.1 Reference Polar's Checkout Implementation
Study files in `/Users/ankushkumar/Code/payment/billingos/clients/packages/checkout/`:
- `CheckoutForm.tsx` - Main form structure
- `CheckoutPricing.tsx` - Pricing display
- Stripe Elements integration patterns

### 3.2 Build Checkout Components (`src/components/Checkout/`)
- `CheckoutForm.tsx` - Main checkout form with Stripe Elements
- `CheckoutPricing.tsx` - Display pricing breakdown
- `ProductSelector.tsx` - Select product/plan
- `PaymentMethodInput.tsx` - Stripe card input
- `CheckoutButton.tsx` - Submit button with loading state

### 3.3 Setup Stripe Integration
- Configure Stripe Elements
- Handle payment intent confirmation
- Support 3D Secure authentication
- Error handling for payment failures

## Phase 4: Subscription Management (Week 2)

### 4.1 Build Subscription Components (`src/components/Subscription/`)
- `SubscriptionCard.tsx` - Display subscription details
- `SubscriptionStatus.tsx` - Status badge component
- `UpgradeModal.tsx` - Upgrade/downgrade flow
- `CancelModal.tsx` - Cancellation flow with survey
- `BillingHistory.tsx` - Invoice list

### 4.2 Build Customer Portal Components (`src/components/CustomerPortal/`)
- `Dashboard.tsx` - Main portal view
- `SubscriptionDetails.tsx` - Detailed subscription view
- `PaymentMethodManager.tsx` - Manage payment methods
- `InvoiceList.tsx` - List of invoices
- `UsageDisplay.tsx` - Usage metrics display

## Phase 5: Build Configuration (Week 2)

### 5.1 Configure Vite for Library Mode
- Set up library mode in `vite.config.ts`
- Configure external dependencies (React, React DOM)
- Generate TypeScript declarations
- Tree-shaking optimization

### 5.2 Setup Tailwind CSS
- Configure Tailwind for library
- Include only used utilities (PurgeCSS)
- Export CSS file for users to import

### 5.3 Configure Package.json
**Exports:**
```json
{
  "name": "@billingos/sdk",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./styles.css": "./dist/style.css"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

## Phase 6: Documentation & Examples (Week 2-3)

### 6.1 Create Example App
- Simple Next.js app showing SDK usage
- Checkout flow example
- Subscription management example
- Customer portal example

### 6.2 Write Documentation
- README.md with quick start
- API reference for all hooks
- Component documentation with examples
- Migration guide (if updating)

### 6.3 Setup Storybook (Optional)
- Visual component documentation
- Interactive component playground
- Test components in isolation

## Phase 7: Testing & Publishing (Week 3)

### 7.1 Testing
- Unit tests for utilities
- Integration tests for hooks
- Component tests with React Testing Library

### 7.2 NPM Publishing Setup
- Create npm account / organization
- Configure `.npmrc` for publishing
- Setup versioning strategy (semantic versioning)
- Create GitHub Actions for automated publishing

### 7.3 First Publish
```bash
pnpm build
npm login
npm publish --access public
```

## Success Criteria

**Week 1:**
- ✅ Project initialized with Vite + TypeScript
- ✅ API client built and tested
- ✅ Core UI components extracted
- ✅ Basic hooks implemented
- ✅ BillingOSProvider working

**Week 2:**
- ✅ Checkout flow complete
- ✅ Subscription management components
- ✅ Customer portal components
- ✅ Build configuration working
- ✅ Example app running

**Week 3:**
- ✅ Documentation complete
- ✅ Tests passing
- ✅ Published to npm
- ✅ Tested in external project

## Integration Examples

### Next.js App Router Example
```typescript
// app/layout.tsx
import { BillingOSProvider } from '@billingos/sdk'
import '@billingos/sdk/styles.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BillingOSProvider apiKey={process.env.NEXT_PUBLIC_BILLINGOS_API_KEY}>
          {children}
        </BillingOSProvider>
      </body>
    </html>
  )
}

// app/subscriptions/page.tsx
'use client'
import { useSubscriptions } from '@billingos/sdk'

export default function SubscriptionsPage() {
  const { data: subscriptions, isLoading } = useSubscriptions()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {subscriptions.map(sub => (
        <SubscriptionCard key={sub.id} subscription={sub} />
      ))}
    </div>
  )
}
```

### Next.js Pages Router Example
```typescript
// pages/_app.tsx
import { BillingOSProvider } from '@billingos/sdk'
import '@billingos/sdk/styles.css'

export default function App({ Component, pageProps }) {
  return (
    <BillingOSProvider apiKey={process.env.NEXT_PUBLIC_BILLINGOS_API_KEY}>
      <Component {...pageProps} />
    </BillingOSProvider>
  )
}

// pages/checkout.tsx
import { CheckoutForm } from '@billingos/sdk'

export default function CheckoutPage() {
  return (
    <div className="max-w-md mx-auto">
      <CheckoutForm
        priceId="price_1234"
        onSuccess={(subscription) => {
          console.log('Subscription created:', subscription.id)
        }}
      />
    </div>
  )
}
```

### Vite React Example
```typescript
// src/main.tsx
import { BillingOSProvider } from '@billingos/sdk'
import '@billingos/sdk/styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BillingOSProvider apiKey={import.meta.env.VITE_BILLINGOS_API_KEY}>
      <App />
    </BillingOSProvider>
  </React.StrictMode>
)

// src/App.tsx
import { useSubscription, SubscriptionCard } from '@billingos/sdk'

function App() {
  const { data: subscription } = useSubscription('sub_123')

  return (
    <div className="container mx-auto">
      {subscription && <SubscriptionCard subscription={subscription} />}
    </div>
  )
}
```

## Reference Architecture

### From BillingOS
- UI Components: `/Users/ankushkumar/Code/billingos/apps/web/src/components/atoms/`
- Money utilities: `/Users/ankushkumar/Code/billingos/apps/web/src/lib/money.ts`
- API client pattern: `/Users/ankushkumar/Code/billingos/apps/web/src/lib/api/client.ts`

### From Polar
- Checkout components: `/Users/ankushkumar/Code/payment/billingos/clients/packages/checkout/src/components/`
- Checkout hooks: `/Users/ankushkumar/Code/payment/billingos/clients/packages/checkout/src/hooks/`
- API client architecture: `/Users/ankushkumar/Code/payment/billingos/clients/packages/client/src/index.ts`
- Embed script: `/Users/ankushkumar/Code/payment/billingos/clients/packages/checkout/src/embed.ts`

## Next Steps

1. Install dependencies with pnpm
2. Create TypeScript & Vite configuration
3. Setup Tailwind CSS
4. Create directory structure
5. Build API client
6. Extract UI components
7. Create hooks and providers
8. Build example app
9. Write documentation
10. Publish to npm
