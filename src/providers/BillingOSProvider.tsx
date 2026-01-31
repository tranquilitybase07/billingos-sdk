import React, { createContext, useContext, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BillingOSClient, BillingOSClientOptions } from '../client'
import { useSessionToken, UseSessionTokenOptions } from '../hooks/useSessionToken'

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
   * Optional customer email
   */
  customerEmail?: string

  /**
   * Optional customer name
   */
  customerName?: string

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
   * Session token - can be provided directly OR fetched automatically from tokenUrl
   * Use this when you already have a session token
   */
  sessionToken?: string

  /**
   * URL to fetch session token from (e.g., /api/billingos-session)
   * The SDK will automatically fetch and refresh the token
   */
  sessionTokenUrl?: string

  /**
   * Session token options (auto-refresh settings, error handlers, etc.)
   */
  sessionTokenOptions?: Omit<UseSessionTokenOptions, 'token' | 'tokenUrl'>

  /**
   * Optional customer ID for the current user
   */
  customerId?: string

  /**
   * Optional customer email
   */
  customerEmail?: string

  /**
   * Optional customer name
   */
  customerName?: string

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
 * Auto-fetch session token from endpoint:
 * ```tsx
 * import { BillingOSProvider } from '@billingos/sdk'
 *
 * function App() {
 *   return (
 *     <BillingOSProvider
 *       sessionTokenUrl="/api/billingos-session"
 *       customerId="customer_123"
 *     >
 *       <YourApp />
 *     </BillingOSProvider>
 *   )
 * }
 * ```
 *
 * @example
 * Manually provide session token:
 * ```tsx
 * function App() {
 *   const [sessionToken, setSessionToken] = useState('bos_session_...')
 *
 *   return (
 *     <BillingOSProvider sessionToken={sessionToken}>
 *       <YourApp />
 *     </BillingOSProvider>
 *   )
 * }
 * ```
 */
export function BillingOSProvider({
  sessionToken: manualSessionToken,
  sessionTokenUrl,
  sessionTokenOptions,
  customerId,
  customerEmail,
  customerName,
  organizationId,
  options,
  queryClient,
  children,
}: BillingOSProviderProps) {
  // Log SDK version on mount
  React.useEffect(() => {
    console.log('🚀 BillingOS SDK v0.1.2 initialized - CSS injected directly')
  }, [])

  // Fetch and manage session token
  const { token, isLoading, error } = useSessionToken({
    token: manualSessionToken,
    tokenUrl: sessionTokenUrl,
    ...sessionTokenOptions,
  })

  // Use provided QueryClient or create default
  const qc = useMemo(
    () => queryClient || createDefaultQueryClient(),
    [queryClient]
  )

  // Create BillingOS client instance (conditionally, but hook always called)
  const client = useMemo(
    () => token ? new BillingOSClient(token, options) : null,
    [token, options]
  )

  // Context value (conditionally, but hook always called)
  const contextValue = useMemo<BillingOSContextValue | null>(
    () => client ? {
      client,
      customerId,
      customerEmail,
      customerName,
      organizationId,
    } : null,
    [client, customerId, customerEmail, customerName, organizationId]
  )

  // Show loading state while fetching token
  if (sessionTokenUrl && isLoading) {
    return null // or a loading spinner
  }

  // Show error if token fetch failed
  if (sessionTokenUrl && error) {
    console.error('Failed to fetch BillingOS session token:', error)
    return null // or an error component
  }

  // Don't render if no token available
  if (!token || !client || !contextValue) {
    console.error('BillingOS: No session token provided. Use sessionToken or sessionTokenUrl prop.')
    return null
  }

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
