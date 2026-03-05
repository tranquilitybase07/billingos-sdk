"use client";
import { useState, useEffect, useRef } from 'react'
import { useBillingOS } from '../../../providers/BillingOSProvider'

interface UseCheckoutSessionOptions {
  enabled: boolean
  priceId: string
  customer?: {
    email?: string
    name?: string
    taxId?: string
  }
  couponCode?: string
  metadata?: Record<string, string>
  existingSubscriptionId?: string
}

interface UseCheckoutSessionReturn {
  sessionId: string | null
  sessionUrl: string | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useCheckoutSession({
  enabled,
  priceId,
  customer,
  couponCode,
  metadata,
  existingSubscriptionId
}: UseCheckoutSessionOptions): UseCheckoutSessionReturn {
  const { client, appUrl, debug } = useBillingOS()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  // Track which priceId we've already initiated a session for.
  // Using a ref instead of state so React Strict Mode's double-mount
  // doesn't reset it between the first and second effect invocation,
  // preventing the duplicate checkout session creation.
  const initiatedForPriceRef = useRef<string | null>(null)

  const createSession = async () => {
    if (!enabled || !priceId || !client) return

    if (debug) console.log('[BillingOS] Creating checkout session...', { priceId, customer })

    setLoading(true)
    setError(null)

    try {
      // Create checkout session via API
      const session = await client.checkout.createSession({
        priceId,
        customer,
        couponCode,
        metadata,
        existingSubscriptionId,
        // Return URLs will be handled by postMessage instead
        mode: 'embedded'
      })

      setSessionId(session.id)
      if (debug) console.log('[BillingOS] Checkout session created:', session.id)

      // Generate iframe URL using appUrl from BillingOSProvider context
      const iframeUrl = `${appUrl}/embed/checkout/${session.id}`
      setSessionUrl(iframeUrl)

      if (debug) console.log('[BillingOS] Iframe URL:', iframeUrl)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create checkout session')
      setError(error)
      console.error('[useCheckoutSession] Error creating session:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create session when enabled.
  // Guard with a ref so React Strict Mode's double-invocation of effects
  // doesn't fire two simultaneous API calls (state resets between mounts
  // but refs persist, so the second effect sees the guard and skips).
  useEffect(() => {
    if (enabled && initiatedForPriceRef.current !== priceId) {
      initiatedForPriceRef.current = priceId
      createSession()
    }
  }, [enabled, priceId])

  // Cleanup session when component unmounts
  useEffect(() => {
    return () => {
      if (sessionId) {
        // Optionally cancel the session if not completed
        // client.checkout.cancelSession(sessionId).catch(() => {})
      }
    }
  }, [sessionId])

  const refresh = async () => {
    setSessionId(null)
    setSessionUrl(null)
    await createSession()
  }

  return {
    sessionId,
    sessionUrl,
    loading,
    error,
    refresh
  }
}