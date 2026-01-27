import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'
import type { PricingProduct, PricingPrice, PricingCurrentSubscription } from '../../client/types'

export interface PricingCardProps {
  product: PricingProduct
  selectedInterval: 'month' | 'year'
  currentSubscription: PricingCurrentSubscription | null
  onSelectPlan: (priceId: string) => void
  theme?: 'light' | 'dark'
}

export function PricingCard({
  product,
  selectedInterval,
  currentSubscription,
  onSelectPlan,
}: PricingCardProps) {
  // Find the price for the selected interval
  const selectedPrice = product.prices.find(
    (p) => p.interval === selectedInterval
  ) || product.prices[0]

  // Determine button state based on current subscription
  const isCurrentPlan = product.isCurrentPlan

  // Helper to determine if this is an upgrade or downgrade
  const getButtonState = (): 'current' | 'upgrade' | 'downgrade' | 'buy' => {
    if (!currentSubscription) return 'buy'
    if (isCurrentPlan) return 'current'

    // If current plan is this product, it's current
    if (currentSubscription.productId === product.id) return 'current'

    // Otherwise, we need to compare - for simplicity, assume products are sorted by price
    // In real implementation, you'd compare actual amounts
    return 'upgrade' // Default to upgrade for non-current plans
  }

  const buttonState = getButtonState()

  // Format price for display
  const formatPrice = (price: PricingPrice) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price.amount / 100)
  }

  // Calculate yearly savings
  const calculateYearlySavings = () => {
    const monthlyPrice = product.prices.find((p) => p.interval === 'month')
    const yearlyPrice = product.prices.find((p) => p.interval === 'year')

    if (!monthlyPrice || !yearlyPrice) return null

    const monthlyTotal = monthlyPrice.amount * 12
    const yearlyCost = yearlyPrice.amount
    const savings = ((monthlyTotal - yearlyCost) / monthlyTotal) * 100

    return Math.round(savings)
  }

  const yearlySavings = selectedInterval === 'year' ? calculateYearlySavings() : null

  // Format feature display
  const formatFeature = (feature: typeof product.features[0]) => {
    if (feature.properties?.limit === -1) {
      return `Unlimited ${feature.properties?.unit || feature.title.toLowerCase()}`
    }
    return feature.title
  }

  const handleClick = () => {
    if (buttonState !== 'current' && selectedPrice) {
      onSelectPlan(selectedPrice.id)
    }
  }

  return (
    <Card
      className={cn(
        'relative flex flex-col h-full transition-all duration-200',
        isCurrentPlan && 'border-primary border-2 shadow-lg',
        product.highlighted && !isCurrentPlan && 'border-primary/50',
        'hover:shadow-lg'
      )}
    >
      {/* Badges */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
        {isCurrentPlan && (
          <Badge className="bg-primary text-primary-foreground">
            Current Plan
          </Badge>
        )}
        {product.highlighted && !isCurrentPlan && (
          <Badge variant="secondary">
            Most Popular
          </Badge>
        )}
      </div>

      <CardHeader className="text-center pb-2 pt-8">
        <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
        <CardDescription className="text-sm mt-1">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-4">
        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold tracking-tight">
              {selectedPrice ? formatPrice(selectedPrice) : 'N/A'}
            </span>
            <span className="text-muted-foreground text-sm">
              /{selectedInterval === 'year' ? 'year' : 'mo'}
            </span>
          </div>
          {yearlySavings && yearlySavings > 0 && (
            <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Save {yearlySavings}%
            </Badge>
          )}
          {product.trialDays > 0 && buttonState === 'buy' && (
            <p className="text-sm text-muted-foreground mt-2">
              {product.trialDays}-day free trial
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3">
          {product.features.map((feature) => (
            <li key={feature.id} className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500 flex-shrink-0 mt-0.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm">{formatFeature(feature)}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          className="w-full"
          size="lg"
          variant={buttonState === 'current' ? 'outline' : 'default'}
          disabled={buttonState === 'current'}
          onClick={handleClick}
        >
          {buttonState === 'current' && (
            <span className="flex items-center gap-2">
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
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Current Plan
            </span>
          )}
          {buttonState === 'buy' && (
            product.trialDays > 0 ? 'Start Free Trial' : 'Get Started'
          )}
          {buttonState === 'upgrade' && 'Upgrade'}
          {buttonState === 'downgrade' && 'Downgrade'}
        </Button>
      </CardFooter>
    </Card>
  )
}
