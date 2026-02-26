import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Alert, AlertDescription } from '../../ui/alert'
import { Badge } from '../../ui/badge'
import { Money } from '../../../utils/money'
import type { PreviewChangeResponse } from '../../../client/types'

interface ProrationPreviewProps {
  preview: PreviewChangeResponse
}

export function ProrationPreview({ preview }: ProrationPreviewProps) {
  const { current_plan, new_plan, proration, change_type, next_billing_date, notes } = preview

  const isUpgrade = change_type === 'upgrade'

  return (
    <div className="space-y-4">
      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Plan Change Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current Plan */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Plan:</span>
            <div className="text-right">
              <div className="font-medium">{current_plan.product_name}</div>
              <div className="text-muted-foreground text-xs">
                {Money.format(current_plan.amount, current_plan.currency)} / {current_plan.interval}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* New Plan */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">New Plan:</span>
            <div className="text-right">
              <div className="font-medium flex items-center gap-2 justify-end">
                {new_plan.product_name}
                <Badge variant={isUpgrade ? 'default' : 'secondary'} className="text-xs">
                  {isUpgrade ? 'Upgrade' : 'Downgrade'}
                </Badge>
              </div>
              <div className="text-muted-foreground text-xs">
                {Money.format(new_plan.amount, new_plan.currency)} / {new_plan.interval}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proration Breakdown */}
      {isUpgrade && proration.immediate_payment > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Billing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Credit for unused time */}
            {proration.unused_time_credit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Credit for unused time:</span>
                <span className="text-green-600 font-medium">
                  -{Money.format(proration.unused_time_credit, current_plan.currency)}
                </span>
              </div>
            )}

            {/* New plan charge */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prorated charge for new plan:</span>
              <span className="font-medium">
                {Money.format(proration.new_plan_charge, new_plan.currency)}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t my-2" />

            {/* Total */}
            <div className="flex justify-between text-base font-semibold">
              <span>Due Today:</span>
              <span>{Money.format(proration.immediate_payment, new_plan.currency)}</span>
            </div>

            {/* Next billing date */}
            <div className="text-xs text-muted-foreground mt-3">
              Next billing: {new Date(next_billing_date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Downgrade Notice */}
      {!isUpgrade && (
        <Alert>
          <AlertDescription className="text-sm">
            Your plan will change to <strong>{new_plan.product_name}</strong> on{' '}
            <strong>
              {new Date(next_billing_date).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </strong>
            . You'll keep access to your current plan features until then.
          </AlertDescription>
        </Alert>
      )}

      {/* Additional Notes */}
      {notes && notes.length > 0 && (
        <Alert>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
