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
  isDark?: boolean
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
  isDark,
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
        'relative border p-8 transition-all duration-300',
        isDark ? 'bg-[#1c1c1e]' : 'bg-white',
        isHighlighted
          ? 'shadow-xl md:scale-105 z-10'
          : cn(
              isDark ? 'border-[#2e2e30] hover:border-[#3e3e42]' : 'border-slate-200 hover:border-slate-300',
              'hover:shadow-lg hover:-translate-y-1'
            )
      )}
      style={{
        borderRadius: 'var(--bos-radius, 1rem)',
        ...(isHighlighted ? {
          borderColor: 'color-mix(in srgb, var(--bos-primary, #2563eb) 30%, transparent)',
          boxShadow: '0 0 0 2px var(--bos-primary, #2563eb), 0 20px 25px -5px color-mix(in srgb, var(--bos-primary, #2563eb) 10%, transparent)',
        } : {}),
      }}
    >
      {/* Floating badge */}
      {(product.highlighted || product.isCurrentPlan) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            className={cn(
              'border-0 px-4 py-1 text-xs font-semibold text-white',
              product.isCurrentPlan && 'bg-emerald-600'
            )}
            style={!product.isCurrentPlan ? { backgroundColor: 'var(--bos-primary, #2563eb)' } : undefined}
          >
            {product.isCurrentPlan ? 'Current Plan' : 'Most Popular'}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-1" style={{ color: isDark ? 'var(--bos-text, #f4f4f5)' : 'var(--bos-text, #0f172a)' }}>{product.name}</h3>
        {product.description && (
          <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{product.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold" style={{ color: isDark ? 'var(--bos-text, #f4f4f5)' : 'var(--bos-text, #0f172a)' }}>
            {currentPrice ? formatPrice(currentPrice) : '$0'}
          </span>
          <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{isYearly ? '/year' : '/mo'}</span>
        </div>
        {isYearly && savings > 0 && (
          <p className="text-sm text-emerald-600 font-medium mt-1">Save {savings}% yearly</p>
        )}
        {!isYearly && yearlyPrice && savings > 0 && (
          <p className={cn('text-sm mt-1', isDark ? 'text-slate-500' : 'text-slate-400')}>Switch to yearly &amp; save {savings}%</p>
        )}
      </div>

      {/* Trial badge */}
      {product.trialDays > 0 && !product.isCurrentPlan && (
        <div className="mb-6">
          <Badge variant="outline" className={cn(isDark ? 'bg-amber-900/20 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200')}>
            {product.trialDays}-day free trial
          </Badge>
        </div>
      )}

      {/* CTA */}
      <Button
        disabled={product.isCurrentPlan}
        onClick={handleClick}
        className={cn(
          'w-full mb-8 h-11 font-medium transition-all border-0',
          product.isCurrentPlan
            ? cn(isDark ? 'bg-[#2e2e30] text-slate-500 hover:bg-[#2e2e30]' : 'bg-slate-100 text-slate-400 hover:bg-slate-100', 'cursor-not-allowed')
            : isHighlighted
            ? 'text-white shadow-md hover:opacity-90'
            : isDark ? 'bg-[#2e2e30] hover:bg-[#3e3e42] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        )}
        style={{
          borderRadius: 'var(--bos-radius, 0.75rem)',
          ...(isHighlighted && !product.isCurrentPlan ? {
            backgroundColor: 'var(--bos-primary, #2563eb)',
          } : {}),
        }}
      >
        {getButtonLabel()}
      </Button>

      {/* Features */}
      <div className="space-y-4">
        <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-slate-500' : 'text-slate-400')}>
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
                  hasFeature
                    ? (isDark ? 'text-slate-300' : 'text-slate-700')
                    : (isDark ? 'text-slate-600' : 'text-slate-300')
                )}
              >
                {/* Check / X */}
                <div
                  className={cn(
                    'flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0',
                    !hasFeature && (isDark ? 'bg-[#2e2e30]' : 'bg-slate-100')
                  )}
                  style={hasFeature ? { backgroundColor: 'color-mix(in srgb, var(--bos-primary, #2563eb) 15%, transparent)' } : undefined}
                >
                  {hasFeature ? (
                    <Check className="w-3 h-3" style={{ color: 'var(--bos-primary, #2563eb)' }} />
                  ) : (
                    <X className={cn('w-3 h-3', isDark ? 'text-slate-600' : 'text-slate-400')} />
                  )}
                </div>

                {/* Label */}
                <span className="flex-1">
                  {limit === -1 ? `Unlimited ${featureMeta.title}` : featureMeta.title}
                </span>

                {/* Value pill */}
                {displayValue && (
                  <span className={cn('flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded', isDark ? 'bg-[#2e2e30] text-slate-400' : 'bg-slate-100 text-slate-500')}>
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
