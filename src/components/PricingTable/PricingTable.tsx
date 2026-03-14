"use client";
import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '../ui/skeleton'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { cn } from '../../utils/cn'
import { useProducts } from './hooks/useProducts'
import { PricingCard } from './PricingCard'
import { PaymentBottomSheet } from '../PaymentBottomSheet'
import { CheckoutModal } from '../CheckoutModal'
import { useBillingOS } from '../../providers/BillingOSProvider'

export interface PricingTableProps {
  planIds?: string[]
  showIntervalToggle?: boolean
  defaultInterval?: 'month' | 'year'
  onSelectPlan?: (priceId: string) => void
  theme?: 'light' | 'dark'
  title?: string
  description?: string
  /** Use the iframe-based checkout modal instead of bottom sheet */
  useCheckoutModal?: boolean
  /** Callback when plan is changed */
  onPlanChanged?: (subscription: any) => void
  /** Customer info to prefill in checkout (overrides context) */
  customer?: { email?: string; name?: string }
  /** Footer note below the cards. Pass null to hide it. */
  footerText?: string | null
  /** Render only the cards — no section wrapper, header, or footer text */
  compact?: boolean
}

/** Collect all unique features across all products (by feature.name) */
function getAllFeatures(products: Array<{ features: Array<{ name: string; title: string; type: string }> }>) {
  const seen = new Map<string, { name: string; title: string; type: string }>()
  products.forEach((product) => {
    product.features.forEach((f) => {
      if (!seen.has(f.name)) seen.set(f.name, { name: f.name, title: f.title, type: f.type })
    })
  })
  return Array.from(seen.values())
}

