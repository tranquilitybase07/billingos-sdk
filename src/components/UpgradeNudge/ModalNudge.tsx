import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { NudgeTrigger } from '../../client/types'

export interface ModalNudgeProps {
  trigger: NudgeTrigger
  onUpgrade: () => void
  onDismiss: () => void
  theme?: 'light' | 'dark'
}

export function ModalNudge({
  trigger,
  onUpgrade,
  onDismiss,
}: ModalNudgeProps) {
  const isUrgent = trigger.actual && trigger.actual >= 100

  // Format price for display
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent
        className="sm:max-w-md"
        role={isUrgent ? 'alertdialog' : 'dialog'}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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
                width="24"
                height="24"
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
            <DialogTitle>{trigger.message.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {trigger.message.body}
          </DialogDescription>
        </DialogHeader>

        {/* Suggested Plan Card */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {trigger.suggestedPlan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold">
                    {formatPrice(
                      trigger.suggestedPlan.price.amount,
                      trigger.suggestedPlan.price.currency
                    )}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    / {trigger.suggestedPlan.price.interval}
                  </span>
                </div>
              </div>
              <Badge variant="secondary">Recommended</Badge>
            </div>

            {/* Highlights */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                What you'll get:
              </p>
              <ul className="space-y-2">
                {trigger.suggestedPlan.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
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
                      className="text-green-500 flex-shrink-0 mt-0.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="sm:flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={onUpgrade}
            className="sm:flex-1"
          >
            {trigger.message.cta} - {formatPrice(
              trigger.suggestedPlan.price.amount,
              trigger.suggestedPlan.price.currency
            )}/{trigger.suggestedPlan.price.interval}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
