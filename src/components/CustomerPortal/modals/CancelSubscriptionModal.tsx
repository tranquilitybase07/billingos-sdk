import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Checkbox } from '../../ui/checkbox'
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group'
import { Textarea } from '../../ui/textarea'
import { Label } from '../../ui/label'
import type { PortalCancelSubscriptionInput } from '../../../client/types'

type CancellationReason = PortalCancelSubscriptionInput['cancellationReason']

interface CancelSubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  periodEndDate: string
  onConfirm: (input: PortalCancelSubscriptionInput) => void
  isCanceling?: boolean
}

const CANCELLATION_REASONS: { value: CancellationReason; label: string }[] = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'found_alternative', label: 'Found a better alternative' },
  { value: 'no_longer_needed', label: 'No longer need the service' },
  { value: 'other', label: 'Other' },
]

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  periodEndDate,
  onConfirm,
  isCanceling,
}: CancelSubscriptionModalProps) {
  const [selectedReasons, setSelectedReasons] = React.useState<CancellationReason[]>([])
  const [feedback, setFeedback] = React.useState('')
  const [cancelTiming, setCancelTiming] = React.useState<'period_end' | 'immediately'>('period_end')

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setSelectedReasons([])
      setFeedback('')
      setCancelTiming('period_end')
    }
  }, [open])

  const formattedEndDate = new Date(periodEndDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const toggleReason = (reason: CancellationReason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    )
  }

  const handleConfirm = () => {
    onConfirm({
      cancelAtPeriodEnd: cancelTiming === 'period_end',
      cancellationReason: selectedReasons[0], // API accepts single reason
      feedback: feedback || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            We're sorry to see you go! Help us improve by telling us why you're canceling.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reasons */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Reason for canceling</Label>
            {CANCELLATION_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={selectedReasons.includes(reason.value)}
                  onCheckedChange={() => toggleReason(reason.value)}
                />
                <span className="text-sm">{reason.label}</span>
              </label>
            ))}
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm font-medium">
              Additional feedback (optional)
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What could we have done better?"
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Timing */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">When would you like to cancel?</Label>
            <RadioGroup
              value={cancelTiming}
              onValueChange={(v) => setCancelTiming(v as 'period_end' | 'immediately')}
            >
              <label className="flex items-start gap-2 cursor-pointer">
                <RadioGroupItem value="period_end" className="mt-1" />
                <div>
                  <span className="text-sm font-medium">Cancel at period end ({formattedEndDate})</span>
                  <p className="text-xs text-muted-foreground">
                    You'll keep access until then.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <RadioGroupItem value="immediately" className="mt-1" />
                <div>
                  <span className="text-sm font-medium">Cancel immediately</span>
                  <p className="text-xs text-muted-foreground">
                    You'll lose access now. No refunds.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCanceling}
          >
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isCanceling}
          >
            {isCanceling ? 'Canceling...' : 'Confirm Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
