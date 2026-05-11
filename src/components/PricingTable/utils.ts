import type { PricingProduct, PricingCurrentSubscription, PricingPrice } from '../../client/types'

function pluralizeUnit(count: number, unit: string): string {
  if (count === 1) return unit
  if (unit.length <= 4 && unit === unit.toUpperCase()) return unit
  if (unit.toLowerCase().endsWith('s')) return unit
  return `${unit}s`
}

/** Format a numeric limit for display: "10", "5k requests", "1 year", etc. */
export function formatLimit(limit: number, unit?: string): string | null {
  if (!limit) return null
  const n =
    limit >= 1000
      ? `${(limit / 1000).toFixed(limit % 1000 === 0 ? 0 : 1)}k`
      : limit.toLocaleString()
  if (!unit) return n
  const displayUnit = limit >= 1000 ? pluralizeUnit(2, unit) : pluralizeUnit(limit, unit)
  return `${n} ${displayUnit}`
}

/** Calculate yearly savings percentage vs monthly×12 */
export function getYearlySavings(monthlyAmount: number, yearlyAmount: number): number {
  const yearlyFromMonthly = monthlyAmount * 12
  return Math.round(((yearlyFromMonthly - yearlyAmount) / yearlyFromMonthly) * 100)
}

/** Highest yearly-savings percentage across all products (0 if no yearly pricing) */
export function getMaxYearlySavings(products: PricingProduct[]): number {
  let max = 0
  for (const product of products) {
    const monthly = product.prices.find((p) => p.interval === 'month')
    const yearly = product.prices.find((p) => p.interval === 'year')
    if (monthly && yearly && monthly.amount > 0) {
      const savings = getYearlySavings(monthly.amount, yearly.amount)
      if (savings > max) max = savings
    }
  }
  return max
}

/** Get the active price for a product based on the current interval toggle */
export function getActivePrice(product: PricingProduct, isYearly: boolean): PricingPrice | undefined {
  const monthly = product.prices.find((p) => p.interval === 'month')
  const yearly = product.prices.find((p) => p.interval === 'year')
  return isYearly && yearly ? yearly : monthly
}

/** Check if this product's currently displayed price is the exact current subscription price */
export function isExactCurrentPrice(
  product: PricingProduct,
  currentSubscription: PricingCurrentSubscription | null,
  currentPrice: PricingPrice | undefined,
): boolean {
  return product.isCurrentPlan && currentSubscription?.priceId === currentPrice?.id
}

/** Get the CTA button label based on plan state */
export function getButtonLabel(
  product: PricingProduct,
  currentSubscription: PricingCurrentSubscription | null,
  currentPlanAmount: number,
  currentPrice: PricingPrice | undefined,
  isYearly: boolean,
): string {
  const exactMatch = isExactCurrentPrice(product, currentSubscription, currentPrice)
  if (exactMatch) return 'Current Plan'

  const sameProductDifferentInterval = product.isCurrentPlan && !exactMatch
  if (sameProductDifferentInterval) {
    return isYearly ? 'Switch to Yearly' : 'Switch to Monthly'
  }

  const isFree = (product.prices.find((p) => p.interval === 'month')?.amount ?? 0) === 0
  if (!currentSubscription) return isFree ? 'Get Started Free' : 'Get Started'

  const thisAmount = currentPrice?.amount ?? 0
  if (thisAmount > currentPlanAmount) return 'Upgrade Now'
  if (thisAmount < currentPlanAmount) return 'Downgrade'
  return 'Switch Plan'
}
