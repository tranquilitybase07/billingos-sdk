import { useState, useCallback } from 'react'
import { useBillingOS } from '../providers/BillingOSProvider'
import { getCheckoutAPI, type CheckoutOpenOptions } from '../checkout'
import type { Subscription } from '../client/types'

/**
 * Result from opening checkout
 */
export interface CheckoutResult {
  success: boolean
  subscription?: Subscription
  error?: Error
}

/**
 * Hook for programmatically opening checkout
 */
export function useCheckout() {
  const { client } = useBillingOS()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const openCheckout = useCallback(async (options: Omit<CheckoutOpenOptions, 'sessionToken' | 'apiUrl'>): Promise<CheckoutResult> => {
    setIsLoading(true)
    setError(null)

    try {
      const api = getCheckoutAPI(client)
      const result = await api.open(options)

      if (!result.success && result.error) {
        setError(result.error)
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to open checkout')
      setError(error)
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }, [client])

  const closeCheckout = useCallback(() => {
    const api = getCheckoutAPI(client)
    api.close()
  }, [client])

  return {
    openCheckout,
    closeCheckout,
    isLoading,
    error
  }
}