/**
 * BillingOS production URLs.
 * These are the defaults — SDK users don't need to configure anything.
 * The SDK auto-detects the correct API URL from the session token prefix.
 */
export const BILLINGOS_API_URL = 'https://api.billingos.dev'
export const BILLINGOS_SANDBOX_API_URL = 'https://sandbox-api.billingos.dev'
export const BILLINGOS_APP_URL = 'https://app.billingos.dev'

/**
 * Detect environment from session token prefix.
 */
export function detectEnvironmentFromToken(token: string): 'test' | 'live' {
  if (token.startsWith('bos_session_test_')) return 'test'
  return 'live' // bos_session_live_ or legacy bos_session_ → production
}

/**
 * Resolve the BillingOS API URL from a session token prefix.
 * This is the primary resolution method — no configuration needed.
 */
export function resolveApiUrlFromToken(token: string): string {
  return detectEnvironmentFromToken(token) === 'test'
    ? BILLINGOS_SANDBOX_API_URL
    : BILLINGOS_API_URL
}

/**
 * Resolve the BillingOS app URL.
 * The app URL is the same for both test and live environments.
 */
export function resolveAppUrlFromToken(_token: string): string {
  return BILLINGOS_APP_URL
}

/**
 * @deprecated Use resolveApiUrlFromToken() instead. The SDK now auto-detects
 * the API URL from the session token prefix (bos_session_test_ / bos_session_live_).
 */
export function resolveApiUrl(propUrl?: string): string {
  const url =
    propUrl ||
    (typeof process !== 'undefined'
      ? process.env?.NEXT_PUBLIC_BILLINGOS_API_URL
      : undefined) ||
    BILLINGOS_API_URL

  if (propUrl) {
    console.warn(
      '[BillingOS] The apiUrl prop is deprecated. ' +
      'The SDK now auto-detects the environment from the session token prefix.'
    )
  }

  return url.replace(/\/$/, '')
}

/**
 * @deprecated Use resolveAppUrlFromToken() instead. The app URL is now
 * always https://app.billingos.dev for both test and live environments.
 */
export function resolveAppUrl(propUrl?: string): string {
  const url =
    propUrl ||
    (typeof process !== 'undefined'
      ? process.env?.NEXT_PUBLIC_BILLINGOS_APP_URL
      : undefined) ||
    BILLINGOS_APP_URL

  if (propUrl) {
    console.warn(
      '[BillingOS] The appUrl prop is deprecated. ' +
      'The app URL is now always https://app.billingos.dev.'
    )
  }

  return url.replace(/\/$/, '')
}
