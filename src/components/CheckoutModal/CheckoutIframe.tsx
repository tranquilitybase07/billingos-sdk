import React, { forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface CheckoutIframeProps {
  /**
   * The iframe source URL
   */
  src: string

  /**
   * Height of the iframe
   */
  height?: number | string

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Load event handler
   */
  onLoad?: () => void

  /**
   * Error event handler
   */
  onError?: (error: React.SyntheticEvent<HTMLIFrameElement>) => void
}

export const CheckoutIframe = forwardRef<HTMLIFrameElement, CheckoutIframeProps>(
  ({ src, height = 600, className, onLoad, onError }, ref) => {
    return (
      <iframe
        ref={ref}
        src={src}
        className={cn("w-full border-none", className)}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: '400px',
          maxHeight: '80vh'
        }}
        onLoad={onLoad}
        onError={onError}
        // Security attributes
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="payment"
        // Accessibility
        title="Secure Checkout"
        // Performance
        loading="lazy"
      />
    )
  }
)

CheckoutIframe.displayName = 'CheckoutIframe'