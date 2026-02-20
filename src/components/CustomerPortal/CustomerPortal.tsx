import { useState, useEffect, useRef, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { PortalIframe } from './PortalIframe'
import { usePortalSession } from './hooks/usePortalSession'
import { usePortalMessaging, IframeMessage } from './hooks/usePortalMessaging'
import { cn } from '../../utils/cn'
import { Alert, AlertDescription } from '../ui/alert'

type PortalState = 'loading' | 'ready' | 'error'
type PortalTab = 'subscription' | 'invoices' | 'payment' | 'settings'

export interface CustomerPortalProps {
  /**
   * Open/close state (for drawer/modal mode)
   */
  isOpen?: boolean

  /**
   * Callback when user closes portal
   */
  onClose?: () => void

  /**
   * Display mode
   * - 'drawer': Slide-in from right (default)
   * - 'modal': Centered modal
   * - 'page': Full-page view
   */
  mode?: 'drawer' | 'modal' | 'page'

  /**
   * Default tab to show
   */
  defaultTab?: PortalTab

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark'

  /**
   * Optional: Custom class name
   */
  className?: string

  /**
   * Optional: Customer ID to load specific customer
   */
  customerId?: string

  /**
   * Optional: Custom metadata
   */
  metadata?: Record<string, any>

  /**
   * Callback when subscription is updated
   */
  onSubscriptionUpdate?: (subscription: any) => void

  /**
   * Callback when subscription is cancelled
   */
  onSubscriptionCancel?: () => void

  /**
   * Callback when payment method is added
   */
  onPaymentMethodAdd?: () => void

  /**
   * Callback when payment method is updated
   */
  onPaymentMethodUpdate?: () => void

  /**
   * Debug mode for development
   */
  debug?: boolean
}

export function CustomerPortal({
  isOpen = false,
  onClose,
  mode = 'drawer',
  defaultTab = 'subscription',
  theme = 'light',
  className,
  customerId,
  metadata,
  onSubscriptionUpdate,
  onSubscriptionCancel,
  onPaymentMethodAdd,
  onPaymentMethodUpdate,
  debug = false
}: CustomerPortalProps) {
  const [state, setState] = useState<PortalState>('loading')
  const [error, setError] = useState<Error | null>(null)
  const [iframeHeight, setIframeHeight] = useState(600)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Log version on mount (only once)
  useEffect(() => {
    console.log(
      '%c🚀 BillingOS SDK v1.1.0 - Iframe Customer Portal',
      'background: linear-gradient(to right, #667eea, #764ba2); color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
    )
    console.log('%c📦 Using iframe for instant updates and security', 'color: #10b981; font-weight: 600;')
    console.log('%c🎨 Supports drawer, modal, and page modes', 'color: #8b5cf6; font-weight: 600;')
    if (debug) {
      console.log('[CustomerPortal] Debug mode enabled')
    }
  }, [])

  // Create portal session when opened
  const isOpenOrPage = mode === 'page' || isOpen
  const { sessionId, sessionUrl, loading, error: sessionError } = usePortalSession({
    enabled: isOpenOrPage,
    customerId,
    metadata
  })

  // Handle iframe messaging
  const handleIframeMessage = useCallback((message: IframeMessage) => {
    if (debug) {
      console.log('[CustomerPortal] Received message from iframe:', message.type, message)
    }

    switch (message.type) {
      case 'PORTAL_READY':
        console.log('[CustomerPortal] Portal is ready')
        setState('ready')
        break

      case 'PORTAL_CLOSE':
        console.log('[CustomerPortal] User requested close')
        onClose?.()
        break

      case 'SUBSCRIPTION_UPDATED':
        console.log('[CustomerPortal] Subscription updated')
        onSubscriptionUpdate?.(message.payload)
        break

      case 'SUBSCRIPTION_CANCELLED':
        console.log('[CustomerPortal] Subscription cancelled')
        onSubscriptionCancel?.()
        break

      case 'PAYMENT_METHOD_ADDED':
        console.log('[CustomerPortal] Payment method added')
        onPaymentMethodAdd?.()
        break

      case 'PAYMENT_METHOD_UPDATED':
        console.log('[CustomerPortal] Payment method updated')
        onPaymentMethodUpdate?.()
        break

      case 'HEIGHT_CHANGED':
        if (message.payload?.height) {
          setIframeHeight(message.payload.height)
          if (debug) {
            console.log('[CustomerPortal] Height changed to:', message.payload.height)
          }
        }
        break

      case 'ERROR':
        setState('error')
        const errorMessage = message.payload?.error || 'An error occurred'
        const err = new Error(errorMessage)
        setError(err)
        break

      default:
        break
    }
  }, [debug, onClose, onSubscriptionUpdate, onSubscriptionCancel, onPaymentMethodAdd, onPaymentMethodUpdate])

  const { sendMessage } = usePortalMessaging({
    iframeRef,
    onMessage: handleIframeMessage,
    debug
  })

  // Send initialization message when iframe is ready
  useEffect(() => {
    if (sessionId && state === 'ready') {
      sendMessage({
        type: 'INIT_PORTAL',
        sessionId,
        config: {
          theme,
          defaultTab
        }
      })
    }
  }, [sessionId, state, theme, defaultTab, sendMessage])

  // Reset state when closed
  useEffect(() => {
    if (!isOpenOrPage) {
      setState('loading')
      setError(null)
      setIframeHeight(600)
    }
  }, [isOpenOrPage])

  // Handle session creation error
  useEffect(() => {
    if (sessionError) {
      setState('error')
      setError(sessionError)
    }
  }, [sessionError])

  const showSpinner = loading || state === 'loading'
  const showError = state === 'error' && error

  // Portal content
  const portalContent = (
    <>
      {/* Iframe Badge */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow-lg">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Secure Iframe</span>
      </div>

      {showError ? (
        <div className="p-8">
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <>
          {showSpinner && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading portal...</p>
                <p className="mt-2 text-xs text-gray-500">Iframe-based • Always up-to-date</p>
              </div>
            </div>
          )}

          {sessionUrl && (
            <PortalIframe
              ref={iframeRef}
              src={sessionUrl}
              height={iframeHeight}
              className={cn(
                "transition-opacity duration-300",
                showSpinner ? "opacity-0" : "opacity-100"
              )}
              onLoad={() => {
                console.log(
                  '%c✅ Portal iframe loaded successfully',
                  'color: #10b981; font-weight: 600;',
                  `\nURL: ${sessionUrl}`
                )
                if (debug) {
                  console.log('[CustomerPortal] Full iframe details:', {
                    sessionUrl,
                    sessionId,
                    state,
                    height: iframeHeight
                  })
                }
              }}
            />
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
    </>
  )

  // Render based on mode
  if (mode === 'page') {
    return (
      <div className={cn('relative w-full', className)}>
        {portalContent}
      </div>
    )
  }

  if (mode === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className={cn('sm:max-w-[800px] p-0 overflow-hidden max-h-[90vh] relative', className)}>
          <DialogHeader className="sr-only">
            <DialogTitle>Customer Portal</DialogTitle>
          </DialogHeader>
          {portalContent}
        </DialogContent>
      </Dialog>
    )
  }

  // Default: drawer mode
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <SheetContent
        side="right"
        className={cn('w-full sm:max-w-[600px] p-0 overflow-hidden', className)}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Customer Portal</SheetTitle>
        </SheetHeader>
        {portalContent}
      </SheetContent>
    </Sheet>
  )
}
