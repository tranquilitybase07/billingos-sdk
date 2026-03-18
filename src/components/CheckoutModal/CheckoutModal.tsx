"use client";
import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent } from '../ui/dialog'
import { CheckoutIframe } from './CheckoutIframe'
import { useCheckoutSession } from './hooks/useCheckoutSession'
import { useIframeMessaging } from './hooks/useIframeMessaging'
import { useBillingOS } from '../../providers/BillingOSProvider'
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
   * @deprecated Use `appearance.theme` on `<BillingOSProvider>` instead.
   */
  theme?: 'light' | 'dark' | 'auto'

  /**
   * @deprecated Use `appearance.light.colorPrimary` / `appearance.dark.colorPrimary` on `<BillingOSProvider>` instead.
   */
  accentColor?: string

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

  /**
   * Enable Stripe Adaptive Pricing — lets customers pay in their local currency (~150 countries).
   * Defaults to true.
   */
  adaptivePricing?: boolean
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
  theme: themeProp,
  locale = 'en',
  onSuccess,
  onError,
  onCancel,
  debug = false,
  adaptivePricing = true,
  accentColor: accentColorProp,
}: CheckoutModalProps) {
  const { appUrl, appearance, debug: contextDebug } = useBillingOS()
  // Resolve theme: prop > appearance > default 'light'
  const theme = themeProp ?? appearance?.theme ?? 'light'
  // Resolve accentColor: prop > appearance resolved colorPrimary
  const resolvedVars = (() => {
    if (!appearance) return undefined
    const isDarkTheme = theme === 'dark' || (
      theme === 'auto' && typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    )
    return isDarkTheme
      ? (appearance.dark ?? appearance.light ?? {})
      : (appearance.light ?? appearance.dark ?? {})
  })()
  const accentColor = accentColorProp ?? resolvedVars?.colorPrimary
  const isDebug = debug || contextDebug

  const [state, setState] = useState<CheckoutState>('loading')
  const [error, setError] = useState<Error | null>(null)
  const [iframeHeight, setIframeHeight] = useState(600)
  const iframeRef = useRef<HTMLIFrameElement>(null)


  // Create checkout session when modal opens
  // Merge legacy accentColor prop into appearance variables
  const mergedAppearance = {
    theme: theme as 'light' | 'dark' | 'auto',
    light: {
      ...appearance?.light,
      ...(accentColor ? { colorPrimary: accentColor } : {}),
    },
    dark: {
      ...appearance?.dark,
      ...(accentColor ? { colorPrimary: accentColor } : {}),
    },
  }

  const { sessionId, sessionUrl, loading, error: sessionError } = useCheckoutSession({
    enabled: open,
    priceId,
    customer,
    couponCode,
    metadata,
    existingSubscriptionId,
    adaptivePricing,
    appearance: mergedAppearance,
  })

  // Handle iframe messaging
  const handleIframeMessage = useCallback((message: IframeMessage) => {
    switch (message.type) {
      case 'CHECKOUT_READY':
        setState('ready')
        break

      case 'CHECKOUT_SUCCESS':
        setState('success')
        onSuccess(message.payload?.subscription)
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
  }, [isDebug, onSuccess, onError, onCancel, onOpenChange])

  const { sendMessage } = useIframeMessaging({
    iframeRef,
    onMessage: handleIframeMessage,
    targetOrigin: appUrl || '*',
    debug: isDebug
  })

  // Send initialization message when iframe is ready
  useEffect(() => {
    if (sessionId && state === 'ready') {
      sendMessage({
        type: 'INIT_CHECKOUT',
        sessionId,
        config: {
          theme: theme as 'light' | 'dark' | 'auto',
          locale,
          collectBillingAddress,
          variables: {
            ...resolvedVars,
            ...(accentColor ? { colorPrimary: accentColor } : {}),
          },
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
          "max-w-[800px] w-full p-0 overflow-hidden",
          "min-h-[600px] max-h-[90vh] relative",
          "rounded-2xl border-0 shadow-none bg-transparent"
        )}
      >
        {showError ? (
          <div className={cn("p-8 text-center", theme === 'dark' ? 'bg-[#141415]' : 'bg-white')}>
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
            <h3 className={cn("text-lg font-semibold mb-2", theme === 'dark' ? 'text-gray-100' : '')}>Payment Error</h3>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{error.message}</p>
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                "mt-4 px-4 py-2 rounded-md",
                theme === 'dark' ? 'bg-[#242426] text-gray-200 hover:bg-[#2e2e30]' : 'bg-gray-200 hover:bg-gray-300'
              )}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {showSpinner && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className={cn(
                  "animate-spin rounded-full h-10 w-10 border-[3px]",
                  theme === 'dark'
                    ? 'border-white/20 border-t-white'
                    : 'border-black/10 border-t-black/60'
                )}></div>
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
                onLoad={() => { }}
              />
            )}

            {state === 'processing' && (
              <div className={cn(
                "absolute inset-0 flex items-center justify-center z-10",
                theme === 'dark' ? 'bg-black/80' : 'bg-white/80'
              )}>
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                  <p className={cn("mt-4", theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>Processing payment...</p>
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