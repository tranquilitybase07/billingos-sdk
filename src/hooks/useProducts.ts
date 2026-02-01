import { useQuery } from '@tanstack/react-query'
import { useBillingOS } from '../providers/BillingOSProvider'

export interface Product {
  id: string
  name: string
  description?: string
  features?: string[]
  prices?: Price[]
}

export interface Price {
  id: string
  amount: number
  currency: string
  interval?: string
  interval_count?: number
}

/**
 * Hook to fetch products for pricing table
 */
export function useProducts() {
  const { client } = useBillingOS()

  return useQuery<{ products: Product[] }>({
    queryKey: ['billingos', 'products'],
    queryFn: async () => {
      return await client.get<{ products: Product[] }>('/v1/products')
    },
  })
}