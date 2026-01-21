import { Alert, AlertTitle, AlertDescription } from '../../ui/alert'
import { Button } from '../../ui/button'
import { cn } from '@/utils/cn'

interface WarningBannerProps {
  type: 'trial_ending' | 'payment_failed' | 'subscription_canceled' | 'past_due'
  message: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function getTitle(type: WarningBannerProps['type']): string {
  switch (type) {
    case 'trial_ending':
      return 'Trial Ending Soon'
    case 'payment_failed':
      return 'Payment Failed'
    case 'subscription_canceled':
      return 'Subscription Canceled'
    case 'past_due':
      return 'Payment Past Due'
    default:
      return 'Warning'
  }
}

function getVariant(type: WarningBannerProps['type']): 'warning' | 'destructive' {
  switch (type) {
    case 'payment_failed':
    case 'past_due':
      return 'destructive'
    default:
      return 'warning'
  }
}

export function WarningBanner({
  type,
  message,
  actionLabel,
  onAction,
  className,
}: WarningBannerProps) {
  const title = getTitle(type)
  const variant = getVariant(type)

  return (
    <Alert variant={variant} className={cn('', className)}>
      <AlertTriangleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {actionLabel && onAction && (
          <Button
            size="sm"
            variant={variant === 'destructive' ? 'outline' : 'default'}
            onClick={onAction}
            className="ml-4"
          >
            {actionLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
