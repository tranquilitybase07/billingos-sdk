/**
 * HTTP Client for BillingOS API
 * Handles requests with retries, timeouts, and error handling
 */

import type { HTTPClientConfig, RequestOptions } from '../types/index.js';
import { NetworkError, parseAPIError } from '../utils/errors.js';

export class APIClient {
  private config: HTTPClientConfig;

  constructor(config: HTTPClientConfig) {
    this.config = config;
  }

  /**
   * Make an HTTP request with retry logic
   */
  async request<T = any>(options: RequestOptions): Promise<T> {
    const { method, path, body, headers = {}, timeout } = options;

    const url = `${this.config.baseURL}${path}`;
    const requestTimeout = timeout || this.config.timeout;

    let lastError: Error | null = null;
    const maxRetries = this.config.maxRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

        const response = await fetch(url, {
          method,
          headers: {
            ...this.config.headers,
            ...headers,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle non-2xx responses
        if (!response.ok) {
          let errorBody: any;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = { message: response.statusText };
          }

          throw parseAPIError(response.status, errorBody);
        }

        // Parse successful response
        const data = await response.json();
        return data;
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Don't retry on abort (timeout)
        if (error.name === 'AbortError') {
          throw new NetworkError(`Request timeout after ${requestTimeout}ms`, {
            url,
            method,
            timeout: requestTimeout,
          });
        }

        // Retry on network errors and 5xx errors
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s...
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 8000);
          await this.sleep(backoffDelay);
          continue;
        }

        // Max retries reached
        if (error instanceof Error) {
          throw error;
        }

        throw new NetworkError('Request failed', {
          url,
          method,
          error: String(error),
        });
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError || new NetworkError('Request failed after retries');
  }

  /**
   * GET request
   */
  async get<T = any>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({
      method: 'GET',
      path,
      headers,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>({
      method: 'POST',
      path,
      body,
      headers,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      path,
      body,
      headers,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    path: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      path,
      body,
      headers,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      path,
      headers,
    });
  }

  /**
   * Sleep helper for backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
