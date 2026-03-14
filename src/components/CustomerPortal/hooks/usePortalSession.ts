"use client";
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
  const { client, appUrl, debug } = useBillingOS()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createSession = async () => {
    if (!enabled || !client) return

    if (debug) console.log('[BillingOS] Creating portal session...')

    setLoading(true)
    setError(null)

    try {
      // Create portal session via API
      const session = await client.portal.createSession({
        customerId,
        metadata
      })

      setSessionId(session.id)
      if (debug) console.log('[BillingOS] Portal session created:', session.id)

      // Generate iframe URL using appUrl from BillingOSProvider context
      const iframeUrl = `${appUrl}/embed/portal/${session.id}`
      setSessionUrl(iframeUrl)

      if (debug) console.log('[BillingOS] Iframe URL:', iframeUrl)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create portal session')
      setError(error)
      console.error('[usePortalSession] Error creating session:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create session when enabled AND client is ready.
  // client starts as null while the session token is being fetched (sessionTokenUrl),
  // so we depend on client to re-run when the token arrives.
  useEffect(() => {
    if (enabled && client && !sessionId) {
      createSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, client])

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
