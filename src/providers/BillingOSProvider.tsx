"use client";
import React, { createContext, useContext, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BillingOSClient, BillingOSClientOptions } from '../client'
import { useSessionToken, UseSessionTokenOptions } from '../hooks/useSessionToken'
import { resolveApiUrl, resolveAppUrl } from '../utils/urls'

/**
 * Context value provided by BillingOSProvider
 */
export interface BillingOSContextValue {
  client: BillingOSClient | null
  apiUrl: string
  appUrl: string
  customerId?: string
  customerEmail?: string
  customerName?: string
  organizationId?: string
  debug: boolean
}

const BillingOSContext = createContext<BillingOSContextValue | undefined>(undefined)

export interface BillingOSProviderProps {
  /**
   * Base URL for the BillingOS API (e.g. https://api.billingos.dev or http://localhost:3001).
   * Falls back to NEXT_PUBLIC_BILLINGOS_API_URL env var.
   */
  apiUrl?: string

  /**
   * Base URL for the BillingOS app (used for iframe checkout/portal embeds).
   * Falls back to NEXT_PUBLIC_BILLINGOS_APP_URL env var, then window.location.origin.
   */
  appUrl?: string

  /**
   * URL to fetch session token from (e.g., /api/billingos-session).
   * The SDK will automatically fetch and refresh the token.
   */
  sessionTokenUrl?: string

  /**
   * Provide a session token directly instead of auto-fetching.
   */
  sessionToken?: string

  /**
   * Session token auto-refresh configuration.
   */
  sessionTokenOptions?: Omit<UseSessionTokenOptions, 'token' | 'tokenUrl'>

  /**
   * Rendered while the session token is being fetched.
   * Defaults to rendering children (app is visible immediately, billing components show their own loading state).
   */
  loadingFallback?: React.ReactNode

  /**
   * Optional customer context passed to all hooks and components.
   */
  customerId?: string
  customerEmail?: string
  customerName?: string
  organizationId?: string

  /**
   * Additional client configuration (headers, timeout, etc.).
   */
  options?: BillingOSClientOptions

  /**
   * Inject a custom TanStack QueryClient.
   */
  queryClient?: QueryClient

  /**
   * Enable debug logging. Off by default.
   */
  debug?: boolean

  children: React.ReactNode
}

const createDefaultQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

export function BillingOSProvider({
  apiUrl: apiUrlProp,
  appUrl: appUrlProp,
  sessionToken: manualSessionToken,
  sessionTokenUrl,
  sessionTokenOptions,
  loadingFallback,
  customerId,
  customerEmail,
  customerName,
  organizationId,
  options,
  queryClient,
  debug = false,
  children,
}: BillingOSProviderProps) {
  // Resolve URLs once (throws with actionable message if apiUrl is missing)
  const apiUrl = useMemo(() => resolveApiUrl(apiUrlProp), [apiUrlProp])
  const appUrl = useMemo(() => resolveAppUrl(appUrlProp), [appUrlProp])

  const { token, isLoading, error } = useSessionToken({
    token: manualSessionToken,
    tokenUrl: sessionTokenUrl,
    ...sessionTokenOptions,
  })

  const qc = useMemo(
    () => queryClient || createDefaultQueryClient(),
    [queryClient]
  )

  const client = useMemo(
    () =>
      token
        ? new BillingOSClient(token, { baseUrl: apiUrl, ...options })
        : null,
    [token, apiUrl, options]
  )

  const contextValue = useMemo<BillingOSContextValue>(
    () => ({
      client,
      apiUrl,
      appUrl,
      customerId,
      customerEmail,
      customerName,
      organizationId,
      debug,
    }),
    [client, apiUrl, appUrl, customerId, customerEmail, customerName, organizationId, debug]
  )

  if (sessionTokenUrl && isLoading) {
    if (debug) console.log('[BillingOS] Fetching session token...')
    return (
      <BillingOSContext.Provider value={contextValue}>
        <QueryClientProvider client={qc}>
          {loadingFallback !== undefined ? loadingFallback : children}
        </QueryClientProvider>
      </BillingOSContext.Provider>
    )
  }

  if (sessionTokenUrl && error) {
    console.error('[BillingOS] Failed to fetch session token:', error)
    return (
      <BillingOSContext.Provider value={contextValue}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </BillingOSContext.Provider>
    )
  }

  if (!token) {
    if (debug) {
      console.warn('[BillingOS] No session token available. Pass sessionToken or sessionTokenUrl.')
    }
    return (
      <BillingOSContext.Provider value={contextValue}>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </BillingOSContext.Provider>
    )
  }

  return (
    <BillingOSContext.Provider value={contextValue}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </BillingOSContext.Provider>
  )
}

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

export { useQueryClient as useBillingOSQueryClient } from '@tanstack/react-query'
