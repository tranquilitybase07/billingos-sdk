import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useBillingOS } from '../providers'
import type {
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  SubscriptionPreview,
  PaginatedResponse,
} from '../client'

/**
 * Query keys for subscription-related queries
 */
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...subscriptionKeys.lists(), filters] as const,
  details: () => [...subscriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...subscriptionKeys.details(), id] as const,
  preview: (id: string, input: UpdateSubscriptionInput) => [...subscriptionKeys.all, 'preview', id, input] as const,
}

/**
 * Fetch a single subscription by ID
 *
 * @param id - Subscription ID
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * function SubscriptionDetails({ id }: { id: string }) {
 *   const { data: subscription, isLoading, error } = useSubscription(id)
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <div>
 *       <h1>Subscription Status: {subscription.status}</h1>
 *       <p>Next billing: {subscription.current_period_end}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSubscription(
  id: string,
  options?: Omit<UseQueryOptions<Subscription>, 'queryKey' | 'queryFn'>
) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: () => client.getSubscription(id),
    enabled: !!id,
    ...options,
  })
}

/**
 * Fetch a list of subscriptions (paginated)
 *
 * @param params - Query parameters (customer_id, pagination)
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * function SubscriptionsList() {
 *   const { data, isLoading } = useSubscriptions({
 *     customer_id: 'cus_123',
 *     page: 1,
 *     page_size: 10
 *   })
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       {data?.data.map(subscription => (
 *         <SubscriptionCard key={subscription.id} subscription={subscription} />
 *       ))}
 *       <p>Total: {data?.meta.total}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSubscriptions(
  params?: {
    customer_id?: string
    page?: number
    page_size?: number
  },
  options?: Omit<UseQueryOptions<PaginatedResponse<Subscription>>, 'queryKey' | 'queryFn'>
) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: subscriptionKeys.list(params),
    queryFn: () => client.listSubscriptions(params),
    ...options,
  })
}

/**
 * Create a new subscription
 *
 * @param options - React Query mutation options
 *
 * @example
 * ```tsx
 * function CreateSubscriptionButton() {
 *   const createSubscription = useCreateSubscription({
 *     onSuccess: (subscription) => {
 *       console.log('Subscription created:', subscription.id)
 *       // Redirect to success page
 *     },
 *     onError: (error) => {
 *       console.error('Failed to create subscription:', error)
 *     }
 *   })
 *
 *   const handleClick = () => {
 *     createSubscription.mutate({
 *       customer_id: 'cus_123',
 *       price_id: 'price_456',
 *       trial_days: 14
 *     })
 *   }
 *
 *   return (
 *     <button
 *       onClick={handleClick}
 *       disabled={createSubscription.isPending}
 *     >
 *       {createSubscription.isPending ? 'Creating...' : 'Subscribe'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useCreateSubscription(
  options?: Omit<UseMutationOptions<Subscription, Error, CreateSubscriptionInput>, 'mutationFn'>
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (input: CreateSubscriptionInput) => client.createSubscription(input),
    onSuccess: (_data, _variables, _context) => {
      // Invalidate subscription lists
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}

/**
 * Update an existing subscription
 *
 * @param subscriptionId - Subscription ID to update
 * @param options - React Query mutation options
 *
 * @example
 * ```tsx
 * function UpgradeButton({ subscriptionId }: { subscriptionId: string }) {
 *   const updateSubscription = useUpdateSubscription(subscriptionId, {
 *     onSuccess: () => {
 *       console.log('Subscription updated!')
 *     }
 *   })
 *
 *   const handleUpgrade = () => {
 *     updateSubscription.mutate({
 *       price_id: 'price_pro_plan'
 *     })
 *   }
 *
 *   return (
 *     <button onClick={handleUpgrade} disabled={updateSubscription.isPending}>
 *       Upgrade to Pro
 *     </button>
 *   )
 * }
 * ```
 */
export function useUpdateSubscription(
  subscriptionId: string,
  options?: Omit<UseMutationOptions<Subscription, Error, UpdateSubscriptionInput>, 'mutationFn'>
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (input: UpdateSubscriptionInput) =>
      client.updateSubscription(subscriptionId, input),
    onSuccess: (_data, _variables, _context) => {
      // Invalidate this subscription's cache
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(subscriptionId) })
      // Invalidate subscription lists
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}

/**
 * Cancel a subscription
 *
 * @param subscriptionId - Subscription ID to cancel
 * @param options - React Query mutation options
 *
 * @example
 * ```tsx
 * function CancelButton({ subscriptionId }: { subscriptionId: string }) {
 *   const cancelSubscription = useCancelSubscription(subscriptionId, {
 *     onSuccess: () => {
 *       alert('Subscription cancelled')
 *     }
 *   })
 *
 *   const handleCancel = (immediately: boolean) => {
 *     if (confirm('Are you sure you want to cancel?')) {
 *       cancelSubscription.mutate({ immediately })
 *     }
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={() => handleCancel(false)}>
 *         Cancel at period end
 *       </button>
 *       <button onClick={() => handleCancel(true)}>
 *         Cancel immediately
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCancelSubscription(
  subscriptionId: string,
  options?: Omit<UseMutationOptions<Subscription, Error, { immediately?: boolean }>, 'mutationFn'>
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: ({ immediately = false }: { immediately?: boolean }) =>
      client.cancelSubscription(subscriptionId, immediately),
    onSuccess: (_data, _variables, _context) => {
      // Invalidate this subscription's cache
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(subscriptionId) })
      // Invalidate subscription lists
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}

/**
 * Reactivate a canceled subscription
 *
 * @param subscriptionId - Subscription ID to reactivate
 * @param options - React Query mutation options
 *
 * @example
 * ```tsx
 * function ReactivateButton({ subscriptionId }: { subscriptionId: string }) {
 *   const reactivateSubscription = useReactivateSubscription(subscriptionId)
 *
 *   return (
 *     <button
 *       onClick={() => reactivateSubscription.mutate()}
 *       disabled={reactivateSubscription.isPending}
 *     >
 *       Reactivate Subscription
 *     </button>
 *   )
 * }
 * ```
 */
export function useReactivateSubscription(
  subscriptionId: string,
  options?: Omit<UseMutationOptions<Subscription, Error, void>, 'mutationFn'>
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: () => client.reactivateSubscription(subscriptionId),
    onSuccess: (_data, _variables, _context) => {
      // Invalidate this subscription's cache
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(subscriptionId) })
      // Invalidate subscription lists
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}

/**
 * Preview subscription changes before applying them
 *
 * @param subscriptionId - Subscription ID
 * @param input - Proposed changes
 * @param options - React Query options
 *
 * @example
 * ```tsx
 * function UpgradePreview({ subscriptionId }: { subscriptionId: string }) {
 *   const { data: preview, isLoading } = useSubscriptionPreview(
 *     subscriptionId,
 *     { price_id: 'price_pro_plan' }
 *   )
 *
 *   if (isLoading) return <div>Calculating...</div>
 *
 *   return (
 *     <div>
 *       <p>Proration: ${preview?.proration_amount / 100}</p>
 *       <p>Next invoice: ${preview?.next_invoice_amount / 100}</p>
 *       <p>Billing date: {preview?.next_invoice_date}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSubscriptionPreview(
  subscriptionId: string,
  input: UpdateSubscriptionInput,
  options?: Omit<UseQueryOptions<SubscriptionPreview>, 'queryKey' | 'queryFn'>
) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: subscriptionKeys.preview(subscriptionId, input),
    queryFn: () => client.previewSubscription(subscriptionId, input),
    enabled: !!subscriptionId && !!input,
    ...options,
  })
}
