import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog'
import { Card, CardContent } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Money } from '../../../utils/money'
import { cn } from '@/utils/cn'
import type { PortalSubscription, PortalAvailablePlan } from '../../../client/types'

interface ChangePlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSubscription: PortalSubscription | null
  availablePlans: PortalAvailablePlan[]
  onSelectPlan: (planId: string) => void
  isChanging?: boolean
  selectedPlanId?: string
}

function PlanCard({
  plan,
  isSelected,
  isCurrent,
  onSelect,
  disabled,
}: {
  plan: PortalAvailablePlan
  isSelected: boolean
  isCurrent: boolean
  onSelect: () => void
  disabled?: boolean
}) {
  const formattedPrice = Money.format(plan.price.amount, plan.price.currency)

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all',
        isSelected && 'ring-2 ring-primary',
        isCurrent && 'opacity-60',
        disabled && 'pointer-events-none opacity-50'
      )}
      onClick={() => !isCurrent && !disabled && onSelect()}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{plan.name}</span>
              {isCurrent && <Badge variant="secondary">Current</Badge>}
              {plan.type === 'upgrade' && !isCurrent && (
                <Badge variant="default">Upgrade</Badge>
              )}
              {plan.type === 'downgrade' && !isCurrent && (
                <Badge variant="outline">Downgrade</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formattedPrice} / {plan.price.interval}
            </p>
          </div>
          {!isCurrent && (
            <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
              {isSelected && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ChangePlanModal({
  open,
  onOpenChange,
  currentSubscription,
  availablePlans,
  onSelectPlan,
  isChanging,
}: ChangePlanModalProps) {
  const [localSelectedId, setLocalSelectedId] = React.useState<string | null>(null)

  // Reset selection when modal opens
  React.useEffect(() => {
    if (open) {
      setLocalSelectedId(null)
    }
  }, [open])

  const currentPlanId = currentSubscription?.product.id

  const handleConfirm = () => {
    if (localSelectedId) {
      onSelectPlan(localSelectedId)
    }
  }

  const selectedPlan = availablePlans.find((p) => p.id === localSelectedId)
  const isUpgrade = selectedPlan?.type === 'upgrade'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Your Plan</DialogTitle>
          <DialogDescription>
            {currentSubscription ? (
              <>
                You're currently on:{' '}
                <strong>
                  {currentSubscription.product.name} (
                  {Money.format(
                    currentSubscription.price.amount,
                    currentSubscription.price.currency
                  )}
                  /{currentSubscription.price.interval})
                </strong>
              </>
            ) : (
              'Select a plan to get started'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {availablePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={localSelectedId === plan.id}
              isCurrent={plan.id === currentPlanId || plan.type === 'current'}
              onSelect={() => setLocalSelectedId(plan.id)}
              disabled={isChanging}
            />
          ))}
        </div>

        {localSelectedId && (
          <div className="rounded-md bg-muted p-3 text-sm">
            {isUpgrade ? (
              <p>
                You'll be charged a prorated amount for the upgrade. Your new plan will take effect
                immediately.
              </p>
            ) : (
              <p>
                Your plan change will take effect at the end of your current billing period.
                You'll keep access to your current plan until then.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isChanging}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!localSelectedId || isChanging}
          >
            {isChanging
              ? 'Processing...'
              : isUpgrade
              ? 'Upgrade Now'
              : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