export function PricingTable({
  planIds,
  showIntervalToggle = true,
  defaultInterval = 'month',
  onSelectPlan,
  theme,
  title = 'Simple, transparent pricing',
  description = 'Choose the perfect plan for your needs. No hidden fees, cancel anytime.',
  useCheckoutModal = false,
  onPlanChanged,
  customer: customerProp,
  footerText = 'All plans include SSL security and 99.9% uptime SLA',
  compact = false,
}: PricingTableProps) {
  const [isYearly, setIsYearly] = React.useState(defaultInterval === 'year')
  const [selectedPriceId, setSelectedPriceId] = React.useState<string | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false)

  const { customerEmail, customerName, debug } = useBillingOS()
  const finalCustomerEmail = customerProp?.email || customerEmail
  const finalCustomerName = customerProp?.name || customerName
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useProducts({ planIds })
  const currentSubscription = data?.currentSubscription ?? null

  // Sort by monthly price ascending (free first)
  const products = React.useMemo(() => {
    return [...(data?.products ?? [])].sort((a, b) => {
      const aAmt = a.prices.find((p) => p.interval === 'month')?.amount ?? 0
      const bAmt = b.prices.find((p) => p.interval === 'month')?.amount ?? 0
      return aAmt - bAmt
    })
  }, [data])

  const allFeatures = React.useMemo(() => getAllFeatures(products), [products])

  const hasYearlyPricing = products.some((p) => p.prices.some((pr) => pr.interval === 'year'))

  const selectedInterval = isYearly ? 'year' : 'month'

  // Current plan's price amount for upgrade/downgrade comparison
  const currentPlanAmount = React.useMemo(() => {
    const currentProduct = products.find((p) => p.isCurrentPlan)
    return (
      currentProduct?.prices.find((p) => p.interval === selectedInterval)?.amount ??
      currentProduct?.prices[0]?.amount ??
      0
    )
  }, [products, selectedInterval])

  const handleSelectPlan = (priceId: string) => {
    if (onSelectPlan) {
      onSelectPlan(priceId)
    } else {
      setSelectedPriceId(priceId)
      setIsPaymentOpen(true)
    }
  }

  const handlePaymentSuccess = React.useCallback(
    async (subscription?: any) => {
      if (debug) console.log('[BillingOS] Payment success:', subscription)
      setIsPaymentOpen(false)
      setSelectedPriceId(null)
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
      if (onPlanChanged) onPlanChanged(subscription)
      await queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' })
      if (subscription) {
        queryClient.setQueryData(['products', planIds], (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            currentSubscription: subscription,
            products: oldData.products?.map((p: any) => ({
              ...p,
              isCurrentPlan: p.prices?.some((pr: any) => pr.id === subscription.priceId) ?? false,
            })),
          }
        })
      }
      await refetch()
    },
    [debug, queryClient, refetch, planIds, onPlanChanged]
  )

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className={cn('py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen', theme === 'dark' && 'dark')}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-72 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Skeleton className="h-[480px] rounded-2xl" />
            <Skeleton className="h-[480px] rounded-2xl" />
          </div>
        </div>
      </section>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <section className={cn('py-20 px-4', theme === 'dark' && 'dark')}>
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertDescription>{error.message || 'Failed to load pricing plans'}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </section>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (products.length === 0) {
    return (
      <section className={cn('py-20 px-4 text-center', theme === 'dark' && 'dark')}>
        <p className="text-muted-foreground">No pricing plans available</p>
      </section>
    )
  }

  const paymentComponent = !onSelectPlan && selectedPriceId ? (
    <>
      {useCheckoutModal ? (
        <CheckoutModal
          open={isPaymentOpen}
          onOpenChange={(open) => { if (!open) { setIsPaymentOpen(false); setSelectedPriceId(null) } }}
          priceId={selectedPriceId}
          customer={{ email: finalCustomerEmail, name: finalCustomerName }}
          onSuccess={handlePaymentSuccess}
          existingSubscriptionId={currentSubscription?.id}
          theme={theme}
        />
      ) : (
        <PaymentBottomSheet
          priceId={selectedPriceId}
          isOpen={isPaymentOpen}
          onClose={() => { setIsPaymentOpen(false); setSelectedPriceId(null) }}
          onSuccess={handlePaymentSuccess}
          existingSubscriptionId={currentSubscription?.id}
          theme={theme}
        />
      )}
    </>
  ) : null

  const cardsGrid = (
    <div
      className={cn(
        'grid gap-8 items-start',
        products.length === 1 && 'grid-cols-1 max-w-sm mx-auto',
        products.length === 2 && 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto',
        products.length >= 3 && 'grid-cols-1 md:grid-cols-3'
      )}
    >
      {products.map((product) => (
        <PricingCard
          key={product.id}
          product={product}
          allFeatures={allFeatures}
          isYearly={isYearly}
          currentSubscription={currentSubscription}
          currentPlanAmount={currentPlanAmount}
          onSelectPlan={handleSelectPlan}
          theme={theme}
        />
      ))}
    </div>
  )

  if (compact) {
    return (
      <div className={cn(theme === 'dark' && 'dark')}>
        {cardsGrid}
        {paymentComponent}
      </div>
    )
  }

  return (
    <section
      className={cn(
        'py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen',
        theme === 'dark' && 'dark'
      )}
    >
      <div className="max-w-5xl mx-auto">
        {/* Success notification */}
        {showSuccessMessage && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800 font-medium text-sm">
              Payment successful! Your subscription has been updated.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          {title && (
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">{description}</p>
          )}
        </div>

        {/* Billing toggle */}
        {showIntervalToggle && hasYearlyPricing && (
          <div className="flex items-center justify-center gap-4 mb-16">
            <span className={cn('text-sm font-medium transition-colors', !isYearly ? 'text-slate-900' : 'text-slate-400')}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              aria-label="Billing frequency"
            />
            <span className={cn('text-sm font-medium transition-colors', isYearly ? 'text-slate-900' : 'text-slate-400')}>
              Yearly
            </span>
            {isYearly && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 ml-2">
                Save up to 40%
              </Badge>
            )}
          </div>
        )}

        {cardsGrid}

        {/* Footer */}
        {footerText && (
          <div className="text-center mt-16">
            <p className="text-sm text-slate-400">{footerText}</p>
          </div>
        )}
      </div>

      {paymentComponent}
    </section>
  )
}
