"use client";
import { Check, X } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { InlineLoader } from '../ui/inline-loader'
import { cn } from '../../utils/cn'
import { Money } from '../../utils/money'
import type { PricingProduct, PricingCurrentSubscription } from '../../client/types'
import { formatLimit, getYearlySavings, getActivePrice, isExactCurrentPrice as checkExactCurrentPrice, getButtonLabel } from './utils'

export interface PricingCardProps {
  product: PricingProduct
  /** All unique features across all products, for consistent row layout */
  allFeatures: Array<{ name: string; title: string; type: string }>
  isYearly: boolean
  currentSubscription: PricingCurrentSubscription | null
  currentPlanAmount: number
  onSelectPlan: (priceId: string) => void
  isDark?: boolean
  loadingPriceId?: string | null
}


export function PricingCard({
  product,
  allFeatures,
  isYearly,
  currentSubscription,
  currentPlanAmount,
  onSelectPlan,
  isDark,
  loadingPriceId,
}: PricingCardProps) {
  const monthlyPrice = product.prices.find((p) => p.interval === 'month')
  const yearlyPrice = product.prices.find((p) => p.interval === 'year')
  const currentPrice = getActivePrice(product, isYearly)
  const isThisLoading = !!currentPrice && loadingPriceId === currentPrice.id
  const anyLoading = !!loadingPriceId

  const savings =
    monthlyPrice && yearlyPrice
      ? getYearlySavings(monthlyPrice.amount, yearlyPrice.amount)
      : 0

  const isExact = checkExactCurrentPrice(product, currentSubscription, currentPrice)
  const isHighlighted = product.highlighted || isExact

  const buttonLabel = getButtonLabel(product, currentSubscription, currentPlanAmount, currentPrice, isYearly)

  const handleClick = () => {
    if (!isExact && currentPrice) {
      onSelectPlan(currentPrice.id)
    }
  }

  return (
    <div
      className={cn(
        'relative border p-8 transition-all duration-300',
        isDark ? 'bg-neutral-900' : 'bg-white',
        isHighlighted
          ? 'shadow-xl md:scale-105 z-10'
          : cn(
            isDark ? 'border-neutral-800 hover:border-neutral-700' : 'border-slate-200 hover:border-slate-300',
            'hover:shadow-lg hover:-translate-y-1'
          )
      )}
      style={{
        borderRadius: 'var(--bos-radius, 1rem)',
        ...(isHighlighted ? {
          borderColor: `color-mix(in srgb, var(--bos-primary, ${isDark ? '#fafafa' : '#171717'}) 30%, transparent)`,
          boxShadow: `0 0 0 2px var(--bos-primary, ${isDark ? '#fafafa' : '#171717'}), 0 20px 25px -5px color-mix(in srgb, var(--bos-primary, ${isDark ? '#fafafa' : '#171717'}) 10%, transparent)`,
        } : {}),
      }}
    >
      {/* Floating badge */}
      {(product.highlighted || isExact) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            className={cn(
              'border-0 px-4 py-1 text-xs font-semibold',
              isExact && 'bg-emerald-600 text-white'
            )}
            style={
              !isExact
                ? {
                    backgroundColor: `var(--bos-primary, ${isDark ? '#fafafa' : '#171717'})`,
                    color: isDark ? '#171717' : '#fafafa',
                  }
                : undefined
            }
          >
            {isExact ? 'Current Plan' : 'Most Popular'}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-1" style={{ color: isDark ? 'var(--bos-text, #fafafa)' : 'var(--bos-text, #171717)' }}>{product.name}</h3>
        {product.description && (
          <p className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-slate-500')}>{product.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold" style={{ color: isDark ? 'var(--bos-text, #fafafa)' : 'var(--bos-text, #171717)' }}>
            {currentPrice ? Money.formatWhole(currentPrice.amount, currentPrice.currency) : Money.formatWhole(0, product.prices[0]?.currency || 'usd')}
          </span>
          <span className={cn('text-sm', isDark ? 'text-neutral-400' : 'text-slate-500')}>{isYearly ? '/year' : '/mo'}</span>
        </div>
        {isYearly && savings > 0 && (
          <p className="text-sm text-emerald-600 font-medium mt-1">Save {savings}% yearly</p>
        )}
        {!isYearly && yearlyPrice && savings > 0 && (
          <p className={cn('text-sm mt-1', isDark ? 'text-neutral-500' : 'text-slate-400')}>Switch to yearly &amp; save {savings}%</p>
        )}
      </div>

      {/* Trial badge */}
      {product.trialDays > 0 && !isExact && (
        <div className="mb-6">
          <Badge variant="outline" className={cn(isDark ? 'bg-amber-900/20 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200')}>
            {product.trialDays}-day free trial
          </Badge>
        </div>
      )}

      {/* CTA */}
      <Button
        disabled={isExact || (anyLoading && !isThisLoading)}
        onClick={handleClick}
        className={cn(
          'w-full mb-8 h-11 font-medium transition-all border-0',
          isExact
            ? cn(isDark ? 'bg-neutral-800 text-neutral-500 hover:bg-neutral-800' : 'bg-slate-100 text-slate-400 hover:bg-slate-100', 'cursor-not-allowed')
            : isHighlighted
              ? 'shadow-md hover:opacity-90'
              : isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        )}
        style={{
          borderRadius: 'var(--bos-radius, 0.75rem)',
          ...(isHighlighted && !isExact ? {
            backgroundColor: `var(--bos-primary, ${isDark ? '#fafafa' : '#171717'})`,
            color: isDark ? '#171717' : '#fafafa',
          } : {}),
        }}
      >
        {isThisLoading ? <InlineLoader spinnerSize={14} /> : buttonLabel}
      </Button>

      {/* Features */}
      <div className="space-y-4">
        <p className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-neutral-500' : 'text-slate-400')}>
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
                    ? (isDark ? 'text-neutral-300' : 'text-slate-700')
                    : (isDark ? 'text-neutral-600' : 'text-slate-300')
                )}
              >
                {/* Check / X */}
                <div
                  className={cn(
                    'flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0',
                    !hasFeature && (isDark ? 'bg-neutral-800' : 'bg-slate-100')
                  )}
                  style={hasFeature ? { backgroundColor: `color-mix(in srgb, var(--bos-primary, ${isDark ? '#fafafa' : '#171717'}) 15%, transparent)` } : undefined}
                >
                  {hasFeature ? (
                    <Check className="w-3 h-3" style={{ color: `var(--bos-primary, ${isDark ? '#fafafa' : '#171717'})` }} />
                  ) : (
                    <X className={cn('w-3 h-3', isDark ? 'text-neutral-600' : 'text-slate-400')} />
                  )}
                </div>

                {/* Label */}
                <span className="flex-1">
                  {limit === -1 ? `Unlimited ${featureMeta.title}` : featureMeta.title}
                </span>

                {/* Value pill */}
                {displayValue && (
                  <span className={cn('flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded', isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-100 text-slate-500')}>
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
