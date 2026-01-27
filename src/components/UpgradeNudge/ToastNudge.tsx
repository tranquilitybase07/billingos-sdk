import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'
import type { NudgeTrigger } from '../../client/types'

export interface ToastNudgeProps {
  trigger: NudgeTrigger
  onUpgrade: () => void
  onDismiss: () => void
  theme?: 'light' | 'dark'
}

export function ToastNudge({
  trigger,
  onUpgrade,
  onDismiss,
}: ToastNudgeProps) {
  const isUrgent = trigger.actual && trigger.actual >= 95

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-400',
        'w-80 max-w-[calc(100vw-2rem)]'
      )}
      role="status"
      aria-live="polite"
    >
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-2 pr-8 relative">
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          {/* Icon and Title */}
          <div className="flex items-start gap-2">
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
                className="text-destructive flex-shrink-0 mt-0.5"
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
                className="text-amber-500 flex-shrink-0 mt-0.5"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" x2="12" y1="9" y2="13" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
            )}
            <CardTitle className="text-base font-semibold leading-tight">
              {trigger.message.title}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          <p className="text-sm text-muted-foreground mb-4">
            {trigger.message.body}
          </p>

          <Button
            className="w-full"
            size="sm"
            onClick={onUpgrade}
          >
            {trigger.message.cta}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
