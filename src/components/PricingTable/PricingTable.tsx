import * as React from 'react'
import { Skeleton } from '../ui/skeleton'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'
import { useProducts } from './hooks/useProducts'
import { PricingCard } from './PricingCard'
import { PaymentBottomSheet } from '../PaymentBottomSheet'

export interface PricingTableProps {
  /**
   * Optional: Override which plans to show
   * If not provided, shows all active plans
   */
  planIds?: string[]

  /**
   * Optional: Billing interval toggle
   * Default: true (shows monthly/yearly toggle)
   */
  showIntervalToggle?: boolean

  /**
   * Optional: Default interval
   * Default: 'month'
   */
  defaultInterval?: 'month' | 'year'

  /**
   * Callback when user clicks Buy/Upgrade button
   * Opens PaymentBottomSheet automatically if not provided
   */
  onSelectPlan?: (priceId: string) => void

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark'

  /**
   * Optional: Title to display above the pricing table
   */
  title?: string

  /**
   * Optional: Description to display below the title
   */
  description?: string
}

export function PricingTable({
  planIds,
  showIntervalToggle = true,
  defaultInterval = 'month',
  onSelectPlan,
  theme,
  title = 'Choose Your Plan',
  description,
}: PricingTableProps) {
  const [selectedInterval, setSelectedInterval] = React.useState<'month' | 'year'>(defaultInterval)
  const [selectedPriceId, setSelectedPriceId] = React.useState<string | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useProducts({ planIds })

  const products = data?.products || []
  const currentSubscription = data?.currentSubscription || null

  // Check if any product has yearly pricing
  const hasYearlyPricing = products.some((p) =>
    p.prices.some((price) => price.interval === 'year')
  )

  // Handle plan selection
  const handleSelectPlan = (priceId: string) => {
    if (onSelectPlan) {
      onSelectPlan(priceId)
    } else {
      // Open PaymentBottomSheet
      setSelectedPriceId(priceId)
      setIsPaymentOpen(true)
    }
  }

  // Handle payment success
  const handlePaymentSuccess = (_subscriptionId: string) => {
    setIsPaymentOpen(false)
    setSelectedPriceId(null)
    // Refetch products to update current plan
    refetch()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full">
        {title && (
          <div className="text-center mb-8">
            <Skeleton className="h-10 w-64 mx-auto mb-2" />
            {description && <Skeleton className="h-5 w-96 mx-auto" />}
          </div>
        )}
        {showIntervalToggle && (
          <div className="flex justify-center mb-8">
            <Skeleton className="h-10 w-64" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Alert variant="destructive">
          <AlertDescription>
            {error.message || 'Failed to load pricing plans'}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <p className="text-muted-foreground">No pricing plans available</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      {(title || description) && (
        <div className="text-center mb-8">
          {title && (
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Interval Toggle */}
      {showIntervalToggle && hasYearlyPricing && (
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center rounded-lg bg-muted p-1">
            <button
              onClick={() => setSelectedInterval('month')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                selectedInterval === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedInterval('year')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
                selectedInterval === 'year'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">
                Save
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div
        className={cn(
          'grid gap-6',
          products.length === 1 && 'grid-cols-1 max-w-md mx-auto',
          products.length === 2 && 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto',
          products.length >= 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {products.map((product) => (
          <PricingCard
            key={product.id}
            product={product}
            selectedInterval={selectedInterval}
            currentSubscription={currentSubscription}
            onSelectPlan={handleSelectPlan}
            theme={theme}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          All plans include a 30-day money-back guarantee
        </p>
      </div>

      {/* Payment Bottom Sheet (only if no custom onSelectPlan handler) */}
      {!onSelectPlan && selectedPriceId && (
        <PaymentBottomSheet
          priceId={selectedPriceId}
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false)
            setSelectedPriceId(null)
          }}
          onSuccess={handlePaymentSuccess}
          existingSubscriptionId={currentSubscription?.id}
          theme={theme}
        />
      )}
    </div>
  )
}
