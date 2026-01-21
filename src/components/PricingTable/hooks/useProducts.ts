import { useQuery } from '@tanstack/react-query'
import { useBillingOS } from '../../../providers/BillingOSProvider'
import type { GetProductsResponse } from '../../../client/types'

export interface UseProductsOptions {
  /**
   * Optional array of plan IDs to filter
   */
  planIds?: string[]
  /**
   * Whether to enable the query
   */
  enabled?: boolean
}

/**
 * Hook to fetch products for pricing table
 */
export function useProducts(options: UseProductsOptions = {}) {
  const { client } = useBillingOS()
  const { planIds, enabled = true } = options

  return useQuery<GetProductsResponse, Error>({
    queryKey: ['products', planIds],
    queryFn: async () => {
      return client.getProducts(planIds)
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
