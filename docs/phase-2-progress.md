# Phase 2: Node SDK Implementation - Progress Tracker

**Started:** 2026-01-26
**Status:** In Progress

---

## Week 1: @billingos/node Core

### Day 1-2: Setup & Core Client ✅ COMPLETED

- [x] Create package structure (`packages/node/`)
- [x] Setup package.json with dependencies
- [x] Configure TypeScript (tsconfig.json)
- [x] Build BillingOS main class
- [x] Implement HTTP client (fetch-based)
- [x] Add error handling classes
- [x] Create core TypeScript types
- [x] Setup build configuration
- [x] Setup pnpm workspaces
- [x] Create generic auth helper
- [x] Successfully build package (ESM + CJS + DTS)

### Day 3: Session Token Methods ✅ COMPLETED

- [x] `createSessionToken()` method
- [x] API integration (`POST /v1/session-tokens`)
- [x] Response parsing
- [x] Error handling for session tokens
- [x] Session token types

### Day 4: Webhook Verification ⏳ PENDING

- [ ] HMAC signature verification utility
- [ ] Webhook event types
- [ ] Event parsing logic
- [ ] verifyWebhook() method

### Day 5: API Methods ✅ COMPLETED

- [x] Customer API methods (create, get, update, delete, getByExternalId)
- [x] Subscription API methods (create, get, update, cancel, reactivate)
- [x] Full CRUD for all entities
- [x] Generic auth helper functions (createSessionRoute, createSessionHandler)

---

## Week 2: @billingos/supabase + SDK Updates

### Day 6-7: Supabase Package ⏳ PENDING

- [ ] Create package structure (`packages/supabase/`)
- [ ] Setup package.json
- [ ] `createSessionRoute()` for App Router
- [ ] `createSessionHandler()` for Pages Router
- [ ] Auto-detect Supabase auth from cookies
- [ ] Supabase client utilities

### Day 8-9: Update @billingos/sdk ✅ COMPLETED

- [x] Add session token support to BillingOSProvider
- [x] Build `useSessionToken()` hook with auto-refresh
- [x] Update BillingOSClient to use session tokens
- [x] Remove API key support (clean slate - no users yet)
- [x] Update types and exports
- [x] Successfully build package

### Day 10: Testing ⏳ PENDING

- [ ] Unit tests for @billingos/node
- [ ] Unit tests for @billingos/supabase
- [ ] Integration tests
- [ ] Manual end-to-end testing

---

## Week 3: Documentation & Examples

### Day 11-12: Documentation ⏳ PENDING

- [ ] README for @billingos/node
- [ ] README for @billingos/supabase
- [ ] Update main SDK README
- [ ] API reference documentation
- [ ] Migration guide

### Day 13-14: Example Apps ⏳ PENDING

- [ ] Next.js App Router + Supabase example
- [ ] Next.js Pages Router example
- [ ] Express + generic auth example
- [ ] Documentation for examples

### Day 15: Polish & Publish ⏳ PENDING

- [ ] Code review
- [ ] Fix bugs
- [ ] Build all packages
- [ ] Test publishing flow
- [ ] Publish to npm

---

## Current Task

**Day 8-9:** ✅ Completed - Updated @billingos/sdk with session token support

**What was completed:**
1. Created `useSessionToken` hook with auto-fetch and auto-refresh
2. Updated `BillingOSProvider` to accept `sessionToken` or `sessionTokenUrl` props
3. Updated `BillingOSClient` to use session tokens instead of API keys
4. Successfully built the package (ESM + CJS + DTS)
5. All existing components (PricingTable, CustomerPortal, PaymentBottomSheet, UpgradeNudge) now work with session tokens

**Next Steps:**
1. Link SDK to new Next.js app for testing
2. Create a session token endpoint in Next.js app
3. Test all components with session tokens
4. Test auto-refresh functionality

---

## Notes

- Using pnpm workspaces for monorepo
- TypeScript-first development
- Framework-agnostic approach
- Session token architecture from auth/final-plan.md
