/**
 * Stripe Configuration for BillingOS SDK
 *
 * This file contains the BillingOS platform's Stripe publishable key.
 * This key is bundled with the SDK and is safe to expose publicly.
 *
 * Merchants never see or configure this - it's completely internal to BillingOS.
 * Payments are routed to merchant's Stripe Connect accounts via the stripeAccount parameter.
 */

/**
 * BillingOS Platform Stripe Publishable Key
 *
 * This is the platform's key (not the merchant's).
 * It's paired with the merchant's Stripe Connect account ID to route payments correctly.
 */
export const BILLINGOS_STRIPE_PUBLISHABLE_KEY =
  'pk_test_51SihBODiEfx9xR94hb9APIlKq2CEr3uJqjQ1j98VdO5i30EGWi4HieGFjy1O3lEF3OWangT10RYr2Kae4CxfAvYd00xEVl0Raw'

/**
 * Check if a Stripe key is valid format
 */
export function isValidStripeKey(key: string): boolean {
  return Boolean(key && (key.startsWith('pk_live_') || key.startsWith('pk_test_')) && key.length > 20)
}

/**
 * Check if a client secret is valid format
 */
export function isValidClientSecret(secret: string): boolean {
  // Valid client secrets look like: pi_xxx_secret_xxx or seti_xxx_secret_xxx
  return Boolean(secret && /^(pi|seti)_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/.test(secret))
}
