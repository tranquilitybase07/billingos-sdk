# Changelog

## [1.1.0] - 2026-02-16

### Added
- **Real-time Subscription Updates**: Subscriptions now update automatically without page reload after successful payment
- **Customer Data Prefill**: Checkout form now prefills customer email and name when provided to BillingOSProvider
- **Version Logging**: SDK now logs version information in console for easier debugging
- **Success Notification UI**: Added visual feedback with success notification after payment completion

### Enhanced
- **React Query Cache Invalidation**: Implemented smart cache invalidation for immediate UI updates
- **Polling for Subscription Data**: Frontend polls for real subscription data created by webhook
- **TypeScript Support**: Fixed all TypeScript compilation issues in checkout service

### Fixed
- **Stripe Connected Accounts**: Fixed client_secret mismatch error by properly initializing Stripe with connected account context
- **NaN Price Display**: Fixed price display issues by adding totalAmount field
- **Customer Upsert Error**: Fixed database constraint issues when upserting customers
- **Subscription Data Flow**: Ensured real subscription data is sent from iframe to parent

### Technical Changes
- Backend `getCheckoutStatus` endpoint now includes subscription data
- CheckoutForm polls for subscription data after payment success (max 10 seconds)
- PricingTable uses React Query's `invalidateQueries` for cache refresh
- Added `subscription` field to CheckoutSession interface
- Updated console logging with clear version indicators

### Breaking Changes
- None

### Migration Guide
No breaking changes. Simply update to v1.1.0 to get all new features:
```bash
pnpm update @billingos/sdk@latest
```

---

## [1.0.0] - 2026-02-15

### Initial Release
- Iframe-based checkout modal
- Customer data prefill support
- Stripe Connected Accounts support
- React Query integration
- TypeScript support
- Pricing table component
- Checkout modal component