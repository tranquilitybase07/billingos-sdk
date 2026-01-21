import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { cn } from '@/utils/cn'
import { Money } from '../../../utils/money'
import type { PortalInvoice } from '../../../client/types'

interface InvoiceCardProps {
  invoice: PortalInvoice
  onRetry?: (invoiceId: string) => void
  onDownload?: (pdfUrl: string) => void
  isRetrying?: boolean
  className?: string
}

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}

function getStatusBadge(status: PortalInvoice['status']) {
  switch (status) {
    case 'paid':
      return <Badge variant="success">Paid</Badge>
    case 'open':
      return <Badge variant="secondary">Open</Badge>
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>
    case 'void':
      return <Badge variant="outline">Void</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function InvoiceCard({
  invoice,
  onRetry,
  onDownload,
  isRetrying,
  className,
}: InvoiceCardProps) {
  const formattedDate = new Date(invoice.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedAmount = Money.format(invoice.amount, invoice.currency)

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{invoice.number}</span>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            {invoice.lineItems.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {invoice.lineItems[0].description}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold">{formattedAmount}</p>
          </div>
        </div>

        {invoice.status === 'failed' && invoice.failureReason && (
          <div className="mt-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            {invoice.failureReason}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          {invoice.status === 'failed' && onRetry && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onRetry(invoice.id)}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry Payment'}
            </Button>
          )}
          {invoice.pdfUrl && onDownload && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload(invoice.pdfUrl!)}
            >
              <DownloadIcon className="mr-1" />
              Download PDF
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
