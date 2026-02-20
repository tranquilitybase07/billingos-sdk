import { useEffect, useCallback, RefObject } from 'react'

export interface IframeMessage {
  type:
    | 'PORTAL_READY'
    | 'PORTAL_CLOSE'
    | 'SUBSCRIPTION_UPDATED'
    | 'SUBSCRIPTION_CANCELLED'
    | 'PAYMENT_METHOD_ADDED'
    | 'PAYMENT_METHOD_UPDATED'
    | 'HEIGHT_CHANGED'
    | 'ERROR'
  payload?: any
}

export interface ParentMessage {
  type: 'INIT_PORTAL' | 'UPDATE_CONFIG' | 'CLOSE_PORTAL'
  sessionId?: string
  config?: {
    theme?: 'light' | 'dark' | 'auto'
    locale?: string
    defaultTab?: string
  }
  payload?: any
}

interface UsePortalMessagingOptions {
  iframeRef: RefObject<HTMLIFrameElement | null>
  onMessage: (message: IframeMessage) => void
  debug?: boolean
}

interface UsePortalMessagingReturn {
  sendMessage: (message: ParentMessage) => void
}

export function usePortalMessaging({
  iframeRef,
  onMessage,
  debug = false
}: UsePortalMessagingOptions): UsePortalMessagingReturn {

  /**
   * Send message to iframe
   */
  const sendMessage = useCallback((message: ParentMessage) => {
    const iframe = iframeRef.current
    if (!iframe || !iframe.contentWindow) {
      console.warn('[usePortalMessaging] Iframe not ready')
      return
    }

    if (debug) {
      console.log('[usePortalMessaging] 📤 Sending to iframe:', message)
    }

    // Get target origin from iframe src
    const iframeSrc = iframe.src
    const targetOrigin = new URL(iframeSrc).origin

    iframe.contentWindow.postMessage(message, targetOrigin)
  }, [iframeRef, debug])

  /**
   * Listen for messages from iframe
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate message structure
      if (!event.data || typeof event.data !== 'object' || !event.data.type) {
        return
      }

      // Validate origin (should be from BillingOS app)
      const iframe = iframeRef.current
      if (!iframe) return

      const iframeSrc = iframe.src
      if (!iframeSrc) return

      const expectedOrigin = new URL(iframeSrc).origin
      if (event.origin !== expectedOrigin && process.env.NODE_ENV !== 'development') {
        console.warn(`[usePortalMessaging] Message from unexpected origin: ${event.origin}`)
        return
      }

      const message = event.data as IframeMessage

      if (debug) {
        console.log('[usePortalMessaging] 📥 Received from iframe:', message)
      }

      onMessage(message)
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [iframeRef, onMessage, debug])

  return {
    sendMessage
  }
}
