/**
 * Security utilities for iframe communication
 */

/**
 * Get allowed origins for iframe communication.
 * Pass the appUrl from BillingOSProvider context to include the configured app origin.
 */
export function getAllowedOrigins(appUrl?: string): string[] {
  const origins: string[] = []

  // Add the configured app URL from context (highest priority)
  if (appUrl) {
    try {
      origins.push(new URL(appUrl).origin)
    } catch {
      // ignore malformed URLs
    }
  }

  // Add legacy env var (NEXT_PUBLIC_BILLINGOS_APP_URL takes precedence)
  const envAppUrl =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BILLINGOS_APP_URL) || ''
  if (envAppUrl && !origins.includes(new URL(envAppUrl).origin)) {
    try {
      origins.push(new URL(envAppUrl).origin)
    } catch {
      // ignore
    }
  }

  // Add known BillingOS production domains
  origins.push('https://app.billingos.dev')
  origins.push('https://embed.billingos.dev')

  // Add localhost for development
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    origins.push('http://localhost:3000')
    origins.push('http://localhost:3001')
    origins.push('http://127.0.0.1:3000')
    origins.push('http://127.0.0.1:3001')
  }

  return origins
}

/**
 * Validate message origin.
 * Pass appUrl from BillingOSProvider context when available.
 */
export function validateOrigin(origin: string, appUrl?: string): boolean {
  const allowedOrigins = getAllowedOrigins(appUrl)
  if (allowedOrigins.includes(origin)) return true

  // Allow BillingOS Vercel deployments
  if (origin.endsWith('.vercel.app') && origin.includes('billingos')) return true

  // Allow Stripe origins
  if (origin.endsWith('.stripe.com')) return true

  return false
}

/**
 * Generate a random nonce for message verification
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}

/**
 * Sanitize URL to prevent XSS
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol')
    }
    return parsed.toString()
  } catch {
    throw new Error('Invalid URL')
  }
}

/**
 * Create Content Security Policy for iframe
 */
export function getIframeCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'"
  ].join('; ')
}

/**
 * Verify session token hasn't expired
 */
export function isSessionExpired(expiresAt: string | Date): boolean {
  const expiryTime = new Date(expiresAt).getTime()
  return Date.now() > expiryTime
}