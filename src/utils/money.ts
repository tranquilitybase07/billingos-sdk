/**
 * Currency utilities for formatting and converting money values
 */

/**
 * Convert cents to dollar string
 * @param cents - Amount in cents
 * @param showCents - Force showing cents even if amount is whole dollars
 * @param pretty - Use locale formatting with thousand separators
 * @returns Formatted dollar string
 *
 * @example
 * getCentsInDollarString(1000) // "10"
 * getCentsInDollarString(1050, true) // "10.50"
 * getCentsInDollarString(1000000, false, true) // "10,000"
 */
export const getCentsInDollarString = (
  cents: number,
  showCents = false,
  pretty = false,
): string => {
  const dollars = cents / 100

  const precision = cents % 100 === 0 && !showCents ? 0 : 2

  if (pretty) {
    return dollars.toLocaleString('en-US', {
      maximumFractionDigits: precision,
      minimumFractionDigits: precision,
    })
  }

  return dollars.toFixed(precision)
}

/**
 * Format cents as currency with symbol
 * @param cents - Amount in cents
 * @param currency - Currency code (e.g., 'USD', 'EUR')
 * @param minimumFractionDigits - Minimum decimal places
 * @param notation - Number notation style
 * @param maximumFractionDigits - Maximum decimal places
 * @returns Formatted currency string with symbol
 *
 * @example
 * formatCurrencyAndAmount(1050, 'USD') // "$10.50"
 * formatCurrencyAndAmount(1000000, 'USD', 0, 'compact') // "$10K"
 * formatCurrencyAndAmount(5000, 'EUR') // "€50.00"
 */
export const formatCurrencyAndAmount = (
  cents: number,
  currency: string,
  minimumFractionDigits?: number,
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact',
  maximumFractionDigits?: number,
): string => {
  const currencyNumberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    notation,
  })
  return currencyNumberFormat.format(cents / 100)
}

/**
 * Convert cents to float (dollars)
 * @param cents - Amount in cents
 * @returns Amount in dollars as a float
 *
 * @example
 * convertCentsToFloat(1050) // 10.5
 */
export const convertCentsToFloat = (cents: number): number => {
  return cents / 100
}

/**
 * Convert float (dollars) to cents
 * @param amount - Amount in dollars
 * @returns Amount in cents as an integer
 *
 * @example
 * convertFloatToCents(10.5) // 1050
 */
export const convertFloatToCents = (amount: number): number => {
  return Math.round(amount * 100)
}

/**
 * Format currency in compact notation (e.g., $1.2K, $3.5M)
 * @param cents - Amount in cents
 * @param currency - Currency code
 * @returns Compact formatted currency string
 *
 * @example
 * formatCurrencyCompact(1200000, 'USD') // "$12K"
 * formatCurrencyCompact(3500000000, 'USD') // "$35M"
 */
export const formatCurrencyCompact = (cents: number, currency: string): string => {
  return formatCurrencyAndAmount(cents, currency, 0, 'compact', 1)
}

/**
 * Format currency without cents (whole dollars only)
 * @param cents - Amount in cents
 * @param currency - Currency code
 * @returns Formatted currency string without cents
 *
 * @example
 * formatCurrencyWhole(1050, 'USD') // "$10"
 * formatCurrencyWhole(1099, 'USD') // "$11" (rounds)
 */
export const formatCurrencyWhole = (cents: number, currency: string): string => {
  return formatCurrencyAndAmount(cents, currency, 0, 'standard', 0)
}

/**
 * Get currency symbol for a currency code
 * @param currency - Currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol (e.g., '$', '€')
 *
 * @example
 * getCurrencySymbol('USD') // "$"
 * getCurrencySymbol('EUR') // "€"
 * getCurrencySymbol('GBP') // "£"
 */
export const getCurrencySymbol = (currency: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  // Format zero to extract symbol
  const parts = formatter.formatToParts(0)
  const symbolPart = parts.find((part) => part.type === 'currency')
  return symbolPart?.value || currency
}

/**
 * Format a price range (e.g., "$10 - $50")
 * @param minCents - Minimum amount in cents
 * @param maxCents - Maximum amount in cents
 * @param currency - Currency code
 * @returns Formatted price range string
 *
 * @example
 * formatPriceRange(1000, 5000, 'USD') // "$10 - $50"
 */
export const formatPriceRange = (
  minCents: number,
  maxCents: number,
  currency: string,
): string => {
  const min = formatCurrencyAndAmount(minCents, currency)
  const max = formatCurrencyAndAmount(maxCents, currency)
  return `${min} - ${max}`
}

/**
 * Check if an amount is zero
 * @param cents - Amount in cents
 * @returns True if amount is zero
 */
export const isZeroAmount = (cents: number): boolean => {
  return cents === 0
}

/**
 * Check if an amount is negative
 * @param cents - Amount in cents
 * @returns True if amount is negative
 */
export const isNegativeAmount = (cents: number): boolean => {
  return cents < 0
}

/**
 * Calculate percentage of an amount
 * @param cents - Amount in cents
 * @param percentage - Percentage (0-100)
 * @returns Calculated amount in cents
 *
 * @example
 * calculatePercentage(10000, 20) // 2000 (20% of $100)
 */
export const calculatePercentage = (cents: number, percentage: number): number => {
  return Math.round((cents * percentage) / 100)
}

/**
 * Add amounts together
 * @param amounts - Array of amounts in cents
 * @returns Sum in cents
 *
 * @example
 * addAmounts([1000, 2000, 3000]) // 6000
 */
export const addAmounts = (...amounts: number[]): number => {
  return amounts.reduce((sum, amount) => sum + amount, 0)
}

/**
 * Money utilities namespace for convenience
 */
export const Money = {
  format: formatCurrencyAndAmount,
  formatCompact: formatCurrencyCompact,
  formatWhole: formatCurrencyWhole,
  formatRange: formatPriceRange,
  fromCents: convertCentsToFloat,
  toCents: convertFloatToCents,
  getSymbol: getCurrencySymbol,
  isZero: isZeroAmount,
  isNegative: isNegativeAmount,
  calculatePercentage,
  add: addAmounts,
}
