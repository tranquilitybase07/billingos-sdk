import { useState, useEffect } from 'react'
import { useBillingOS } from '../../../providers/BillingOSProvider'

interface UsePortalSessionOptions {
  enabled: boolean
  customerId?: string
  metadata?: Record<string, any>
}

interface UsePortalSessionReturn {
  sessionId: string | null
  sessionUrl: string | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function usePortalSession({
  enabled,
  customerId,
  metadata
}: UsePortalSessionOptions): UsePortalSessionReturn {
  const { client } = useBillingOS()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createSession = async () => {
    if (!enabled) return

    console.log(
      '%c🔄 Creating portal session...',
      'color: #3b82f6; font-weight: 600;'
    )

    setLoading(true)
    setError(null)

    try {
      // Create portal session via API
      const session = await client.portal.createSession({
        customerId,
        metadata
      })

      setSessionId(session.id)
      console.log(
        '%c✨ Portal session created!',
        'color: #10b981; font-weight: 600;',
        `ID: ${session.id}`
      )

      // Generate iframe URL
      const billingOSAppUrl = process.env.NEXT_PUBLIC_BILLINGOS_APP_URL || 'http://localhost:3000'
      const iframeUrl = `${billingOSAppUrl}/embed/portal/${session.id}`
      setSessionUrl(iframeUrl)

      console.log(
        '%c📍 Iframe URL ready',
        'color: #8b5cf6; font-weight: 600;',
        iframeUrl
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create portal session')
      setError(error)
      console.error('[usePortalSession] Error creating session:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create session when enabled
  useEffect(() => {
    if (enabled && !sessionId) {
      createSession()
    }
  }, [enabled])

  // Cleanup session when component unmounts
  useEffect(() => {
    return () => {
      // Optionally invalidate session
      // if (sessionId) {
      //   client.portal.invalidateSession(sessionId).catch(() => {})
      // }
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
