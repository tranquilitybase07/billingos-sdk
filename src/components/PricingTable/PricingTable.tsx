import * as React from 'react'
import { Skeleton } from '../ui/skeleton'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { cn } from '../../utils/cn'
import { useProducts } from './hooks/useProducts'
import { PaymentBottomSheet } from '../PaymentBottomSheet'
import type { PricingProduct, PricingPrice } from '../../client/types'

export interface PricingTableProps {
  planIds?: string[]
  showIntervalToggle?: boolean
  defaultInterval?: 'month' | 'year'
  onSelectPlan?: (priceId: string) => void
  theme?: 'light' | 'dark'
  title?: string
  description?: string
}

interface FeatureRow {
  name: string
  values: (string | boolean | number | null)[]
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

  React.useEffect(() => {
    console.log('📊 PricingTable v0.1.2 rendered - CSS injected')
  }, [])

  const { data, isLoading, error, refetch } = useProducts({ planIds })

  const products = data?.products || []
  const currentSubscription = data?.currentSubscription || null

  // Check if any product has yearly pricing
  const hasYearlyPricing = products.some((p) =>
    p.prices.some((price) => price.interval === 'year')
  )

  // Extract all unique features across all products
  const getAllFeatures = React.useMemo((): FeatureRow[] => {
    const featureMap = new Map<string, FeatureRow>()

    // First, collect all unique features using feature.id as key
    products.forEach((product) => {
      product.features.forEach((feature) => {
        if (!featureMap.has(feature.id)) {
          featureMap.set(feature.id, {
            name: feature.title,
            values: Array(products.length).fill(null),
          })
        }
      })
    })

    // Populate feature values for each product
    const featureRows = Array.from(featureMap.entries())
    featureRows.forEach(([featureId, featureRow]) => {
      products.forEach((product, productIndex) => {
        const feature = product.features.find((f) => f.id === featureId)
        if (feature) {
          // Determine feature value based on type
          if (feature.type === 'boolean_flag') {
            featureRow.values[productIndex] = true
          } else if (feature.type === 'usage_quota' || feature.type === 'numeric_limit') {
            const limit = feature.properties?.limit
            if (limit === -1) {
              featureRow.values[productIndex] = 'Unlimited'
            } else if (typeof limit === 'number') {
              featureRow.values[productIndex] = limit
            } else {
              featureRow.values[productIndex] = true
            }
          }
        }
      })
    })

    return featureRows.map(([, row]) => row)
  }, [products])

  // Format price for display
  const formatPrice = (price: PricingPrice) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price.amount / 100)
  }

  // Get price for selected interval
  const getPriceForInterval = (product: PricingProduct): PricingPrice | null => {
    return product.prices.find((p) => p.interval === selectedInterval) || product.prices[0] || null
  }

  // Handle plan selection
  const handleSelectPlan = (priceId: string) => {
    if (onSelectPlan) {
      onSelectPlan(priceId)
    } else {
      setSelectedPriceId(priceId)
      setIsPaymentOpen(true)
    }
  }

  // Handle payment success
  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false)
    setSelectedPriceId(null)
    refetch()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('w-full', theme === 'dark' && 'dark')}>
        {title && (
          <div className="text-center mb-8">
            <Skeleton className="h-10 w-64 mx-auto mb-2" />
            {description && <Skeleton className="h-5 w-96 mx-auto" />}
          </div>
        )}
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn('w-full max-w-md mx-auto', theme === 'dark' && 'dark')}>
        <Alert variant="destructive">
          <AlertDescription>
            {error.message || 'Failed to load pricing plans'}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className={cn('w-full text-center py-12', theme === 'dark' && 'dark')}>
        <p className="text-muted-foreground">No pricing plans available</p>
      </div>
    )
  }

  return (
    <div className={cn('w-full', theme === 'dark' && 'dark')}>
      {/* Header */}
      {(title || description) && (
        <div className="text-center mb-8">
          {title && (
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
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
              <Badge variant="secondary" className="text-xs">
                Save
              </Badge>
            </button>
          </div>
        </div>
      )}

      {/* Pricing Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          {/* Header Row: Plan Names & Prices */}
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-[200px]" />
              {products.map((product) => {
                const price = getPriceForInterval(product)
                const isHighlighted = product.highlighted
                const isCurrentPlan = product.isCurrentPlan

                return (
                  <TableHead
                    key={product.id}
                    className={cn(
                      'text-center relative',
                      isHighlighted && 'bg-foreground text-background'
                    )}
                  >
                    <div className="py-8">
                      {/* Badges */}
                      {(isHighlighted || isCurrentPlan) && (
                        <div className="flex justify-center gap-2 mb-3">
                          {isCurrentPlan && (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              Current Plan
                            </Badge>
                          )}
                          {isHighlighted && !isCurrentPlan && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                isHighlighted && "bg-background text-foreground"
                              )}
                            >
                              Popular
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Plan Name */}
                      <div className={cn(
                        "font-bold text-xl mb-3",
                        isHighlighted ? "text-background" : "text-foreground"
                      )}>
                        {product.name}
                      </div>

                      {/* Price */}
                      {price && (
                        <>
                          <div className={cn(
                            "text-5xl font-bold mb-2",
                            isHighlighted ? "text-background" : "text-foreground"
                          )}>
                            {formatPrice(price)}
                          </div>
                          <div className={cn(
                            "text-sm mt-1",
                            isHighlighted ? "text-background/70" : "text-muted-foreground"
                          )}>
                            Per {selectedInterval === 'year' ? 'year' : 'month'}
                          </div>
                        </>
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>

          {/* Feature Rows */}
          <TableBody>
            {getAllFeatures.map((featureRow, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-foreground py-4">
                  {featureRow.name}
                </TableCell>
                {featureRow.values.map((value, productIndex) => {
                  const isHighlighted = products[productIndex]?.highlighted

                  return (
                    <TableCell
                      key={productIndex}
                      className={cn(
                        'text-center py-4',
                        isHighlighted && 'bg-foreground/5'
                      )}
                    >
                      {value === null || value === false ? (
                        <span className="text-muted-foreground">-</span>
                      ) : value === true ? (
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
                          className="inline-block text-foreground"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                      ) : (
                        <span className="text-foreground font-medium">{value}</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}

            {/* CTA Buttons Row */}
            <TableRow className="hover:bg-transparent border-t">
              <TableCell className="font-medium text-foreground py-6">
                Server speed
              </TableCell>
              {products.map((product) => {
                const price = getPriceForInterval(product)
                const isHighlighted = product.highlighted
                const isCurrentPlan = product.isCurrentPlan

                return (
                  <TableCell
                    key={product.id}
                    className={cn(
                      'text-center py-6',
                      isHighlighted && 'bg-foreground/5'
                    )}
                  >
                    <Button
                      onClick={() => price && handleSelectPlan(price.id)}
                      disabled={isCurrentPlan || !price}
                      variant={isHighlighted && !isCurrentPlan ? 'default' : 'outline'}
                      className={cn(
                        "w-full max-w-[200px]",
                        isHighlighted && !isCurrentPlan && "bg-foreground text-background hover:bg-foreground/90"
                      )}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Get Started'}
                    </Button>
                  </TableCell>
                )
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Payment Bottom Sheet */}
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
