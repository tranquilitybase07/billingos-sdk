import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent } from '../ui/dialog'
import { CheckoutIframe } from './CheckoutIframe'
import { useCheckoutSession } from './hooks/useCheckoutSession'
import { useIframeMessaging } from './hooks/useIframeMessaging'
import type { IframeMessage } from './utils/messaging'
import { cn } from '../../utils/cn'

export interface CheckoutModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean

  /**
   * Callback when the modal open state changes
   */
  onOpenChange: (open: boolean) => void

  /**
   * The price ID to checkout
   */
  priceId: string

  /**
   * Customer information to pre-populate
   */
  customer?: {
    email?: string
    name?: string
    taxId?: string
  }

  /**
   * Coupon code to apply
   */
  couponCode?: string

  /**
   * Whether to collect billing address
   */
  collectBillingAddress?: boolean

  /**
   * Currency for the checkout (defaults to price currency)
   */
  currency?: string

  /**
   * Existing subscription ID for upgrades/downgrades
   */
  existingSubscriptionId?: string

  /**
   * Custom metadata to attach to the subscription
   */
  metadata?: Record<string, string>

  /**
   * Theme for the checkout modal
   */
  theme?: 'light' | 'dark' | 'auto'

  /**
   * Locale for the checkout (e.g., 'en', 'es', 'fr')
   */
  locale?: string

  /**
   * Success callback with the created subscription
   */
  onSuccess: (subscription: any) => void

  /**
   * Error callback
   */
  onError?: (error: Error) => void

  /**
   * Cancel callback when user closes without completing
   */
  onCancel?: () => void

  /**
   * Debug mode for development
   */
  debug?: boolean
}

type CheckoutState = 'loading' | 'ready' | 'processing' | 'success' | 'error'

export function CheckoutModal({
  open,
  onOpenChange,
  priceId,
  customer,
  couponCode,
  collectBillingAddress,
  existingSubscriptionId,
  metadata,
  theme = 'light',
  locale = 'en',
  onSuccess,
  onError,
  onCancel,
  debug = false
}: CheckoutModalProps) {
  const [state, setState] = useState<CheckoutState>('loading')
  const [error, setError] = useState<Error | null>(null)
  const [iframeHeight, setIframeHeight] = useState(600)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Log version on mount
  useEffect(() => {
    console.log(
      '%c🚀 BillingOS SDK v1.1.0 loaded with Iframe Checkout',
      'background: linear-gradient(to right, #667eea, #764ba2); color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    )
    console.log('%c📦 Using iframe for PCI compliance and security', 'color: #10b981; font-weight: 600;')
    console.log('%c✨ Customer prefill support enabled', 'color: #8b5cf6; font-weight: 600;')
    if (debug) {
      console.log('[CheckoutModal] Debug mode enabled')
    }
  }, [])

  // Create checkout session when modal opens
  const { sessionId, sessionUrl, loading, error: sessionError } = useCheckoutSession({
    enabled: open,
    priceId,
    customer,
    couponCode,
    metadata,
    existingSubscriptionId
  })

  // Handle iframe messaging
  const handleIframeMessage = useCallback((message: IframeMessage) => {
    console.log('[CheckoutModal] Received message from iframe:', message.type, message)

    switch (message.type) {
      case 'CHECKOUT_READY':
        console.log('[CheckoutModal] Checkout is ready')
        setState('ready')
        break

      case 'CHECKOUT_SUCCESS':
        console.log('[CheckoutModal] Payment SUCCESS! Subscription:', message.payload?.subscription)
        setState('success')
        if (message.payload?.subscription) {
          console.log('[CheckoutModal] Calling onSuccess with subscription data')
          onSuccess(message.payload.subscription)
        } else {
          console.log('[CheckoutModal] No subscription data, calling onSuccess with undefined')
          onSuccess(undefined)
        }
        onOpenChange(false)
        break

      case 'CHECKOUT_ERROR':
        setState('error')
        const errorMessage = message.payload?.error || 'An error occurred'
        const error = new Error(errorMessage)
        setError(error)
        onError?.(error)
        break

      case 'CHECKOUT_CLOSE':
        onCancel?.()
        onOpenChange(false)
        break

      case 'HEIGHT_CHANGED':
        if (message.payload?.height) {
          setIframeHeight(message.payload.height)
        }
        break

      case 'PROCESSING':
        setState('processing')
        break

      default:
        break
    }
  }, [debug, onSuccess, onError, onCancel, onOpenChange])

  const { sendMessage } = useIframeMessaging({
    iframeRef,
    onMessage: handleIframeMessage,
    debug
  })

  // Send initialization message when iframe is ready
  useEffect(() => {
    if (sessionId && state === 'ready') {
      sendMessage({
        type: 'INIT_CHECKOUT',
        sessionId,
        config: {
          theme,
          locale,
          collectBillingAddress
        }
      })
    }
  }, [sessionId, state, theme, locale, collectBillingAddress, sendMessage])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setState('loading')
      setError(null)
      setIframeHeight(600)
    }
  }, [open])

  // Handle session creation error
  useEffect(() => {
    if (sessionError) {
      setState('error')
      setError(sessionError)
      onError?.(sessionError)
    }
  }, [sessionError, onError])

  const showSpinner = loading || state === 'loading'
  const showError = state === 'error' && error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[500px] p-0 overflow-hidden",
          "max-h-[90vh] relative"
        )}
      >
        {/* Iframe Badge */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Secure Iframe</span>
        </div>
        {showError ? (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Payment Error</h3>
            <p className="text-gray-600">{error.message}</p>
            <button
              onClick={() => onOpenChange(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {showSpinner && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600 font-medium">Loading secure checkout...</p>
                  <p className="mt-2 text-xs text-gray-500">Iframe-based • PCI Compliant</p>
                </div>
              </div>
            )}

            {sessionUrl && (
              <CheckoutIframe
                ref={iframeRef}
                src={sessionUrl}
                height={iframeHeight}
                className={cn(
                  "transition-opacity duration-300",
                  showSpinner ? "opacity-0" : "opacity-100"
                )}
                onLoad={() => {
                  console.log(
                    '%c✅ Iframe loaded successfully',
                    'color: #10b981; font-weight: 600;',
                    `\nURL: ${sessionUrl}`
                  )
                  if (debug) {
                    console.log('[CheckoutModal] Full iframe details:', {
                      sessionUrl,
                      sessionId,
                      state,
                      height: iframeHeight
                    })
                  }
                }}
              />
            )}

            {state === 'processing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                  <p className="mt-4 text-gray-600">Processing payment...</p>
                </div>
              </div>
            )}
          </>
        )}

        {debug && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-2 text-xs">
            <div>State: {state}</div>
            <div>Session: {sessionId || 'Creating...'}</div>
            {error && <div>Error: {error.message}</div>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}