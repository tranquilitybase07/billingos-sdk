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
import { Alert, AlertDescription } from '../../ui/alert'
import { Skeleton } from '../../ui/skeleton'
import { Money } from '../../../utils/money'
import { cn } from '@/utils/cn'
import { ProrationPreview } from '../components/ProrationPreview'
import { useAvailablePlans, usePreviewPlanChange, useChangePlan } from '../../../hooks/useSubscription'
import type { AvailablePlan, PreviewChangeResponse } from '../../../client/types'

interface ChangePlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriptionId: string
  onSuccess?: () => void
}

function PlanCard({
  plan,
  isSelected,
  isCurrent,
  onSelect,
  disabled,
}: {
  plan: AvailablePlan
  isSelected: boolean
  isCurrent: boolean
  onSelect: () => void
  disabled?: boolean
}) {
  const formattedPrice = Money.format(plan.amount, plan.currency)
  const isUpgrade = !isCurrent && plan.amount > 0
  const isDowngrade = !isCurrent && !isUpgrade

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-primary',
        isSelected && 'ring-2 ring-primary',
        isCurrent && 'opacity-60',
        disabled && 'pointer-events-none opacity-50'
      )}
      onClick={() => !isCurrent && !disabled && onSelect()}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{plan.product_name}</span>
              {isCurrent && <Badge variant="secondary">Current</Badge>}
              {isUpgrade && <Badge variant="default">Upgrade</Badge>}
              {isDowngrade && <Badge variant="outline">Downgrade</Badge>}
            </div>
            {plan.description && (
              <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
            )}
            <p className="text-sm font-medium mt-2">
              {plan.is_free ? 'Free' : `${formattedPrice} / ${plan.interval}`}
            </p>
          </div>
          {!isCurrent && (
            <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0 ml-3">
              {isSelected && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
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
  subscriptionId,
  onSuccess,
}: ChangePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = React.useState<AvailablePlan | null>(null)
  const [preview, setPreview] = React.useState<PreviewChangeResponse | null>(null)
  const [showConfirmation, setShowConfirmation] = React.useState(false)

  // Fetch available plans
  const { data: availablePlans, isLoading: isLoadingPlans, error: plansError } = useAvailablePlans(
    subscriptionId,
    { enabled: open }
  )

  // Preview mutation
  const previewMutation = usePreviewPlanChange()

  // Change plan mutation
  const changePlanMutation = useChangePlan({
    onSuccess: () => {
      onSuccess?.()
      onOpenChange(false)
    },
  })

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setSelectedPlan(null)
      setPreview(null)
      setShowConfirmation(false)
    }
  }, [open])

  // Handle plan selection and fetch preview
  const handleSelectPlan = async (plan: AvailablePlan) => {
    setSelectedPlan(plan)
    setShowConfirmation(false)
    setPreview(null)

    // Fetch preview
    try {
      const previewData = await previewMutation.mutateAsync({
        subscriptionId,
        input: {
          new_price_id: plan.price_id,
          effective_date: 'immediate', // Can be made configurable in Phase 2
        },
      })

      setPreview(previewData)
      setShowConfirmation(true)
    } catch (error) {
      console.error('Failed to preview plan change:', error)
      setSelectedPlan(null)
    }
  }

  // Handle plan change confirmation
  const handleConfirm = async () => {
    if (!selectedPlan || !preview) return

    try {
      await changePlanMutation.mutateAsync({
        subscriptionId,
        input: {
          new_price_id: selectedPlan.price_id,
          confirm_amount: preview.proration.immediate_payment,
          effective_date: 'immediate',
        },
      })
    } catch (error) {
      console.error('Failed to change plan:', error)
    }
  }

  const allPlans = [
    ...(availablePlans?.available_upgrades || []),
    ...(availablePlans?.available_downgrades || []),
  ]

  const currentPlanId = availablePlans?.current_plan?.price_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showConfirmation ? 'Confirm Plan Change' : 'Change Your Plan'}
          </DialogTitle>
          {!showConfirmation && availablePlans?.current_plan && (
            <DialogDescription>
              You're currently on:{' '}
              <strong>
                {availablePlans.current_plan.product_name} (
                {Money.format(
                  availablePlans.current_plan.amount,
                  availablePlans.current_plan.currency
                )}
                /{availablePlans.current_plan.interval})
              </strong>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          {/* Loading State */}
          {isLoadingPlans && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {/* Error State */}
          {plansError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load available plans. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Plan Selection View */}
          {!isLoadingPlans && !plansError && !showConfirmation && (
            <div className="space-y-3">
              {allPlans.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No other plans are currently available. Contact support if you need assistance.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {allPlans.map((plan) => (
                    <PlanCard
                      key={plan.price_id}
                      plan={plan}
                      isSelected={selectedPlan?.price_id === plan.price_id}
                      isCurrent={plan.price_id === currentPlanId}
                      onSelect={() => handleSelectPlan(plan)}
                      disabled={previewMutation.isPending}
                    />
                  ))}

                  {/* Restrictions */}
                  {availablePlans?.restrictions && availablePlans.restrictions.length > 0 && (
                    <Alert className="mt-4">
                      <AlertDescription>
                        <p className="font-semibold mb-2">Plan Change Restrictions:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {availablePlans.restrictions.map((restriction, idx) => (
                            <li key={idx}>{restriction}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          )}

          {/* Preview Loading State */}
          {previewMutation.isPending && selectedPlan && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Calculating proration...</span>
              </div>
            </div>
          )}

          {/* Preview Error State */}
          {previewMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to calculate proration. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation View with Proration */}
          {showConfirmation && preview && (
            <div>
              <Alert className="mb-4">
                <AlertDescription className="text-sm">
                  Please review the details below before confirming your plan change.
                </AlertDescription>
              </Alert>

              <ProrationPreview preview={preview} />
            </div>
          )}
        </div>

        <DialogFooter>
          {!showConfirmation ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false)
                  setPreview(null)
                  setSelectedPlan(null)
                }}
                disabled={changePlanMutation.isPending}
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={changePlanMutation.isPending}
              >
                {changePlanMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Confirm ${preview?.change_type === 'upgrade' ? 'Upgrade' : 'Downgrade'}`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
