import { useQuery } from '@tanstack/react-query'
import { useBillingOS } from '../../../providers/BillingOSProvider'
import type { UsageCheckResponse } from '../../../client/types'

export interface UseUsageCheckOptions {
  /**
   * Whether to enable the query
   */
  enabled?: boolean
  /**
   * Refetch interval in milliseconds (0 = no auto refetch)
   */
  refetchInterval?: number
}

/**
 * Hook to check usage and get nudge trigger
 */
export function useUsageCheck(options: UseUsageCheckOptions = {}) {
  const { client } = useBillingOS()
  const { enabled = true, refetchInterval = 0 } = options

  return useQuery<UsageCheckResponse, Error>({
    queryKey: ['usageCheck'],
    queryFn: async () => {
      return client.checkUsage()
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: refetchInterval > 0 ? refetchInterval : undefined,
  })
}
