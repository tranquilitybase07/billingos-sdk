import React, { createContext, useContext, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BillingOSClient, BillingOSClientOptions } from '../client'

/**
 * Context value provided by BillingOSProvider
 */
export interface BillingOSContextValue {
  /**
   * The BillingOS API client instance
   */
  client: BillingOSClient

  /**
   * Optional customer ID for the current user
   */
  customerId?: string

  /**
   * Optional organization ID
   */
  organizationId?: string
}

/**
 * React Context for BillingOS SDK
 */
const BillingOSContext = createContext<BillingOSContextValue | undefined>(undefined)

/**
 * Props for BillingOSProvider
 */
export interface BillingOSProviderProps {
  /**
   * Your BillingOS API key
   */
  apiKey: string

  /**
   * Optional customer ID for the current user
   */
  customerId?: string

  /**
   * Optional organization ID
   */
  organizationId?: string

  /**
   * Client configuration options
   */
  options?: BillingOSClientOptions

  /**
   * Optional custom QueryClient instance
   * If not provided, a default one will be created
   */
  queryClient?: QueryClient

  /**
   * Child components
   */
  children: React.ReactNode
}

/**
 * Default QueryClient configuration
 */
const createDefaultQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

/**
 * Provider component for BillingOS SDK
 *
 * Wraps your app and provides the BillingOS client to all hooks and components.
 *
 * @example
 * ```tsx
 * import { BillingOSProvider } from '@billingos/sdk'
 *
 * function App() {
 *   return (
 *     <BillingOSProvider apiKey="your_api_key" customerId="customer_123">
 *       <YourApp />
 *     </BillingOSProvider>
 *   )
 * }
 * ```
 */
export function BillingOSProvider({
  apiKey,
  customerId,
  organizationId,
  options,
  queryClient,
  children,
}: BillingOSProviderProps) {
  // Create BillingOS client instance (memoized)
  const client = useMemo(
    () => new BillingOSClient(apiKey, options),
    [apiKey, options]
  )

  // Use provided QueryClient or create default
  const qc = useMemo(
    () => queryClient || createDefaultQueryClient(),
    [queryClient]
  )

  // Context value
  const contextValue = useMemo<BillingOSContextValue>(
    () => ({
      client,
      customerId,
      organizationId,
    }),
    [client, customerId, organizationId]
  )

  return (
    <BillingOSContext.Provider value={contextValue}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </BillingOSContext.Provider>
  )
}

/**
 * Hook to access the BillingOS context
 *
 * Must be used within a BillingOSProvider.
 *
 * @throws Error if used outside of BillingOSProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { client, customerId } = useBillingOS()
 *
 *   // Use client to make API calls
 *   const subscription = await client.getSubscription(id)
 *
 *   return <div>Customer: {customerId}</div>
 * }
 * ```
 */
export function useBillingOS(): BillingOSContextValue {
  const context = useContext(BillingOSContext)

  if (!context) {
    throw new Error(
      'useBillingOS must be used within a BillingOSProvider. ' +
        'Wrap your app with <BillingOSProvider> to use BillingOS hooks and components.'
    )
  }

  return context
}
