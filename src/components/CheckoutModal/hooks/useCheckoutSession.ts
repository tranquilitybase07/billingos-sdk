import { useState, useEffect } from 'react'
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
  const { client } = useBillingOS()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createSession = async () => {
    if (!enabled || !priceId) return

    console.log(
      '%c🔄 Creating checkout session...',
      'color: #3b82f6; font-weight: 600;',
      { priceId, customer }
    )

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
      console.log(
        '%c✨ Session created!',
        'color: #10b981; font-weight: 600;',
        `ID: ${session.id}`
      )

      // Generate iframe URL
      // The iframe should always load from the BillingOS web app, not the merchant's app
      // In production, this would be your BillingOS domain (e.g., https://app.billingos.com)
      const billingOSAppUrl = process.env.NEXT_PUBLIC_BILLINGOS_APP_URL || 'http://localhost:3000'
      const iframeUrl = `${billingOSAppUrl}/embed/checkout/${session.id}`
      setSessionUrl(iframeUrl)

      console.log(
        '%c📍 Iframe URL ready',
        'color: #8b5cf6; font-weight: 600;',
        iframeUrl
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create checkout session')
      setError(error)
      console.error('[useCheckoutSession] Error creating session:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create session when enabled
  useEffect(() => {
    if (enabled && !sessionId) {
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