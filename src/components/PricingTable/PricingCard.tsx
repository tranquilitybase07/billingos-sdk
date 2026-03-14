"use client";
import { Check, X } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'
import type { PricingProduct, PricingPrice, PricingCurrentSubscription } from '../../client/types'

export interface PricingCardProps {
  product: PricingProduct
  /** All unique features across all products, for consistent row layout */
  allFeatures: Array<{ name: string; title: string; type: string }>
  isYearly: boolean
  currentSubscription: PricingCurrentSubscription | null
  currentPlanAmount: number
  onSelectPlan: (priceId: string) => void
  theme?: 'light' | 'dark'
}


function formatPrice(price: PricingPrice) {
  const amount = price.amount / 100
  return amount % 1 === 0
    ? `$${amount.toFixed(0)}`
    : `$${amount.toFixed(2)}`
}

function formatLimit(limit: number, unit?: string): string | null {
  if (!limit) return null
  const n =
    limit >= 1000
      ? `${(limit / 1000).toFixed(limit % 1000 === 0 ? 0 : 1)}k`
      : limit.toLocaleString()
  return unit ? `${n} ${unit}` : n
}

function getYearlySavings(monthly: number, yearly: number) {
  const yearlyFromMonthly = monthly * 12
  return Math.round(((yearlyFromMonthly - yearly) / yearlyFromMonthly) * 100)
}

export function PricingCard({
  product,
  allFeatures,
  isYearly,
  currentSubscription,
  currentPlanAmount,
  onSelectPlan,
}: PricingCardProps) {
  const monthlyPrice = product.prices.find((p) => p.interval === 'month')
  const yearlyPrice = product.prices.find((p) => p.interval === 'year')
  const currentPrice = isYearly && yearlyPrice ? yearlyPrice : monthlyPrice

  const savings =
    monthlyPrice && yearlyPrice
      ? getYearlySavings(monthlyPrice.amount, yearlyPrice.amount)
      : 0

  const isHighlighted = product.highlighted || product.isCurrentPlan
  const isFree = (monthlyPrice?.amount ?? 0) === 0

  // CTA label
  const getButtonLabel = () => {
    if (product.isCurrentPlan) return 'Current Plan'
    if (!currentSubscription) return isFree ? 'Get Started Free' : 'Get Started'
    const thisAmount = currentPrice?.amount ?? 0
    if (thisAmount > currentPlanAmount) return 'Upgrade Now'
    if (thisAmount < currentPlanAmount) return 'Downgrade'
    return 'Switch Plan'
  }

  const handleClick = () => {
    if (!product.isCurrentPlan && currentPrice) {
      onSelectPlan(currentPrice.id)
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-white p-8 transition-all duration-300',
        isHighlighted
          ? 'border-blue-200 ring-2 ring-blue-600 shadow-xl shadow-blue-500/10 md:scale-105 z-10'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
      )}
    >
      {/* Floating badge */}
      {(product.highlighted || product.isCurrentPlan) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            className={cn(
              'border-0 px-4 py-1 text-xs font-semibold',
              product.isCurrentPlan ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            )}
          >
            {product.isCurrentPlan ? 'Current Plan' : 'Most Popular'}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-slate-500">{product.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900">
            {currentPrice ? formatPrice(currentPrice) : '$0'}
          </span>
          <span className="text-slate-500 text-sm">{isYearly ? '/year' : '/mo'}</span>
        </div>
        {isYearly && savings > 0 && (
          <p className="text-sm text-emerald-600 font-medium mt-1">Save {savings}% yearly</p>
        )}
        {!isYearly && yearlyPrice && savings > 0 && (
          <p className="text-sm text-slate-400 mt-1">Switch to yearly &amp; save {savings}%</p>
        )}
      </div>

      {/* Trial badge */}
      {product.trialDays > 0 && !product.isCurrentPlan && (
        <div className="mb-6">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {product.trialDays}-day free trial
          </Badge>
        </div>
      )}

      {/* CTA */}
      <Button
        disabled={product.isCurrentPlan}
        onClick={handleClick}
        className={cn(
          'w-full mb-8 h-11 rounded-xl font-medium transition-all border-0',
          product.isCurrentPlan
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100'
            : isHighlighted
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        )}
      >
        {getButtonLabel()}
      </Button>

      {/* Features */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          What&apos;s included
        </p>
        <ul className="space-y-3">
          {allFeatures.map((featureMeta) => {
            const productFeature = product.features.find((f) => f.name === featureMeta.name)
            const hasFeature = !!productFeature
            const limit = productFeature?.properties?.limit
            const unit = productFeature?.properties?.unit
            const displayValue =
              hasFeature && typeof limit === 'number' && limit !== -1
                ? formatLimit(limit, unit)
                : null

            return (
              <li
                key={featureMeta.name}
                className={cn(
                  'flex items-center gap-3 text-sm',
                  hasFeature ? 'text-slate-700' : 'text-slate-300'
                )}
              >
                {/* Check / X */}
                <div
                  className={cn(
                    'flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0',
                    hasFeature ? 'bg-blue-100' : 'bg-slate-100'
                  )}
                >
                  {hasFeature ? (
                    <Check className="w-3 h-3 text-blue-600" />
                  ) : (
                    <X className="w-3 h-3 text-slate-400" />
                  )}
                </div>

                {/* Label */}
                <span className="flex-1">
                  {limit === -1 ? `Unlimited ${featureMeta.title}` : featureMeta.title}
                </span>

                {/* Value pill */}
                {displayValue && (
                  <span className="flex-shrink-0 text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded">
                    {displayValue}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
