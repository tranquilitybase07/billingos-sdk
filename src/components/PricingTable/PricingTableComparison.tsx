"use client";
import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getCentsInDollarString, getCurrencySymbol } from '../../utils/money'
import { InlineLoader } from '../ui/inline-loader'
import type { PricingProduct, PricingCurrentSubscription } from '../../client/types'
import { formatLimit, getActivePrice, isExactCurrentPrice, getButtonLabel } from './utils'

export interface ComparisonTableProps {
  products: PricingProduct[]
  allFeatures: Array<{ name: string; title: string; type: string }>
  isYearly: boolean
  currentSubscription: PricingCurrentSubscription | null
  currentPlanAmount: number
  onSelectPlan: (priceId: string) => void
  isDark?: boolean
  loadingPriceId?: string | null
}

export function ComparisonTable({
  products,
  allFeatures,
  isYearly,
  currentSubscription,
  currentPlanAmount,
  onSelectPlan,
  isDark,
  loadingPriceId,
}: ComparisonTableProps) {
  const anyLoading = !!loadingPriceId
  const t = isDark
    ? {
      heading: 'text-white',
      subtle: 'text-neutral-400',
      muted: 'text-neutral-500',
      body: 'text-neutral-200',
      rowDivide: 'divide-neutral-800',
      headerBorder: 'border-neutral-800',
      ctaDisabled: 'bg-neutral-800 text-neutral-500 cursor-not-allowed',
      check: 'text-white',
      dash: 'text-neutral-600',
    }
    : {
      heading: 'text-slate-900',
      subtle: 'text-slate-500',
      muted: 'text-slate-500',
      body: 'text-slate-900',
      rowDivide: 'divide-slate-200',
      headerBorder: 'border-slate-200',
      ctaDisabled: 'bg-slate-200 text-slate-500 cursor-not-allowed',
      check: 'text-slate-900',
      dash: 'text-slate-400',
    }

  return (
    <div className="overflow-x-auto pb-6">
      <div className="min-w-[720px]">
        <table
          className="w-full text-left border-collapse"
          style={{ fontFamily: 'var(--bos-font, inherit)' }}
        >
          <thead>
            <tr className={cn('border-b', t.headerBorder)}>
              <th className="w-1/5 p-4" />
              {products.map((product) => {
                const price = getActivePrice(product, isYearly)
                const isExact = isExactCurrentPrice(product, currentSubscription, price)
                const label = getButtonLabel(
                  product,
                  currentSubscription,
                  currentPlanAmount,
                  price,
                  isYearly,
                )
                const handleClick = () => {
                  if (!isExact && price) onSelectPlan(price.id)
                }
                const symbol = getCurrencySymbol(price?.currency || 'usd')
                const displayCents = price
                  ? price.interval === 'year'
                    ? price.amount / 12
                    : price.amount
                  : 0
                const amountText = price ? getCentsInDollarString(displayCents, false, true) : null

                return (
                  <th
                    key={product.id}
                    className="w-1/5 p-4 align-top"
                  >
                    <div className={cn('text-sm font-semibold', t.heading)}>{product.name}</div>
                    <div className={cn('mt-2.5 flex items-baseline h-7', t.body)}>
                      {price ? (
                        <>
                          <span className="text-[11px] font-semibold tracking-tight self-start mt-0.5">
                            {symbol}
                          </span>
                          <span className="text-2xl font-bold tracking-tight leading-none">
                            {amountText}
                          </span>
                          <span className={cn('text-[11px] font-medium ml-1', t.muted)}>/mo</span>
                        </>
                      ) : (
                        <span className="text-lg font-bold tracking-tight">Custom</span>
                      )}
                    </div>
                    <div className={cn('mt-1 text-[11px] font-medium h-3.5', t.muted)}>
                      {price ? `Billed ${isYearly ? 'yearly' : 'monthly'}` : ''}
                    </div>
                    {(() => {
                      const isThisLoading = !!price && loadingPriceId === price.id
                      const disabled = isExact || (anyLoading && !isThisLoading)
                      return (
                        <button
                          onClick={handleClick}
                          disabled={disabled}
                          className={cn(
                            'mt-4 w-full py-2 px-3 rounded-md text-xs font-medium transition-colors inline-flex items-center justify-center',
                            isExact
                              ? t.ctaDisabled
                              : 'hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed',
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
                          {isThisLoading ? <InlineLoader spinnerSize={12} /> : label}
                        </button>
                      )
                    })()}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className={cn('divide-y', t.rowDivide)}>
            {allFeatures.map((featureMeta) => {
              return (
                <tr key={featureMeta.name}>
                  <td className={cn('py-2.5 px-4 text-xs', t.subtle)}>
                    {featureMeta.title}
                  </td>
                  {products.map((product) => {
                    const productFeature = product.features.find(
                      (f) => f.name === featureMeta.name,
                    )
                    const hasFeature = !!productFeature
                    const limit = productFeature?.properties?.limit
                    const unit = productFeature?.properties?.unit

                    let content: React.ReactNode
                    if (!hasFeature) {
                      content = <span className={t.dash}>—</span>
                    } else if (featureMeta.type === 'boolean_flag') {
                      content = (
                        <Check
                          className={cn('w-3.5 h-3.5 mx-auto', t.check)}
                          strokeWidth={2.5}
                        />
                      )
                    } else if (limit === -1) {
                      content = <span>Unlimited</span>
                    } else if (typeof limit === 'number') {
                      content = <span>{formatLimit(limit, unit) ?? '—'}</span>
                    } else {
                      content = (
                        <Check
                          className={cn('w-3.5 h-3.5 mx-auto', t.check)}
                          strokeWidth={2.5}
                        />
                      )
                    }

                    return (
                      <td
                        key={product.id}
                        className={cn('py-2.5 px-4 text-xs text-center', t.body)}
                      >
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
