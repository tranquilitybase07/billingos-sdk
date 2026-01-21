import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Skeleton } from '../../ui/skeleton'
import { UsageBar } from '../components/UsageBar'
import { FeatureList } from '../components/FeatureList'
import { WarningBanner } from '../components/WarningBanner'
import { Money } from '../../../utils/money'
import { cn } from '@/utils/cn'
import type { PortalSubscription, PortalAvailablePlan } from '../../../client/types'

interface SubscriptionTabProps {
  subscription: PortalSubscription | null
  availablePlans: PortalAvailablePlan[]
  onChangePlan: () => void
  onCancelSubscription: () => void
  onReactivate: () => void
  onAddPaymentMethod: () => void
  isLoading?: boolean
  className?: string
}

function formatInterval(interval: string, intervalCount: number): string {
  if (intervalCount === 1) {
    return interval
  }
  return `${intervalCount} ${interval}s`
}

function getStatusBadge(status: PortalSubscription['status'], cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) {
    return <Badge variant="warning">Cancels at period end</Badge>
  }

  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>
    case 'trialing':
      return <Badge variant="secondary">Trial</Badge>
    case 'past_due':
      return <Badge variant="destructive">Past Due</Badge>
    case 'canceled':
      return <Badge variant="outline">Canceled</Badge>
    case 'unpaid':
      return <Badge variant="destructive">Unpaid</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function NoSubscription({ onBrowsePlans }: { onBrowsePlans: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">You don't have an active subscription.</p>
        <Button onClick={onBrowsePlans}>Browse Plans</Button>
      </CardContent>
    </Card>
  )
}

function SubscriptionTabSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-40" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export function SubscriptionTab({
  subscription,
  onChangePlan,
  onCancelSubscription,
  onReactivate,
  onAddPaymentMethod,
  isLoading,
  className,
}: SubscriptionTabProps) {
  if (isLoading) {
    return <SubscriptionTabSkeleton />
  }

  if (!subscription) {
    return <NoSubscription onBrowsePlans={onChangePlan} />
  }

  const {
    product,
    price,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    trialEnd,
    features,
  } = subscription

  const formattedPrice = Money.format(price.amount, price.currency)
  const interval = formatInterval(price.interval, price.intervalCount)
  const nextBillingDate = new Date(currentPeriodEnd).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Filter usage-based features
  const usageFeatures = features.filter(
    (f) => (f.type === 'usage_quota' || f.type === 'numeric_limit') && f.usage
  )

  // Check for trial ending soon (within 3 days)
  const isTrialEndingSoon =
    status === 'trialing' &&
    trialEnd &&
    new Date(trialEnd).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000

  return (
    <div className={cn('space-y-6', className)}>
      {/* Warning Banners */}
      {status === 'past_due' && (
        <WarningBanner
          type="past_due"
          message="Your last payment was declined. Update your payment method to avoid service interruption."
          actionLabel="Update Payment"
          onAction={onAddPaymentMethod}
        />
      )}

      {isTrialEndingSoon && trialEnd && (
        <WarningBanner
          type="trial_ending"
          message={`Your trial ends on ${new Date(trialEnd).toLocaleDateString()}. Add a payment method to continue.`}
          actionLabel="Add Payment Method"
          onAction={onAddPaymentMethod}
        />
      )}

      {cancelAtPeriodEnd && (
        <WarningBanner
          type="subscription_canceled"
          message={`Your subscription will end on ${nextBillingDate}. You'll have access until then.`}
          actionLabel="Reactivate"
          onAction={onReactivate}
        />
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>
                {formattedPrice} / {interval}
              </CardDescription>
            </div>
            {getStatusBadge(status, cancelAtPeriodEnd)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              {cancelAtPeriodEnd ? 'Access until' : 'Next billing'}:{' '}
              <span className="font-medium text-foreground">{nextBillingDate}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onChangePlan}>
              View Other Plans
            </Button>
            {!cancelAtPeriodEnd && status !== 'canceled' && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={onCancelSubscription}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Section */}
      {usageFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage This Billing Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {usageFeatures.map((feature) => (
              <UsageBar
                key={feature.id}
                title={feature.title}
                usage={feature.usage!}
                unit={feature.properties.unit as string | undefined}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Features Section */}
      {features.some((f) => f.type === 'boolean_flag' && f.enabled) && (
        <Card>
          <CardContent className="pt-6">
            <FeatureList features={features} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
