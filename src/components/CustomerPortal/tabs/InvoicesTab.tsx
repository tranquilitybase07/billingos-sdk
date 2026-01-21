import { Card, CardContent } from '../../ui/card'
import { Skeleton } from '../../ui/skeleton'
import { InvoiceCard } from '../components/InvoiceCard'
import { cn } from '@/utils/cn'
import type { PortalInvoice } from '../../../client/types'

interface InvoicesTabProps {
  invoices: PortalInvoice[]
  onRetryInvoice: (invoiceId: string) => void
  onDownloadInvoice: (pdfUrl: string) => void
  retryingInvoiceId?: string
  isLoading?: boolean
  className?: string
}

function NoInvoices() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No invoices yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your first invoice will appear here after your first billing cycle.
        </p>
      </CardContent>
    </Card>
  )
}

function InvoicesTabSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function InvoicesTab({
  invoices,
  onRetryInvoice,
  onDownloadInvoice,
  retryingInvoiceId,
  isLoading,
  className,
}: InvoicesTabProps) {
  if (isLoading) {
    return <InvoicesTabSkeleton />
  }

  if (invoices.length === 0) {
    return <NoInvoices />
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="font-medium">Invoice History</h3>
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          onRetry={onRetryInvoice}
          onDownload={onDownloadInvoice}
          isRetrying={retryingInvoiceId === invoice.id}
        />
      ))}
    </div>
  )
}
