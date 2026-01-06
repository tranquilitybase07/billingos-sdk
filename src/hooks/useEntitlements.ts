import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useBillingOS } from '../providers'
import type { Entitlement, UsageEvent, UsageMetrics } from '../client'

/**
 * Query keys for entitlement-related queries
 */
export const entitlementKeys = {
  all: ['entitlements'] as const,
  lists: () => [...entitlementKeys.all, 'list'] as const,
  list: (customerId: string) => [...entitlementKeys.lists(), customerId] as const,
  checks: () => [...entitlementKeys.all, 'check'] as const,
  check: (customerId: string, featureKey: string) =>
    [...entitlementKeys.checks(), customerId, featureKey] as const,
  usage: (customerId: string, featureKey: string) =>
    [...entitlementKeys.all, 'usage', customerId, featureKey] as const,
}

/**
 * Check if a customer has access to a specific feature
 *
 * @param customerId - Customer ID to check
 * @param featureKey - Feature key to check access for
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * function FeatureGate({ children }: { children: React.ReactNode }) {
 *   const { data: entitlement, isLoading } = useCheckEntitlement(
 *     'cus_123',
 *     'advanced_analytics'
 *   )
 *
 *   if (isLoading) return <div>Checking access...</div>
 *   if (!entitlement?.has_access) {
 *     return <UpgradePrompt feature="advanced_analytics" />
 *   }
 *
 *   return <>{children}</>
 * }
 * ```
 */
export function useCheckEntitlement(
  customerId: string,
  featureKey: string,
  options?: Omit<UseQueryOptions<Entitlement>, 'queryKey' | 'queryFn'>
) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: entitlementKeys.check(customerId, featureKey),
    queryFn: () => client.checkEntitlement({ customer_id: customerId, feature_key: featureKey }),
    enabled: !!customerId && !!featureKey,
    staleTime: 1000 * 60, // 1 minute (entitlements are cached server-side)
    ...options,
  })
}

/**
 * Simplified hook to check if a customer has access to a feature
 * Returns a boolean directly instead of the full Entitlement object
 *
 * @param customerId - Customer ID to check
 * @param featureKey - Feature key to check access for
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * function PremiumFeature() {
 *   const hasAccess = useHasFeature('cus_123', 'premium_features')
 *
 *   if (!hasAccess) {
 *     return <div>Upgrade to access this feature</div>
 *   }
 *
 *   return <div>Premium feature content here</div>
 * }
 * ```
 */
export function useHasFeature(
  customerId: string,
  featureKey: string,
  options?: Omit<UseQueryOptions<Entitlement>, 'queryKey' | 'queryFn'>
): boolean {
  const { data } = useCheckEntitlement(customerId, featureKey, options)
  return data?.has_access || false
}

/**
 * Get all entitlements for a customer
 *
 * @param customerId - Customer ID
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * function EntitlementsList({ customerId }: { customerId: string }) {
 *   const { data: entitlements, isLoading } = useEntitlements(customerId)
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <ul>
 *       {entitlements?.map(entitlement => (
 *         <li key={entitlement.feature_key}>
 *           {entitlement.feature_key}: {entitlement.has_access ? '✓' : '✗'}
 *           {entitlement.limit && ` (${entitlement.usage}/${entitlement.limit})`}
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useEntitlements(
  customerId: string,
  options?: Omit<UseQueryOptions<Entitlement[]>, 'queryKey' | 'queryFn'>
) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: entitlementKeys.list(customerId),
    queryFn: () => client.listEntitlements(customerId),
    enabled: !!customerId,
    ...options,
  })
}

/**
 * Track a usage event for a customer
 *
 * @param options - React Query mutation options
 *
 * @example
 * ```tsx
 * function APICallButton() {
 *   const trackUsage = useTrackUsage({
 *     onSuccess: () => {
 *       console.log('Usage tracked')
 *     }
 *   })
 *
 *   const handleAPICall = async () => {
 *     // Make API call
 *     await makeAPICall()
 *
 *     // Track usage
 *     trackUsage.mutate({
 *       customer_id: 'cus_123',
 *       feature_key: 'api_calls',
 *       quantity: 1
 *     })
 *   }
 *
 *   return <button onClick={handleAPICall}>Make API Call</button>
 * }
 * ```
 */
export function useTrackUsage(
  options?: Omit<UseMutationOptions<void, Error, UsageEvent>, 'mutationFn'>
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (event: UsageEvent) => client.trackUsage(event),
    onSuccess: (_data, variables, _context) => {
      // Invalidate usage metrics for this feature
      queryClient.invalidateQueries({
        queryKey: entitlementKeys.usage(variables.customer_id, variables.feature_key),
      })
      // Invalidate entitlement check (usage affects has_access)
      queryClient.invalidateQueries({
        queryKey: entitlementKeys.check(variables.customer_id, variables.feature_key),
      })
    },
  })
}

/**
 * Get usage metrics for a customer and feature
 *
 * @param customerId - Customer ID
 * @param featureKey - Feature key
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * function UsageDisplay({ customerId }: { customerId: string }) {
 *   const { data: metrics, isLoading } = useUsageMetrics(
 *     customerId,
 *     'api_calls'
 *   )
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   const percentage = metrics?.limit
 *     ? (metrics.current_usage / metrics.limit) * 100
 *     : 0
 *
 *   return (
 *     <div>
 *       <h3>API Usage</h3>
 *       <p>{metrics?.current_usage} / {metrics?.limit || '∞'} calls</p>
 *       <progress value={percentage} max={100} />
 *       <p>Period: {metrics?.period_start} - {metrics?.period_end}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useUsageMetrics(
  customerId: string,
  featureKey: string,
  options?: Omit<UseQueryOptions<UsageMetrics>, 'queryKey' | 'queryFn'>
) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: entitlementKeys.usage(customerId, featureKey),
    queryFn: () => client.getUsageMetrics(customerId, featureKey),
    enabled: !!customerId && !!featureKey,
    ...options,
  })
}

/**
 * Check if a customer is approaching their usage limit
 *
 * @param customerId - Customer ID
 * @param featureKey - Feature key
 * @param threshold - Threshold percentage (0-100) to warn at (default: 80)
 * @param options - React Query options
 * @returns Boolean indicating if customer is approaching limit
 *
 * @example
 * ```tsx
 * function UsageWarning({ customerId }: { customerId: string }) {
 *   const isApproachingLimit = useIsApproachingLimit(
 *     customerId,
 *     'api_calls',
 *     80 // Warn at 80%
 *   )
 *
 *   if (!isApproachingLimit) return null
 *
 *   return (
 *     <Alert variant="warning">
 *       You're approaching your API call limit. Upgrade to increase your quota.
 *     </Alert>
 *   )
 * }
 * ```
 */
export function useIsApproachingLimit(
  customerId: string,
  featureKey: string,
  threshold = 80,
  options?: Omit<UseQueryOptions<UsageMetrics>, 'queryKey' | 'queryFn'>
): boolean {
  const { data: metrics } = useUsageMetrics(customerId, featureKey, options)

  if (!metrics || !metrics.limit) return false

  const percentage = (metrics.current_usage / metrics.limit) * 100
  return percentage >= threshold
}
