import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useBillingOS } from '../../../providers/BillingOSProvider'
import type {
  CreateCheckoutInput,
  CreateCheckoutResponse,
  ConfirmCheckoutResponse,
} from '../../../client/types'

/**
 * Hook to create a checkout session
 */
export function useCreateCheckout(
  input: CreateCheckoutInput | null,
  options?: {
    enabled?: boolean
    onSuccess?: (data: CreateCheckoutResponse) => void
    onError?: (error: Error) => void
  }
) {
  const { client } = useBillingOS()

  return useQuery({
    queryKey: ['checkout', input?.priceId, input?.existingSubscriptionId],
    queryFn: async () => {
      if (!input) throw new Error('Checkout input is required')
      return client.createCheckout(input)
    },
    enabled: options?.enabled !== false && !!input,
    staleTime: 0, // Always fetch fresh checkout session
    gcTime: 0, // Don't cache checkout sessions
  })
}

/**
 * Hook to confirm a checkout after payment
 */
export function useConfirmCheckout(options?: {
  onSuccess?: (data: ConfirmCheckoutResponse) => void
  onError?: (error: Error) => void
}) {
  const { client } = useBillingOS()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      clientSecret,
      paymentMethodId,
    }: {
      clientSecret: string
      paymentMethodId: string
    }) => {
      return client.confirmCheckout(clientSecret, paymentMethodId)
    },
    onSuccess: (data) => {
      // Invalidate subscription queries after successful checkout
      queryClient.invalidateQueries({ queryKey: ['portal'] })
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error as Error)
    },
  })
}
