import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface PortalIframeProps {
  src: string
  height?: number
  className?: string
  onLoad?: () => void
}

export const PortalIframe = forwardRef<HTMLIFrameElement, PortalIframeProps>(
  ({ src, height = 600, className, onLoad }, ref) => {
    return (
      <iframe
        ref={ref}
        src={src}
        className={cn('w-full border-0', className)}
        style={{ height: `${height}px` }}
        allow="payment"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={onLoad}
        title="Customer Portal"
      />
    )
  }
)

PortalIframe.displayName = 'PortalIframe'
