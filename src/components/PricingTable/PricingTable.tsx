import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { CheckoutModal } from '../CheckoutModal'
import { useBillingOS } from '../../providers/BillingOSProvider'
import type { PricingProduct, PricingPrice } from '../../client/types'

export interface PricingTableProps {
  planIds?: string[]
  showIntervalToggle?: boolean
  defaultInterval?: 'month' | 'year'
  onSelectPlan?: (priceId: string) => void
  theme?: 'light' | 'dark'
  title?: string
  description?: string
  /** Use the new iframe-based checkout modal instead of bottom sheet */
  useCheckoutModal?: boolean
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
  useCheckoutModal = false,
}: PricingTableProps) {
  const [selectedInterval, setSelectedInterval] = React.useState<'month' | 'year'>(defaultInterval)
  const [selectedPriceId, setSelectedPriceId] = React.useState<string | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)

  // Get customer data from context to prefill checkout form
  const { customerEmail, customerName } = useBillingOS()

  // Get query client for cache invalidation
  const queryClient = useQueryClient()

  // State for success notification
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false)

  // Debug logging
  React.useEffect(() => {
    console.log('[PricingTable] Customer data from context:', {
      customerEmail,
      customerName,
      hasEmail: !!customerEmail,
      hasName: !!customerName,
    })
  }, [customerEmail, customerName])

  React.useEffect(() => {
    console.log('📊 BillingOS SDK v1.1.0 - PricingTable rendered - CSS injected')
    console.log('%c🚀 BillingOS SDK Version: 1.1.0', 'color: #10b981; font-weight: bold; font-size: 14px;')
    if (useCheckoutModal) {
      console.log(
        '%c🎉 Using NEW Iframe-based CheckoutModal with Real-time Updates!',
        'background: linear-gradient(to right, #10b981, #3b82f6); color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
      )
    } else {
      console.log('📦 Using PaymentBottomSheet (legacy)')
    }
  }, [useCheckoutModal])

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

  // Handle payment success with real-time update
  const handlePaymentSuccess = React.useCallback(async (subscription?: any) => {
    console.log('%c🎉 [PricingTable] handlePaymentSuccess CALLED!', 'color: #10b981; font-size: 14px; font-weight: bold;', subscription)
    console.log('[PricingTable] Subscription data:', subscription)

    // Close the payment modal
    setIsPaymentOpen(false)
    setSelectedPriceId(null)

    // Show success message
    console.log('[PricingTable] Showing success notification...')
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 5000) // Hide after 5 seconds

    // Force invalidate the products query to bypass stale time
    // This ensures immediate refetch of subscription status
    console.log('%c🔄 Invalidating products cache...', 'color: #8b5cf6; font-weight: 600;')
    await queryClient.invalidateQueries({
      queryKey: ['products'],
      refetchType: 'all' // Force refetch even if not stale
    })

    // If subscription data is provided, we can also optimistically update the cache
    if (subscription) {
      console.log('[PricingTable] Optimistically updating cache with subscription:', subscription)

      queryClient.setQueryData(['products', planIds], (oldData: any) => {
        if (!oldData) return oldData

        console.log('[PricingTable] Updating cache - old data:', oldData)

        const updatedData = {
          ...oldData,
          currentSubscription: subscription,
          products: oldData.products?.map((product: any) => ({
            ...product,
            // Update isCurrentPlan based on the new subscription
            isCurrentPlan: product.prices?.some((price: any) =>
              price.id === subscription.priceId
            ) || false
          }))
        }

        console.log('[PricingTable] Updated cache data:', updatedData)
        return updatedData
      })
    }

    // Also trigger a background refetch to ensure data consistency
    console.log('[PricingTable] Triggering background refetch...')
    await refetch()

    console.log('%c✅ Products cache invalidated and refetched', 'color: #10b981; font-weight: 600;')
  }, [queryClient, refetch, planIds])

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
      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-green-800 dark:text-green-200 font-medium">
              Payment successful! Your subscription has been updated.
            </p>
          </div>
        </div>
      )}

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
          {useCheckoutModal && (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Using Secure Iframe Checkout</span>
            </div>
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

      {/* Payment Component - Either Modal or Bottom Sheet */}
      {!onSelectPlan && selectedPriceId && (
        <>
          {useCheckoutModal ? (
            <CheckoutModal
              open={isPaymentOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setIsPaymentOpen(false)
                  setSelectedPriceId(null)
                }
              }}
              priceId={selectedPriceId}
              customer={{
                email: customerEmail,
                name: customerName,
              }}
              onSuccess={(subscription) => {
                handlePaymentSuccess(subscription)
              }}
              existingSubscriptionId={currentSubscription?.id}
              theme={theme}
            />
          ) : (
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
        </>
      )}
    </div>
  )
}
