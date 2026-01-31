import * as React from 'react'
import {
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { cn } from '@/utils/cn'
import type { CheckoutSession } from '../../client/types'
import { useBillingOS } from '../../providers/BillingOSProvider'

interface PaymentFormProps {
  checkoutSession: CheckoutSession
  onSuccess: (subscriptionId: string) => void
  onError?: (error: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

export function PaymentForm({
  checkoutSession,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}: PaymentFormProps) {
  const { client } = useBillingOS()
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = React.useState<string | null>(null)
  const [isExpressCheckoutReady, setIsExpressCheckoutReady] = React.useState(false)

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  }

  const totalAmount = checkoutSession.proration?.total ?? checkoutSession.amount
  const formattedAmount = formatAmount(totalAmount, checkoutSession.currency)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Confirm payment with Stripe
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing/success`,
        },
        redirect: 'if_required',
      })

      if (submitError) {
        setError(submitError.message || 'Payment failed')
        onError?.(submitError.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      // Payment successful - confirm with backend to create subscription
      if (paymentIntent?.status === 'succeeded' && paymentIntent.payment_method) {
        try {
          const result = await client.confirmCheckout(
            checkoutSession.clientSecret,
            paymentIntent.payment_method as string
          )

          if (result.success) {
            onSuccess(result.subscriptionId)
          } else {
            throw new Error(result.message || 'Failed to create subscription')
          }
        } catch (confirmError) {
          const message = confirmError instanceof Error ? confirmError.message : 'Failed to complete checkout'
          setError(message)
          onError?.(message)
          setIsProcessing(false)
          return
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      onError?.(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExpressCheckout = async (_event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        clientSecret: checkoutSession.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/billing/success`,
        },
        redirect: 'if_required',
      })

      if (submitError) {
        setError(submitError.message || 'Payment failed')
        onError?.(submitError.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      // Express checkout successful
      onSuccess(checkoutSession.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      onError?.(message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout (Apple Pay, Google Pay, Link) */}
      <div className={cn(!isExpressCheckoutReady && 'hidden')}>
        <ExpressCheckoutElement
          options={{
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
          onConfirm={handleExpressCheckout}
          onReady={() => setIsExpressCheckoutReady(true)}
        />
      </div>

      {/* Separator */}
      {isExpressCheckoutReady && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              or pay with card
            </span>
          </div>
        </div>
      )}

      {/* Card Payment Form */}
      <div className="space-y-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
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
            Processing...
          </span>
        ) : checkoutSession.proration ? (
          `Upgrade Now - ${formattedAmount}`
        ) : (
          `Subscribe - ${formattedAmount}`
        )}
      </Button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
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
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Secured by Stripe • Cancel anytime</span>
      </div>
    </form>
  )
}
