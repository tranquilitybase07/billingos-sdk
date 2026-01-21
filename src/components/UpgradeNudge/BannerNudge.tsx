import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'
import type { NudgeTrigger } from '../../client/types'

export interface BannerNudgeProps {
  trigger: NudgeTrigger
  onUpgrade: () => void
  onDismiss: () => void
  theme?: 'light' | 'dark'
}

export function BannerNudge({
  trigger,
  onUpgrade,
  onDismiss,
}: BannerNudgeProps) {
  const isUrgent = trigger.actual && trigger.actual >= 95

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300',
        'px-4 py-2'
      )}
      role={isUrgent ? 'alert' : 'status'}
    >
      <Alert
        variant={isUrgent ? 'destructive' : 'default'}
        className="max-w-4xl mx-auto flex items-center justify-between"
      >
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {isUrgent ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-destructive"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" x2="12" y1="9" y2="13" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AlertTitle className="mb-1 font-semibold">
              {trigger.message.title}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {trigger.message.body}
            </AlertDescription>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <Button
            size="sm"
            onClick={onUpgrade}
          >
            {trigger.message.cta}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
          >
            Maybe Later
          </Button>
        </div>
      </Alert>
    </div>
  )
}
