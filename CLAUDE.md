# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build the React SDK and Node SDK
pnpm build          # tsc + vite build for React SDK
pnpm prepare        # builds both @billingos/sdk and @billingos/node

# Development
pnpm dev            # Vite dev server

# Type checking and linting
pnpm type-check     # tsc --noEmit
pnpm lint           # ESLint with zero warnings policy

# Node SDK (run from packages/node/)
pnpm test           # run tests once
pnpm test:watch     # watch mode
pnpm build          # tsup build
```

## Architecture

This is a **pnpm monorepo** with three packages:

- **`@billingos/sdk`** (root `/src`) — React SDK for client-side billing
- **`@billingos/node`** (`/packages/node`) — Server-side Node.js SDK
- **`@billingos/supabase`** (`/packages/supabase`) — Supabase integration

### React SDK Layers (`/src`)

**1. API Client** (`src/client/`)
- `BillingOSClient`: Typed HTTP client for all backend operations (customers, subscriptions, entitlements, usage, invoices, payment methods, checkout sessions, portal sessions)
- Custom typed error classes: `ValidationError`, `UnauthorizedError`, `NotFoundError`, etc.
- Auth: session token-based; base URL from `NEXT_PUBLIC_API_URL` env var (fallback: `localhost:3001`)
- Default API version header: `2026-01-01`

**2. Provider** (`src/providers/`)
- `BillingOSProvider`: Root context component; wraps TanStack Query's `QueryClientProvider`
- Accepts `sessionTokenUrl` to auto-fetch session tokens; exposes `customerId`, `customerEmail`, `customerName`, `organizationId` via context
- Default QueryClient: 5min staleTime, 10min gcTime

**3. Hooks** (`src/hooks/`)
- Query hooks: `useSubscription`, `useSubscriptions`, `useCheckEntitlement`, `useHasFeature`, `useEntitlements`, `useUsageMetrics`, `useIsApproachingLimit`, `useProducts`, `useSessionToken`
- Mutation hooks: `useCreateSubscription`, `useUpdateSubscription`, `useCancelSubscription`, `useReactivateSubscription`, `useSubscriptionPreview`, `useTrackUsage`, `useCheckout`

**4. Pre-built Components** (`src/components/`)
- `CustomerPortal` — Full self-service portal (subscriptions, invoices, payment methods)
- `CheckoutModal` — Iframe-based checkout
- `PricingTable` — Product pricing display
- `UpgradeNudge` — Usage-threshold-triggered upgrade prompts
- `FeatureGate` — Conditional rendering based on entitlements
- `UsageDisplay`, `UpgradePrompt`, `PaymentBottomSheet`
- `ui/` — Base primitives (Button, Card, Dialog, Tabs, Badge, Input, Progress, etc.)

**5. Utilities** (`src/utils/`)
- `cn()` — tailwind-merge + clsx className helper
- Money formatting utilities (cents/dollars conversion, currency formatting)
- Date formatting utilities

**6. Imperative Checkout API** (`src/checkout.ts`)
- `window.billingOS.checkout.open()` — for non-React integrations

### Build System

- **Vite** (library mode) builds to both ESM (`.mjs`) and CommonJS (`.js`) with TypeScript declarations
- CSS is injected directly into the JS bundle via `vite-plugin-css-injected-by-js`
- Peer deps externalized automatically (`rollup-plugin-peer-deps-external`)
- Peer deps consumers must provide: `react`, `react-dom`, `@stripe/react-stripe-js`, `@stripe/stripe-js`, `@tanstack/react-query`, `react-hook-form`
- **Node SDK** uses `tsup` for building and `Vitest` for tests
- TypeScript strict mode; path alias `@/*` → `./src/*`
- Styling: Tailwind CSS 4.0 via PostCSS; Shadow DOM isolation via `react-shadow-scope`
