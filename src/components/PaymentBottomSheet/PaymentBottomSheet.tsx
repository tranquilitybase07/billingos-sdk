import * as React from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import type { Stripe, Appearance } from '@stripe/stripe-js'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '../ui/drawer'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { useBillingOS } from '../../providers/BillingOSProvider'
import { useCreateCheckout } from './hooks/useCheckout'
import { PaymentForm } from './PaymentForm'
import { DemoPaymentForm } from './DemoPaymentForm'

export interface PaymentBottomSheetProps {
  /**
   * Price ID to purchase
   */
  priceId: string

  /**
   * Open/close state
   */
  isOpen: boolean

  /**
   * Callback when user closes sheet
   */
  onClose: () => void

  /**
   * Callback when payment succeeds
   */
  onSuccess: (subscriptionId: string) => void

  /**
   * Optional: Subscription ID if upgrading
   */
  existingSubscriptionId?: string

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark'
}

type SheetState = 'loading' | 'ready' | 'processing' | 'success' | 'error'

export function PaymentBottomSheet({
  priceId,
  isOpen,
  onClose,
  onSuccess,
  existingSubscriptionId,
  theme,
}: PaymentBottomSheetProps) {
  const { customerId } = useBillingOS()
  const [stripePromise, setStripePromise] = React.useState<Promise<Stripe | null> | null>(null)
  const [sheetState, setSheetState] = React.useState<SheetState>('loading')
  const [error, setError] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isDemoMode, setIsDemoMode] = React.useState(false)

  // Create checkout session
  const {
    data: checkoutData,
    error: checkoutError,
    refetch: refetchCheckout,
  } = useCreateCheckout(
    isOpen
      ? {
          priceId,
          customerId: customerId || '',
          existingSubscriptionId,
        }
      : null,
    {
      enabled: isOpen && !!customerId,
    }
  )

  const checkoutSession = checkoutData?.checkoutSession

  // Check if we're in demo mode (invalid Stripe credentials)
  const isValidStripeKey = (key: string) => {
    return key && (key.startsWith('pk_live_') || key.startsWith('pk_test_')) && key.length > 20
  }

  const isValidClientSecret = (secret: string) => {
    // Valid client secrets look like: pi_xxx_secret_xxx or seti_xxx_secret_xxx
    return secret && /^(pi|seti)_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$/.test(secret)
  }

  // Initialize Stripe when checkout session is ready
  React.useEffect(() => {
    if (checkoutSession) {
      const validKey = isValidStripeKey(checkoutSession.stripePublishableKey)
      const validSecret = isValidClientSecret(checkoutSession.clientSecret)

      if (validKey && validSecret) {
        const stripe = loadStripe(checkoutSession.stripePublishableKey, {
          stripeAccount: checkoutSession.stripeAccountId,
        })
        setStripePromise(stripe)
        setIsDemoMode(false)
      } else {
        // Demo mode - no valid Stripe credentials
        setIsDemoMode(true)
      }
      setSheetState('ready')
    }
  }, [checkoutSession])

  // Handle checkout error
  React.useEffect(() => {
    if (checkoutError) {
      setError(checkoutError.message || 'Failed to create checkout session')
      setSheetState('error')
    }
  }, [checkoutError])

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setSheetState('loading')
      setError(null)
      setStripePromise(null)
      setIsDemoMode(false)
    }
  }, [isOpen])

  const handlePaymentSuccess = (subscriptionId: string) => {
    setSheetState('success')
    setTimeout(() => {
      onSuccess(subscriptionId)
    }, 1500)
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleClose = () => {
    if (isProcessing) {
      // Show confirmation if payment is processing
      const confirmed = window.confirm(
        'Your payment is being processed. Are you sure you want to close?'
      )
      if (!confirmed) return
    }
    onClose()
  }

  const handleRetry = () => {
    setError(null)
    setSheetState('loading')
    refetchCheckout()
  }

  // Stripe appearance based on theme
  const appearance: Appearance = {
    theme: theme === 'dark' ? 'night' : 'stripe',
    variables: {
      colorPrimary: '#3B82F6',
      borderRadius: '8px',
    },
  }

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  }

  const formatInterval = (interval: string) => {
    switch (interval) {
      case 'day':
        return 'day'
      case 'week':
        return 'week'
      case 'month':
        return 'month'
      case 'year':
        return 'year'
      default:
        return interval
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent
        preventClose={isProcessing}
        onCloseAttempt={() => {
          window.alert('Please wait while your payment is being processed.')
        }}
      >
        <DrawerHeader className="text-center sm:text-left">
          <DrawerTitle>
            {sheetState === 'success'
              ? 'Payment Successful!'
              : existingSubscriptionId
              ? 'Complete Your Upgrade'
              : 'Complete Payment'}
          </DrawerTitle>
          {sheetState !== 'success' && checkoutSession && (
            <DrawerDescription>
              {existingSubscriptionId ? 'Upgrading to' : 'Subscribing to'}:{' '}
              <span className="font-medium">{checkoutSession.product.name}</span>
            </DrawerDescription>
          )}
        </DrawerHeader>

        {/* Loading State */}
        {sheetState === 'loading' && (
          <div className="space-y-6 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {/* Error State */}
        {sheetState === 'error' && (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Something went wrong. Please try again.'}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Success State */}
        {sheetState === 'success' && checkoutSession && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Payment Successful!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your subscription to {checkoutSession.product.name} is now active.
              </p>
            </div>
          </div>
        )}

        {/* Processing State */}
        {sheetState === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="animate-spin h-8 w-8 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Processing Payment...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please don't close this window.
              </p>
            </div>
          </div>
        )}

        {/* Ready State - Show Payment Form */}
        {sheetState === 'ready' && checkoutSession && (
          <div className="space-y-6">
            {/* Demo Mode Banner */}
            {isDemoMode && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Demo Mode:</strong> This is a preview with mock data. In production,
                  a real Stripe payment form will appear here.
                </AlertDescription>
              </Alert>
            )}

            {/* Plan Summary */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{checkoutSession.product.name}</h3>
                    <p className="text-2xl font-bold mt-1">
                      {formatAmount(checkoutSession.amount, checkoutSession.currency)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{formatInterval(checkoutSession.product.interval)}
                      </span>
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {existingSubscriptionId ? 'Upgrade' : 'New'}
                  </Badge>
                </div>

                {/* Features */}
                {checkoutSession.product.features.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Features Included:
                    </p>
                    <ul className="space-y-1">
                      {checkoutSession.product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-green-500"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proration Details (for upgrades) */}
            {checkoutSession.proration && (
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-3">Amount Due Today:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{checkoutSession.product.name}</span>
                      <span>
                        {formatAmount(
                          checkoutSession.proration.charged,
                          checkoutSession.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Credit (unused time)</span>
                      <span>
                        -
                        {formatAmount(
                          checkoutSession.proration.credited,
                          checkoutSession.currency
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total Due Now</span>
                      <span>
                        {formatAmount(
                          checkoutSession.proration.total,
                          checkoutSession.currency
                        )}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    {checkoutSession.proration.explanation}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Amount Due (no proration) */}
            {!checkoutSession.proration && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Amount Due Today:</span>
                    <span className="text-xl font-bold">
                      {formatAmount(checkoutSession.amount, checkoutSession.currency)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Payment Form - Demo or Real Stripe */}
            {isDemoMode ? (
              <DemoPaymentForm
                checkoutSession={checkoutSession}
                onSuccess={handlePaymentSuccess}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            ) : stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: checkoutSession.clientSecret,
                  appearance,
                }}
              >
                <PaymentForm
                  checkoutSession={checkoutSession}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </Elements>
            ) : null}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
