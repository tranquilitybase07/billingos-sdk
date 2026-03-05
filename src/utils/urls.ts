/**
 * BillingOS production URLs.
 * These are the defaults — SDK users don't need to configure anything.
 * Override via env vars or props only for self-hosting or local development.
 */
export const BILLINGOS_API_URL = 'https://api.billingos.dev'
export const BILLINGOS_APP_URL = 'https://app.billingos.dev'

/**
 * Resolves the BillingOS API base URL.
 *
 * Priority:
 * 1. Explicit prop passed to BillingOSProvider (`apiUrl`)
 * 2. NEXT_PUBLIC_BILLINGOS_API_URL env var (for local dev / self-hosting)
 * 3. Production default — https://api.billingos.dev
 *
 * Most users never need to set this.
 */
export function resolveApiUrl(propUrl?: string): string {
  const url =
    propUrl ||
    (typeof process !== 'undefined'
      ? process.env?.NEXT_PUBLIC_BILLINGOS_API_URL
      : undefined) ||
    BILLINGOS_API_URL

  // Strip trailing slash for consistent URL construction
  return url.replace(/\/$/, '')
}

/**
 * Resolves the BillingOS app URL (used for iframe checkout and portal embeds).
 *
 * Priority:
 * 1. Explicit prop passed to BillingOSProvider (`appUrl`)
 * 2. NEXT_PUBLIC_BILLINGOS_APP_URL env var (for local dev / self-hosting)
 * 3. Production default — https://app.billingos.dev
 *
 * Most users never need to set this.
 */
export function resolveAppUrl(propUrl?: string): string {
  const url =
    propUrl ||
    (typeof process !== 'undefined'
      ? process.env?.NEXT_PUBLIC_BILLINGOS_APP_URL
      : undefined) ||
    BILLINGOS_APP_URL

  return url.replace(/\/$/, '')
}
