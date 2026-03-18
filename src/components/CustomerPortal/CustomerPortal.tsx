"use client";
import { useState, useEffect, useRef, useCallback } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { PortalIframe } from './PortalIframe'
import { usePortalSession } from './hooks/usePortalSession'
import { usePortalMessaging, IframeMessage } from './hooks/usePortalMessaging'
import { PricingTable } from '../PricingTable'
import { cn } from '../../utils/cn'
import { useBillingOS } from '../../providers/BillingOSProvider'
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
   * @deprecated Use `appearance.theme` on `<BillingOSProvider>` instead.
   */
  theme?: 'light' | 'dark'

  /**
   * @deprecated Use `appearance.variables.colorPrimary` on `<BillingOSProvider>` instead.
   */
  accentColor?: string

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
  theme: themeProp,
  accentColor: accentColorProp,
  className,
  customerId,
  metadata,
  onSubscriptionUpdate,
  onSubscriptionCancel,
  onPaymentMethodAdd,
  onPaymentMethodUpdate,
  debug = false
}: CustomerPortalProps) {
  const { appearance } = useBillingOS()
  // Resolve theme: prop > appearance > default 'dark'
  const theme = themeProp ?? appearance?.theme ?? 'dark'
  // Resolve accentColor: prop > appearance.variables.colorPrimary
  const accentColor = accentColorProp ?? appearance?.variables?.colorPrimary
  const [state, setState] = useState<PortalState>('loading')
  const [error, setError] = useState<Error | null>(null)
  const [iframeHeight, setIframeHeight] = useState(600)
  const [showPricingTable, setShowPricingTable] = useState(false)
  const [portalCustomer, setPortalCustomer] = useState<{ email?: string; name?: string } | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (debug) console.log('[CustomerPortal] Debug mode enabled')
  }, [])

  // Create portal session when opened
  const isOpenOrPage = mode === 'page' || isOpen
  // Merge legacy accentColor prop into appearance variables
  const mergedAppearance = {
    theme: theme as 'light' | 'dark' | 'auto',
    variables: {
      ...appearance?.variables,
      ...(accentColor ? { colorPrimary: accentColor } : {}),
    },
  }

  const { sessionId, sessionUrl, loading, error: sessionError } = usePortalSession({
    enabled: isOpenOrPage,
    customerId,
    metadata,
    appearance: mergedAppearance,
  })

  // Handle iframe messaging
  const handleIframeMessage = useCallback((message: IframeMessage) => {
    if (debug) {
      console.log('[CustomerPortal] Received message from iframe:', message.type, message)
    }

    switch (message.type) {
      case 'PORTAL_READY':
        setState('ready')
        break

      case 'PORTAL_CLOSE':
        onClose?.()
        break

      case 'SUBSCRIPTION_UPDATED':
        onSubscriptionUpdate?.(message.payload)
        break

      case 'SUBSCRIPTION_CANCELLED':
        onSubscriptionCancel?.()
        break

      case 'PAYMENT_METHOD_ADDED':
        onPaymentMethodAdd?.()
        break

      case 'PAYMENT_METHOD_UPDATED':
        onPaymentMethodUpdate?.()
        break

      case 'HEIGHT_CHANGED':
        if (message.payload?.height) {
          setIframeHeight(message.payload.height)
          if (debug) console.log('[CustomerPortal] Height changed to:', message.payload.height)
        }
        break

      case 'OPEN_PRICING_TABLE':
        if (message.payload?.customer) {
          setPortalCustomer(message.payload.customer)
        }
        setShowPricingTable(true)
        break

      case 'CLOSE_PRICING_TABLE':
        setShowPricingTable(false)
        break

      case 'ERROR': {
        setState('error')
        const errorMessage = message.payload?.error || 'An error occurred'
        setError(new Error(errorMessage))
        break
      }

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
          theme: theme as 'light' | 'dark' | 'auto',
          defaultTab,
          variables: mergedAppearance.variables,
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
  const isDark = theme === 'dark'
  const portalContent = (
    <>
      {showError ? (
        <div className="p-8">
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <>
          {showSpinner && (
            <div className={cn('absolute inset-0 flex items-center justify-center z-10', isDark ? 'bg-[#141415]' : 'bg-white')}>
              <div className="flex flex-col items-center gap-3">
                <div className={cn('animate-spin rounded-full h-10 w-10 border-[3px]', isDark ? 'border-neutral-700 border-t-neutral-300' : 'border-neutral-200 border-t-neutral-600')} />
                <p className={cn('text-sm font-medium', isDark ? 'text-neutral-400' : 'text-neutral-500')}>Loading...</p>
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
                if (debug) console.log('[CustomerPortal] iframe loaded:', sessionUrl)
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
  const mainPortal = mode === 'page' ? (
    <div className={cn('relative w-full', className)}>
      {portalContent}
    </div>
  ) : mode === 'modal' ? (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className={cn('sm:max-w-[800px] p-0 overflow-hidden max-h-[90vh] relative', className)}>
        <DialogHeader className="sr-only">
          <DialogTitle>Customer Portal</DialogTitle>
        </DialogHeader>
        {portalContent}
      </DialogContent>
    </Dialog>
  ) : (
    // Default: drawer mode
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

  return (
    <>
      {mainPortal}

      {/* PricingTable Modal for Plan Changes */}
      <Dialog open={showPricingTable} onOpenChange={setShowPricingTable}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Your Plan</DialogTitle>
          </DialogHeader>
          <PricingTable
            useCheckoutModal={true}
            customer={portalCustomer || undefined}
            onPlanChanged={(subscription) => {
              setShowPricingTable(false)
              setPortalCustomer(null)
              sendMessage({
                type: 'UPDATE_CONFIG',
                payload: { refresh: true }
              })
              onSubscriptionUpdate?.(subscription)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
