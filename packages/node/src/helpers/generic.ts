/**
 * Generic auth helper for custom authentication
 * Works with any auth provider (Clerk, NextAuth, custom, etc.)
 */

import { BillingOS } from '../client/billingos.js';
import type { CreateSessionTokenInput } from '../types/index.js';

export interface GenericAuthConfig {
  /** Secret API key */
  secretKey: string;

  /** Optional API URL */
  apiUrl?: string;

  /** Token expiration in seconds (default: 3600) */
  expiresIn?: number;

  /** Allowed operations for scoping */
  allowedOperations?: string[];
}

export interface AuthContext {
  /** User ID from your auth system */
  userId: string;

  /** Optional organization ID for B2B */
  organizationId?: string;
}

export type AuthCallback = (req: Request) => Promise<AuthContext>;

/**
 * Create a session token route handler for Next.js App Router
 *
 * @example
 * ```typescript
 * // app/api/billingos-session/route.ts
 * import { createSessionRoute } from '@billingos/node/helpers/generic';
 * import { getUser } from '@/lib/auth';
 *
 * export const GET = createSessionRoute(
 *   {
 *     secretKey: process.env.BILLINGOS_SECRET_KEY!,
 *     expiresIn: 3600,
 *   },
 *   async (req) => {
 *     const user = await getUser(req);
 *     if (!user) throw new Error('Unauthorized');
 *     return {
 *       userId: user.id,
 *       organizationId: user.orgId, // Optional for B2B
 *     };
 *   }
 * );
 * ```
 */
export function createSessionRoute(
  config: GenericAuthConfig,
  authCallback: AuthCallback
): (req: Request) => Promise<Response> {
  const billing = new BillingOS({
    secretKey: config.secretKey,
    apiUrl: config.apiUrl,
  });

  return async (req: Request): Promise<Response> => {
    try {
      // Call user's auth function
      const { userId, organizationId } = await authCallback(req);

      // Create session token
      const input: CreateSessionTokenInput = {
        externalUserId: userId,
        externalOrganizationId: organizationId,
        expiresIn: config.expiresIn,
        allowedOperations: config.allowedOperations,
      };

      const { sessionToken, expiresAt } = await billing.createSessionToken(input);

      // Return JSON response
      return new Response(
        JSON.stringify({
          sessionToken,
          expiresAt: expiresAt.toISOString(),
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      // Handle errors
      const message = error?.message || 'Internal server error';
      const status = error?.status || 500;

      return new Response(
        JSON.stringify({
          error: message,
        }),
        {
          status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };
}

/**
 * Create a session token handler for Next.js Pages Router or Express
 *
 * @example
 * ```typescript
 * // pages/api/billingos-session.ts
 * import { createSessionHandler } from '@billingos/node/helpers/generic';
 * import { getUser } from '@/lib/auth';
 *
 * export default createSessionHandler(
 *   {
 *     secretKey: process.env.BILLINGOS_SECRET_KEY!,
 *   },
 *   async (req, res) => {
 *     const user = await getUser(req);
 *     if (!user) throw new Error('Unauthorized');
 *     return {
 *       userId: user.id,
 *     };
 *   }
 * );
 * ```
 */
export function createSessionHandler(
  config: GenericAuthConfig,
  authCallback: (req: any, res: any) => Promise<AuthContext>
): (req: any, res: any) => Promise<void> {
  const billing = new BillingOS({
    secretKey: config.secretKey,
    apiUrl: config.apiUrl,
  });

  return async (req: any, res: any): Promise<void> => {
    try {
      // Call user's auth function
      const { userId, organizationId } = await authCallback(req, res);

      // Create session token
      const input: CreateSessionTokenInput = {
        externalUserId: userId,
        externalOrganizationId: organizationId,
        expiresIn: config.expiresIn,
        allowedOperations: config.allowedOperations,
      };

      const { sessionToken, expiresAt } = await billing.createSessionToken(input);

      // Return JSON response
      res.status(200).json({
        sessionToken,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error: any) {
      // Handle errors
      const message = error?.message || 'Internal server error';
      const status = error?.status || 500;

      res.status(status).json({
        error: message,
      });
    }
  };
}
