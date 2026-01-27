import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Checkbox } from '../../ui/checkbox'
import { Label } from '../../ui/label'
import { Skeleton } from '../../ui/skeleton'
import { cn } from '@/utils/cn'

// Stripe imports
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'

interface AddPaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (paymentMethodId: string, setAsDefault: boolean) => void
  clientSecret?: string
  stripePublishableKey?: string
  isLoading?: boolean
}

// Card element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: 'hsl(var(--foreground))',
      '::placeholder': {
        color: 'hsl(var(--muted-foreground))',
      },
    },
    invalid: {
      color: 'hsl(var(--destructive))',
    },
  },
}

interface PaymentFormProps {
  clientSecret: string
  onSuccess: (paymentMethodId: string, setAsDefault: boolean) => void
  onCancel: () => void
}

function PaymentForm({ clientSecret, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [setAsDefault, setSetAsDefault] = React.useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card element not found')
      setIsSubmitting(false)
      return
    }

    try {
      const { setupIntent, error: setupError } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      )

      if (setupError) {
        setError(setupError.message || 'Failed to set up payment method')
        setIsSubmitting(false)
        return
      }

      if (setupIntent?.payment_method) {
        onSuccess(setupIntent.payment_method as string, setAsDefault)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Card Details</Label>
          <div className="rounded-md border border-input bg-background p-3">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={setAsDefault}
            onCheckedChange={(checked) => setSetAsDefault(checked as boolean)}
          />
          <span className="text-sm">Set as default payment method</span>
        </label>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Card'}
        </Button>
      </DialogFooter>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <LockIcon className="h-3 w-3" />
        Secured by Stripe
      </p>
    </form>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

// Stripe promise cache
let stripePromise: Promise<Stripe | null> | null = null

function getStripePromise(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

export function AddPaymentMethodModal({
  open,
  onOpenChange,
  onSuccess,
  clientSecret,
  stripePublishableKey,
  isLoading,
}: AddPaymentMethodModalProps) {
  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleSuccess = (paymentMethodId: string, setAsDefault: boolean) => {
    onSuccess(paymentMethodId, setAsDefault)
    onOpenChange(false)
  }

  const showForm = !isLoading && clientSecret && stripePublishableKey

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Enter your card details below. Your card will be saved for future payments.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <LoadingSkeleton />}

        {showForm && (
          <Elements stripe={getStripePromise(stripePublishableKey)}>
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Elements>
        )}

        {!isLoading && !showForm && (
          <div className="py-8 text-center text-muted-foreground">
            <p>Unable to load payment form. Please try again.</p>
            <Button variant="outline" className="mt-4" onClick={handleCancel}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
