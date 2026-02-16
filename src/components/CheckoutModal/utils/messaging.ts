/**
 * Message types for parent-to-iframe communication
 */
export interface ParentMessage {
  type: 'INIT_CHECKOUT' | 'UPDATE_CONFIG' | 'CLOSE_CHECKOUT'
  sessionId?: string
  config?: {
    theme?: 'light' | 'dark' | 'auto'
    locale?: string
    collectBillingAddress?: boolean
  }
  payload?: any
}

/**
 * Message types for iframe-to-parent communication
 */
export interface IframeMessage {
  type:
    | 'CHECKOUT_READY'
    | 'CHECKOUT_SUCCESS'
    | 'CHECKOUT_ERROR'
    | 'CHECKOUT_CLOSE'
    | 'HEIGHT_CHANGED'
    | 'PROCESSING'
    | '3DS_REQUIRED'
  payload?: {
    subscription?: any
    error?: string
    height?: number
    threeDSecureUrl?: string
  }
}

/**
 * Checkout session status
 */
export type CheckoutSessionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired'

/**
 * Subscription object returned on success
 */
export interface Subscription {
  id: string
  customerId: string
  productId: string
  priceId: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  metadata?: Record<string, string>
}

/**
 * Type guard for parent messages
 */
export function isParentMessage(message: any): message is ParentMessage {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.type === 'string' &&
    ['INIT_CHECKOUT', 'UPDATE_CONFIG', 'CLOSE_CHECKOUT'].includes(message.type)
  )
}

/**
 * Type guard for iframe messages
 */
export function isIframeMessage(message: any): message is IframeMessage {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.type === 'string' &&
    [
      'CHECKOUT_READY',
      'CHECKOUT_SUCCESS',
      'CHECKOUT_ERROR',
      'CHECKOUT_CLOSE',
      'HEIGHT_CHANGED',
      'PROCESSING',
      '3DS_REQUIRED'
    ].includes(message.type)
  )
}