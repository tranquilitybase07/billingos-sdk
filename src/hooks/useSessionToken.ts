/**
 * Hook for managing session tokens with auto-fetch and auto-refresh
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SessionTokenData {
  sessionToken: string;
  expiresAt: string; // ISO date string
}

export interface UseSessionTokenOptions {
  /** URL to fetch session token from (e.g., /api/billingos-session) */
  tokenUrl?: string;

  /** Manually provided session token */
  token?: string;

  /** How many seconds before expiry to refresh (default: 300 = 5 minutes) */
  refreshBeforeExpiry?: number;

  /** Enable auto-refresh (default: true) */
  autoRefresh?: boolean;

  /** Callback when token is refreshed */
  onTokenRefresh?: (token: string) => void;

  /** Callback when token fetch fails */
  onError?: (error: Error) => void;
}

export interface UseSessionTokenReturn {
  /** Current session token */
  token: string | null;

  /** When the token expires */
  expiresAt: Date | null;

  /** Whether the token is currently being fetched */
  isLoading: boolean;

  /** Any error that occurred */
  error: Error | null;

  /** Manually refresh the token */
  refresh: () => Promise<void>;

  /** Whether the token is valid (not expired) */
  isValid: boolean;
}

/**
 * Hook to manage session tokens with automatic fetching and refreshing
 *
 * @example
 * // Auto-fetch from endpoint
 * const { token, isLoading } = useSessionToken({
 *   tokenUrl: '/api/billingos-session',
 * });
 *
 * @example
 * // Manual token
 * const { token } = useSessionToken({
 *   token: 'bos_session_abc123...',
 * });
 */
export function useSessionToken(options: UseSessionTokenOptions = {}): UseSessionTokenReturn {
  const {
    tokenUrl,
    token: manualToken,
    refreshBeforeExpiry = 300, // 5 minutes
    autoRefresh = true,
    onTokenRefresh,
    onError,
  } = options;

  const [token, setToken] = useState<string | null>(manualToken || null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  // Start as loading if we need to fetch from tokenUrl
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(tokenUrl && !manualToken));
  const [error, setError] = useState<Error | null>(null);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  /**
   * Fetch token from endpoint
   */
  const fetchToken = useCallback(async () => {
    if (!tokenUrl) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(tokenUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch session token: ${response.statusText}`);
      }

      const data: SessionTokenData = await response.json();

      if (!isMountedRef.current) return;

      setToken(data.sessionToken);
      setExpiresAt(new Date(data.expiresAt));
      setError(null);

      onTokenRefresh?.(data.sessionToken);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch session token');

      if (!isMountedRef.current) return;

      setError(error);
      onError?.(error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [tokenUrl, onTokenRefresh, onError]);

  /**
   * Setup auto-refresh timer
   */
  useEffect(() => {
    if (!autoRefresh || !expiresAt || !tokenUrl) return;

    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const now = Date.now();
    const expiryTime = expiresAt.getTime();
    const msUntilExpiry = expiryTime - now;

    // Refresh X seconds before expiry
    const refreshAt = msUntilExpiry - (refreshBeforeExpiry * 1000);

    if (refreshAt > 0) {
      refreshTimerRef.current = setTimeout(() => {
        fetchToken();
      }, refreshAt);
    } else if (msUntilExpiry > 0) {
      // Token expires soon, refresh immediately
      fetchToken();
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [expiresAt, autoRefresh, refreshBeforeExpiry, tokenUrl, fetchToken]);

  /**
   * Initial fetch when tokenUrl is provided
   */
  useEffect(() => {
    if (tokenUrl && !manualToken) {
      fetchToken();
    }
  }, [tokenUrl, manualToken, fetchToken]);

  /**
   * Update token when manual token changes
   */
  useEffect(() => {
    if (manualToken) {
      setToken(manualToken);
      // Can't determine expiry from manual token, so disable auto-refresh
      setExpiresAt(null);
    }
  }, [manualToken]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  /**
   * Check if token is valid (not expired)
   */
  const isValid = Boolean(
    token && (!expiresAt || expiresAt.getTime() > Date.now())
  );

  return {
    token,
    expiresAt,
    isLoading,
    error,
    refresh: fetchToken,
    isValid,
  };
}
