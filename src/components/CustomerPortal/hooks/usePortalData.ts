import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useBillingOS } from '../../../providers'
import type {
  CustomerPortalData,
  PortalUpdateSubscriptionInput,
  PortalUpdateSubscriptionResponse,
  PortalCancelSubscriptionInput,
  PortalCancelSubscriptionResponse,
  AddPaymentMethodInput,
  AddPaymentMethodResponse,
  SetupIntentResponse,
  RetryInvoiceResponse,
  UpdateCustomerBillingInput,
  CustomerBillingInfo,
} from '../../../client/types'

/**
 * Query keys for portal-related queries
 */
export const portalKeys = {
  all: ['portal'] as const,
  data: () => [...portalKeys.all, 'data'] as const,
  setupIntent: () => [...portalKeys.all, 'setupIntent'] as const,
}

/**
 * Fetch all portal data for the current customer
 * Returns subscription, invoices, payment methods, customer info, and available plans
 */
export function usePortalData(
  options?: Omit<UseQueryOptions<CustomerPortalData>, 'queryKey' | 'queryFn'>
) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: portalKeys.data(),
    queryFn: () => client.getCustomerPortal(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}

/**
 * Update subscription (upgrade/downgrade)
 */
export function useUpdatePortalSubscription(
  subscriptionId: string,
  options?: Omit<
    UseMutationOptions<PortalUpdateSubscriptionResponse, Error, PortalUpdateSubscriptionInput>,
    'mutationFn'
  >
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (input: PortalUpdateSubscriptionInput) =>
      client.updatePortalSubscription(subscriptionId, input),
    onSuccess: (...args) => {
      // Invalidate portal data to refresh subscription info
      queryClient.invalidateQueries({ queryKey: portalKeys.data() })
      options?.onSuccess?.(...args)
    },
  })
}

/**
 * Cancel subscription with feedback
 */
export function useCancelPortalSubscription(
  subscriptionId: string,
  options?: Omit<
    UseMutationOptions<PortalCancelSubscriptionResponse, Error, PortalCancelSubscriptionInput>,
    'mutationFn'
  >
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (input: PortalCancelSubscriptionInput) =>
      client.cancelPortalSubscription(subscriptionId, input),
    onSuccess: (...args) => {
      // Invalidate portal data to refresh subscription status
      queryClient.invalidateQueries({ queryKey: portalKeys.data() })
      options?.onSuccess?.(...args)
    },
  })
}

/**
 * Reactivate a canceled subscription
 */
export function useReactivatePortalSubscription(
  subscriptionId: string,
  options?: Omit<UseMutationOptions<void, Error, void>, 'mutationFn'>
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: () => client.reactivatePortalSubscription(subscriptionId),
    onSuccess: (...args) => {
      // Invalidate portal data to refresh subscription status
      queryClient.invalidateQueries({ queryKey: portalKeys.data() })
      options?.onSuccess?.(...args)
    },
  })
}

/**
 * Get setup intent for adding a new payment method
 */
export function useSetupIntent(
  options?: Omit<UseQueryOptions<SetupIntentResponse>, 'queryKey' | 'queryFn'>
) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: portalKeys.setupIntent(),
    queryFn: () => client.getSetupIntent(),
    enabled: false, // Only fetch when explicitly requested
    ...options,
  })
}

/**
 * Add a payment method
 */
export function useAddPaymentMethod(
  options?: Omit<
    UseMutationOptions<AddPaymentMethodResponse, Error, AddPaymentMethodInput>,
    'mutationFn'
  >
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (input: AddPaymentMethodInput) => client.addPaymentMethod(input),
    onSuccess: (...args) => {
      // Invalidate portal data to refresh payment methods
      queryClient.invalidateQueries({ queryKey: portalKeys.data() })
      options?.onSuccess?.(...args)
    },
  })
}

/**
 * Remove a payment method
 */
export function useRemovePaymentMethod(
  options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (paymentMethodId: string) => client.removePaymentMethod(paymentMethodId),
    onSuccess: (...args) => {
      // Invalidate portal data to refresh payment methods
      queryClient.invalidateQueries({ queryKey: portalKeys.data() })
      options?.onSuccess?.(...args)
    },
  })
}

/**
 * Set default payment method
 */
export function useSetDefaultPaymentMethod(
  options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (paymentMethodId: string) => client.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: (...args) => {
      // Invalidate portal data to refresh payment methods
      queryClient.invalidateQueries({ queryKey: portalKeys.data() })
      options?.onSuccess?.(...args)
    },
  })
}

/**
 * Retry a failed invoice
 */
export function useRetryInvoice(
  options?: Omit<
    UseMutationOptions<RetryInvoiceResponse, Error, { invoiceId: string; paymentMethodId?: string }>,
    'mutationFn'
  >
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: ({ invoiceId, paymentMethodId }) =>
      client.retryInvoice(invoiceId, paymentMethodId),
    onSuccess: (...args) => {
      // Invalidate portal data to refresh invoice status
      queryClient.invalidateQueries({ queryKey: portalKeys.data() })
      options?.onSuccess?.(...args)
    },
  })
}

/**
 * Update customer billing information
 */
export function useUpdateCustomerBilling(
  options?: Omit<
    UseMutationOptions<CustomerBillingInfo, Error, UpdateCustomerBillingInput>,
    'mutationFn'
  >
) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (input: UpdateCustomerBillingInput) => client.updateCustomerBilling(input),
    onSuccess: (...args) => {
      // Invalidate portal data to refresh customer info
      queryClient.invalidateQueries({ queryKey: portalKeys.data() })
      options?.onSuccess?.(...args)
    },
  })
}
