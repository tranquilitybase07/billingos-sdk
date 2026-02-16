/**
 * Security utilities for iframe communication
 */

/**
 * Get allowed origins for iframe communication
 */
export function getAllowedOrigins(): string[] {
  const origins: string[] = []

  // Add configured app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL)
  }

  // Add BillingOS domains
  origins.push('https://app.billingos.com')
  origins.push('https://embed.billingos.com')

  // Add localhost for development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000')
    origins.push('http://localhost:3001')
    origins.push('http://127.0.0.1:3000')
    origins.push('http://127.0.0.1:3001')
  }

  return origins
}

/**
 * Validate message origin
 */
export function validateOrigin(origin: string): boolean {
  const allowedOrigins = getAllowedOrigins()
  return allowedOrigins.includes(origin)
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