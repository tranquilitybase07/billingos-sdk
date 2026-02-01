import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useBillingOS } from '../providers/BillingOSProvider'

/**
 * Feature access response
 */
export interface FeatureAccess {
  feature_key: string
  has_access: boolean
  limit?: number
  usage?: number
  metadata?: Record<string, any>
}

/**
 * Feature entitlement
 */
export interface FeatureEntitlement {
  feature_key: string
  feature_title: string
  feature_type: 'boolean_flag' | 'usage_quota' | 'numeric_limit'
  granted_at: string
  product_name: string
  subscription_status: string
  properties?: Record<string, any>
}

/**
 * Usage metric
 */
export interface UsageMetric {
  feature_key: string
  feature_title: string
  product_name: string
  consumed: number
  limit: number
  remaining: number
  percentage_used: number
  period_start: string
  period_end: string
  resets_in_days: number
}

/**
 * Hook to check if user has access to a feature
 */
export function useFeature(featureKey: string, options?: {
  refetchInterval?: number
  enabled?: boolean
}) {
  const { client } = useBillingOS()

  return useQuery<FeatureAccess>({
    queryKey: ['billingos', 'features', featureKey],
    queryFn: async () => {
      return await client.get<FeatureAccess>(
        `/v1/features/check?feature_key=${featureKey}`
      )
    },
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled !== false,
  })
}

/**
 * Hook to track usage for a feature
 */
export function useTrackUsage() {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      featureKey,
      quantity,
      metadata
    }: {
      featureKey: string
      quantity: number
      metadata?: Record<string, any>
    }) => {
      return await client.post('/v1/features/track-usage', {
        feature_key: featureKey,
        quantity,
        metadata,
      })
    },
    onSuccess: (_, variables) => {
      // Invalidate the feature check query to refresh usage
      queryClient.invalidateQueries({
        queryKey: ['billingos', 'features', variables.featureKey]
      })
      // Also invalidate usage metrics
      queryClient.invalidateQueries({
        queryKey: ['billingos', 'usage-metrics']
      })
    },
  })
}

/**
 * Hook to get all feature entitlements for the current user
 */
export function useFeatureEntitlements() {
  const { client } = useBillingOS()

  return useQuery<{ entitlements: FeatureEntitlement[] }>({
    queryKey: ['billingos', 'entitlements'],
    queryFn: async () => {
      return await client.get<{ entitlements: FeatureEntitlement[] }>(
        '/v1/features/entitlements'
      )
    },
  })
}

/**
 * Hook to get usage metrics for features
 */
export function useUsageMetrics(featureKey?: string) {
  const { client } = useBillingOS()

  return useQuery<{ metrics: UsageMetric[] }>({
    queryKey: ['billingos', 'usage-metrics', featureKey],
    queryFn: async () => {
      const url = featureKey
        ? `/v1/features/usage-metrics?feature_key=${featureKey}`
        : '/v1/features/usage-metrics'
      return await client.get<{ metrics: UsageMetric[] }>(url)
    },
    // Refresh every 30 seconds to keep usage data fresh
    refetchInterval: 30000,
  })
}

/**
 * Hook that combines feature access check and tracks when access is denied
 */
export function useFeatureGate(featureKey: string, options?: {
  onAccessDenied?: () => void
  onQuotaExceeded?: (usage: number, limit: number) => void
}) {
  const feature = useFeature(featureKey)

  // Call callbacks when access is denied
  if (feature.data && !feature.data.has_access) {
    if (feature.data.usage && feature.data.limit && feature.data.usage >= feature.data.limit) {
      options?.onQuotaExceeded?.(feature.data.usage, feature.data.limit)
    } else {
      options?.onAccessDenied?.()
    }
  }

  return {
    ...feature,
    hasAccess: feature.data?.has_access || false,
    isQuotaExceeded: feature.data?.usage && feature.data.limit
      ? feature.data.usage >= feature.data.limit
      : false,
    usage: feature.data?.usage || 0,
    limit: feature.data?.limit || 0,
    remaining: feature.data?.limit && feature.data?.usage
      ? Math.max(0, feature.data.limit - feature.data.usage)
      : 0,
  }
}