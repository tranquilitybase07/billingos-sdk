import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { cn } from '@/utils/cn'
import type { PortalPaymentMethod, PortalCardDetails } from '../../../client/types'

interface PaymentMethodCardProps {
  paymentMethod: PortalPaymentMethod
  onSetDefault?: (id: string) => void
  onRemove?: (id: string) => void
  isSettingDefault?: boolean
  isRemoving?: boolean
  className?: string
}

function getCardIcon(brand: PortalCardDetails['brand']) {
  // Simple card brand icons using unicode/emoji
  const icons: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
    diners: '💳',
    jcb: '💳',
    unionpay: '💳',
  }
  return icons[brand] || '💳'
}

function formatCardBrand(brand: string): string {
  const brandNames: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  }
  return brandNames[brand] || brand.charAt(0).toUpperCase() + brand.slice(1)
}

export function PaymentMethodCard({
  paymentMethod,
  onSetDefault,
  onRemove,
  isSettingDefault,
  isRemoving,
  className,
}: PaymentMethodCardProps) {
  const { id, card, isDefault } = paymentMethod

  if (!card) {
    return null
  }

  const expiryDate = `${card.expMonth.toString().padStart(2, '0')}/${card.expYear}`

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCardIcon(card.brand)}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatCardBrand(card.brand)} •••• {card.last4}
                </span>
                {isDefault && <Badge variant="secondary">Default</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">Expires {expiryDate}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {!isDefault && onSetDefault && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSetDefault(id)}
              disabled={isSettingDefault}
            >
              {isSettingDefault ? 'Setting...' : 'Set as Default'}
            </Button>
          )}
          {onRemove && !isDefault && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(id)}
              disabled={isRemoving}
              className="text-destructive hover:text-destructive"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
