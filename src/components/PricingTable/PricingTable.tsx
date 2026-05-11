"use client";
import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '../ui/skeleton'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'
import { useProducts } from './hooks/useProducts'
import { PricingCard } from './PricingCard'
import { ComparisonTable } from './PricingTableComparison'
import { CheckoutModal } from '../CheckoutModal'
import { useBillingOS } from '../../providers/BillingOSProvider'
import { getMaxYearlySavings } from './utils'

export interface PricingTableProps {
  /** Layout variant. `'comparison'` renders a horizontal feature-comparison table; `'cards'` renders the original card grid. */
  variant?: 'cards' | 'comparison'
  planIds?: string[]
  showIntervalToggle?: boolean
  defaultInterval?: 'month' | 'year'
  onSelectPlan?: (priceId: string) => void
  /**
   * @deprecated Use `appearance.theme` on `<BillingOSProvider>` instead.
   */
  theme?: 'light' | 'dark'
  title?: string
  description?: string
  /** Callback when plan is changed */
  onPlanChanged?: (subscription: any) => void
  /** Customer info to prefill in checkout (overrides context) */
  customer?: { email?: string; name?: string }
  /** Footer note below the cards. Pass null to hide it. */
  footerText?: string | null
  /** Render only the cards/table — no section wrapper, header, or footer text */
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
  variant = 'comparison',
  planIds,
  showIntervalToggle = true,
  defaultInterval = 'month',
  onSelectPlan,
  theme: themeProp,
  title = 'Plans & Pricing',
  description = 'Choose a plan that fits your team.',
  onPlanChanged,
  customer: customerProp,
  footerText = 'All plans include SSL security and 99.9% uptime SLA',
  compact = false,
}: PricingTableProps) {
  const [isYearly, setIsYearly] = React.useState(defaultInterval === 'year')
  const [selectedPriceId, setSelectedPriceId] = React.useState<string | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
  const [loadingPriceId, setLoadingPriceId] = React.useState<string | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false)

  const { customerEmail, customerName, appearance, debug } = useBillingOS()
  // Legacy theme prop takes precedence for backward compat, then appearance.theme
  const theme = themeProp ?? appearance?.theme
  const isDark = theme === 'dark'
  const finalCustomerEmail = customerProp?.email || customerEmail
  const finalCustomerName = customerProp?.name || customerName
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useProducts({ planIds })
  const currentSubscription = data?.currentSubscription ?? null

  // Auto-toggle to the current subscription's billing interval so the
  // "Current Plan" badge is visible immediately (e.g. yearly sub → yearly view)
  React.useEffect(() => {
    if (currentSubscription?.interval) {
      setIsYearly(currentSubscription.interval === 'year')
    }
  }, [currentSubscription?.interval])

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
  const maxYearlySavings = React.useMemo(() => getMaxYearlySavings(products), [products])

  const selectedInterval = isYearly ? 'year' : 'month'

  // Current plan's price amount for upgrade/downgrade comparison
  const currentPlanAmount = React.useMemo(() => {
    if (currentSubscription?.amount != null) return currentSubscription.amount
    // Fallback for backward compat with older backends
    const currentProduct = products.find((p) => p.isCurrentPlan)
    if (!currentProduct) return 0
    const lookupInterval = currentSubscription?.interval ?? selectedInterval
    return currentProduct.prices.find((p) => p.interval === lookupInterval)?.amount
      ?? currentProduct.prices[0]?.amount ?? 0
  }, [products, selectedInterval, currentSubscription])

  const handleSelectPlan = (priceId: string) => {
    if (onSelectPlan) {
      onSelectPlan(priceId)
    } else {
      setSelectedPriceId(priceId)
      setLoadingPriceId(priceId)
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
      <section
        className="py-12 px-4 sm:px-6 lg:px-8 min-h-screen"
        style={{ backgroundColor: isDark ? 'var(--bos-bg, #0a0a0a)' : 'var(--bos-bg, #ffffff)' }}
      >
        <div className="max-w-[960px] mx-auto">
          <div className="text-center mb-6">
            <Skeleton className="h-8 w-56 mx-auto mb-2" />
            <Skeleton className="h-4 w-72 mx-auto" />
          </div>
          {variant === 'comparison' ? (
            <div className="space-y-2">
              <Skeleton className="h-28 w-full rounded-xl" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <Skeleton className="h-[480px] rounded-2xl" />
              <Skeleton className="h-[480px] rounded-2xl" />
            </div>
          )}
        </div>
      </section>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <section className="py-20 px-4">
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
      <section className="py-20 px-4 text-center">
        <p className="text-muted-foreground">No pricing plans available</p>
      </section>
    )
  }

  const paymentComponent = !onSelectPlan && selectedPriceId ? (
    <CheckoutModal
      open={isPaymentOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsPaymentOpen(false)
          setSelectedPriceId(null)
          setLoadingPriceId(null)
        }
      }}
      priceId={selectedPriceId}
      customer={{ email: finalCustomerEmail, name: finalCustomerName }}
      onSuccess={handlePaymentSuccess}
      onReady={() => setLoadingPriceId(null)}
      existingSubscriptionId={currentSubscription?.id}
    />
  ) : null

  const intervalToggle = showIntervalToggle && hasYearlyPricing ? (
    <div className="flex justify-center">
      <div
        className={cn(
          'relative flex items-center p-0.5 rounded-full',
          isDark ? 'bg-neutral-900' : 'bg-slate-100',
        )}
        role="tablist"
        aria-label="Billing frequency"
      >
        <button
          role="tab"
          aria-selected={isYearly}
          onClick={() => setIsYearly(true)}
          className={cn(
            'relative w-20 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer',
            isYearly
              ? isDark ? 'bg-white text-black' : 'bg-black text-white'
              : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-black',
          )}
        >
          Yearly
          {maxYearlySavings > 0 && (
            <span
              className={cn(
                'absolute -top-2 -right-1.5 text-[9px] font-bold px-1 py-px rounded border leading-none',
                isDark ? 'bg-white text-black border-neutral-950' : 'bg-black text-white border-white',
              )}
            >
              -{maxYearlySavings}%
            </span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={!isYearly}
          onClick={() => setIsYearly(false)}
          className={cn(
            'w-20 py-1.5 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer',
            !isYearly
              ? isDark ? 'bg-white text-black' : 'bg-black text-white'
              : isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-600 hover:text-black',
          )}
        >
          Monthly
        </button>
      </div>
    </div>
  ) : null

  const pricingContent = variant === 'comparison' ? (
    <ComparisonTable
      products={products}
      allFeatures={allFeatures}
      isYearly={isYearly}
      currentSubscription={currentSubscription}
      currentPlanAmount={currentPlanAmount}
      onSelectPlan={handleSelectPlan}
      isDark={isDark}
      loadingPriceId={loadingPriceId}
    />
  ) : (
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
          isDark={isDark}
          loadingPriceId={loadingPriceId}
        />
      ))}
    </div>
  )

  if (compact) {
    return (
      <div
        className="space-y-4 p-4 rounded-xl"
        style={{
          backgroundColor: isDark ? 'var(--bos-bg, #0a0a0a)' : 'var(--bos-bg, #ffffff)',
          color: isDark ? 'var(--bos-text, #fafafa)' : 'var(--bos-text, #171717)',
          fontFamily: 'var(--bos-font, inherit)',
        }}
      >
        {intervalToggle}
        {pricingContent}
        {paymentComponent}
      </div>
    )
  }

  return (
    <section
      className="py-12 px-4 sm:px-6 lg:px-8 min-h-screen"
      style={{
        backgroundColor: isDark ? 'var(--bos-bg, #0a0a0a)' : 'var(--bos-bg, #ffffff)',
        fontFamily: 'var(--bos-font, inherit)',
      }}
    >
      <div className="max-w-[960px] mx-auto">
        {showSuccessMessage && (
          <div className={cn('mb-6 p-4 border rounded-xl flex items-center gap-3', isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200')}>
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className={cn('font-medium text-sm', isDark ? 'text-green-300' : 'text-green-800')}>
              Payment successful! Your subscription has been updated.
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          {title && (
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: isDark ? 'var(--bos-text, #fafafa)' : 'var(--bos-text, #171717)' }}
            >
              {title}
            </h1>
          )}
          {description && (
            <p className={cn('mt-1.5 text-sm', isDark ? 'text-neutral-400' : 'text-slate-500')}>
              {description}
            </p>
          )}
        </div>

        <div className="mt-6">{intervalToggle}</div>

        <div className="mt-4">{pricingContent}</div>

        {footerText && (
          <div className="text-center mt-6">
            <p className={cn('text-xs', isDark ? 'text-neutral-500' : 'text-slate-400')}>{footerText}</p>
          </div>
        )}
      </div>

      {paymentComponent}
    </section>
  )
}
