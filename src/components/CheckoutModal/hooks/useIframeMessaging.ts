"use client";
import { useEffect, useCallback, RefObject } from 'react'
import { validateOrigin } from '../utils/security'
import type { IframeMessage, ParentMessage } from '../utils/messaging'

interface UseIframeMessagingOptions {
  iframeRef: RefObject<HTMLIFrameElement | null>
  onMessage: (message: IframeMessage) => void
  targetOrigin?: string
  debug?: boolean
}

interface UseIframeMessagingReturn {
  sendMessage: (message: ParentMessage) => void
  isConnected: boolean
}

export function useIframeMessaging({
  iframeRef,
  onMessage,
  targetOrigin = '*',
  debug = false
}: UseIframeMessagingOptions): UseIframeMessagingReturn {
  const isConnected = Boolean(iframeRef.current?.contentWindow)

  /**
   * Send message to iframe
   */
  const sendMessage = useCallback((message: ParentMessage) => {
    if (iframeRef.current?.contentWindow) {
      if (debug) {
        console.log('[useIframeMessaging] Sending message:', message)
      }
      iframeRef.current.contentWindow.postMessage(message, targetOrigin)
    } else {
      console.warn('[useIframeMessaging] Cannot send message - iframe not ready')
    }
  }, [iframeRef, targetOrigin, debug])

  /**
   * Handle incoming messages from iframe
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin (pass targetOrigin so the configured app URL is always allowed)
      if (targetOrigin !== '*' && !validateOrigin(event.origin, targetOrigin)) {
        if (debug) {
          console.warn(`[BillingOS] Blocked message from unexpected origin: ${event.origin}`)
        }
        return
      }

      // Validate message structure
      if (!event.data || typeof event.data !== 'object' || !event.data.type) {
        return
      }

      // Check if this is a checkout message
      if (!event.data.type.startsWith('CHECKOUT_') && event.data.type !== 'HEIGHT_CHANGED' && event.data.type !== 'PROCESSING') {
        return
      }

      if (debug) {
        console.log('[useIframeMessaging] Received message:', event.data)
      }

      // Pass message to handler
      onMessage(event.data as IframeMessage)
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [onMessage, debug])

  return {
    sendMessage,
    isConnected
  }
}