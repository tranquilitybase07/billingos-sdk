import { Card, CardContent } from '../../ui/card'
import { Button } from '../../ui/button'
import { Skeleton } from '../../ui/skeleton'
import { PaymentMethodCard } from '../components/PaymentMethodCard'
import { cn } from '@/utils/cn'
import type { PortalPaymentMethod } from '../../../client/types'

interface PaymentMethodsTabProps {
  paymentMethods: PortalPaymentMethod[]
  onAddPaymentMethod: () => void
  onSetDefault: (id: string) => void
  onRemove: (id: string) => void
  settingDefaultId?: string
  removingId?: string
  isLoading?: boolean
  className?: string
}

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

function NoPaymentMethods({ onAdd }: { onAdd: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">No payment methods on file.</p>
        <Button onClick={onAdd}>
          <PlusIcon className="mr-2" />
          Add Payment Method
        </Button>
      </CardContent>
    </Card>
  )
}

function PaymentMethodsTabSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
      <Skeleton className="h-10 w-44" />
    </div>
  )
}

export function PaymentMethodsTab({
  paymentMethods,
  onAddPaymentMethod,
  onSetDefault,
  onRemove,
  settingDefaultId,
  removingId,
  isLoading,
  className,
}: PaymentMethodsTabProps) {
  if (isLoading) {
    return <PaymentMethodsTabSkeleton />
  }

  if (paymentMethods.length === 0) {
    return <NoPaymentMethods onAdd={onAddPaymentMethod} />
  }

  // Sort to show default first
  const sortedMethods = [...paymentMethods].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return 0
  })

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-medium">Payment Methods</h3>
      {sortedMethods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          paymentMethod={method}
          onSetDefault={onSetDefault}
          onRemove={onRemove}
          isSettingDefault={settingDefaultId === method.id}
          isRemoving={removingId === method.id}
        />
      ))}
      <Button variant="outline" onClick={onAddPaymentMethod}>
        <PlusIcon className="mr-2" />
        Add New Payment Method
      </Button>
    </div>
  )
}
