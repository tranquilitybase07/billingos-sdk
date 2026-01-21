import * as React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '@/utils/cn'

// Tabs
import { SubscriptionTab } from './tabs/SubscriptionTab'
import { InvoicesTab } from './tabs/InvoicesTab'
import { PaymentMethodsTab } from './tabs/PaymentMethodsTab'
import { SettingsTab } from './tabs/SettingsTab'

// Modals
import { ChangePlanModal } from './modals/ChangePlanModal'
import { CancelSubscriptionModal } from './modals/CancelSubscriptionModal'
import { AddPaymentMethodModal } from './modals/AddPaymentMethodModal'

// Hooks
import {
  usePortalData,
  useUpdatePortalSubscription,
  useCancelPortalSubscription,
  useReactivatePortalSubscription,
  useSetupIntent,
  useAddPaymentMethod,
  useRemovePaymentMethod,
  useSetDefaultPaymentMethod,
  useRetryInvoice,
  useUpdateCustomerBilling,
} from './hooks/usePortalData'

// Types
import type { PortalCancelSubscriptionInput, PortalAddress } from '../../client/types'

type PortalTab = 'subscription' | 'invoices' | 'payment' | 'settings'

interface CustomerPortalProps {
  /**
   * Open/close state (for drawer/modal mode)
   */
  isOpen?: boolean

  /**
   * Callback when user closes portal
   */
  onClose?: () => void

  /**
   * Display mode
   * - 'drawer': Slide-in from right (default)
   * - 'modal': Centered modal
   * - 'page': Full-page view
   */
  mode?: 'drawer' | 'modal' | 'page'

  /**
   * Default tab to show
   */
  defaultTab?: PortalTab

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark'

  /**
   * Optional: Custom class name
   */
  className?: string
}

function PortalContent({
  defaultTab = 'subscription',
  className,
}: {
  defaultTab: PortalTab
  className?: string
}) {
  const [activeTab, setActiveTab] = React.useState<PortalTab>(defaultTab)

  // Modal states
  const [showChangePlan, setShowChangePlan] = React.useState(false)
  const [showCancelSubscription, setShowCancelSubscription] = React.useState(false)
  const [showAddPaymentMethod, setShowAddPaymentMethod] = React.useState(false)

  // Action states
  const [retryingInvoiceId, setRetryingInvoiceId] = React.useState<string | undefined>()
  const [settingDefaultId, setSettingDefaultId] = React.useState<string | undefined>()
  const [removingPaymentId, setRemovingPaymentId] = React.useState<string | undefined>()
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | undefined>()

  // Fetch portal data
  const { data: portalData, isLoading, error } = usePortalData()

  // Mutations
  const updateSubscription = useUpdatePortalSubscription(
    portalData?.subscription?.id || '',
    {
      onSuccess: () => {
        setShowChangePlan(false)
        setSelectedPlanId(undefined)
      },
    }
  )

  const cancelSubscription = useCancelPortalSubscription(
    portalData?.subscription?.id || '',
    {
      onSuccess: () => {
        setShowCancelSubscription(false)
      },
    }
  )

  const reactivateSubscription = useReactivatePortalSubscription(
    portalData?.subscription?.id || ''
  )

  const setupIntent = useSetupIntent()

  const addPaymentMethod = useAddPaymentMethod({
    onSuccess: () => {
      setShowAddPaymentMethod(false)
    },
  })

  const removePaymentMethod = useRemovePaymentMethod({
    onSuccess: () => {
      setRemovingPaymentId(undefined)
    },
  })

  const setDefaultPaymentMethod = useSetDefaultPaymentMethod({
    onSuccess: () => {
      setSettingDefaultId(undefined)
    },
  })

  const retryInvoice = useRetryInvoice({
    onSuccess: () => {
      setRetryingInvoiceId(undefined)
    },
  })

  const updateCustomerBilling = useUpdateCustomerBilling()

  // Handlers
  const handleChangePlan = () => {
    setShowChangePlan(true)
  }

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId)
    // Find the selected plan to get its price ID
    const plan = portalData?.availablePlans.find((p) => p.id === planId)
    if (plan) {
      updateSubscription.mutate({
        newPriceId: planId, // Assuming planId is the price ID
        prorationBehavior: 'always_invoice',
      })
    }
  }

  const handleCancelSubscription = () => {
    setShowCancelSubscription(true)
  }

  const handleConfirmCancel = (input: PortalCancelSubscriptionInput) => {
    cancelSubscription.mutate(input)
  }

  const handleReactivate = () => {
    reactivateSubscription.mutate()
  }

  const handleAddPaymentMethod = async () => {
    setShowAddPaymentMethod(true)
    // Trigger setup intent fetch
    setupIntent.refetch()
  }

  const handlePaymentMethodAdded = (paymentMethodId: string, setAsDefault: boolean) => {
    addPaymentMethod.mutate({
      paymentMethodId,
      setAsDefault,
    })
  }

  const handleSetDefault = (id: string) => {
    setSettingDefaultId(id)
    setDefaultPaymentMethod.mutate(id)
  }

  const handleRemovePaymentMethod = (id: string) => {
    setRemovingPaymentId(id)
    removePaymentMethod.mutate(id)
  }

  const handleRetryInvoice = (invoiceId: string) => {
    setRetryingInvoiceId(invoiceId)
    retryInvoice.mutate({ invoiceId })
  }

  const handleDownloadInvoice = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank')
  }

  const handleSaveSettings = (data: {
    name?: string
    email?: string
    billingAddress?: PortalAddress
  }) => {
    updateCustomerBilling.mutate(data)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-center text-muted-foreground">
        <div>
          <p>Failed to load billing information.</p>
          <p className="text-sm mt-1">Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as PortalTab)}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 mt-4">
          <TabsContent value="subscription" className="m-0 h-full">
            <div className="pr-4 pb-6">
              <SubscriptionTab
                subscription={portalData?.subscription || null}
                availablePlans={portalData?.availablePlans || []}
                onChangePlan={handleChangePlan}
                onCancelSubscription={handleCancelSubscription}
                onReactivate={handleReactivate}
                onAddPaymentMethod={handleAddPaymentMethod}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="m-0 h-full">
            <div className="pr-4 pb-6">
              <InvoicesTab
                invoices={portalData?.invoices || []}
                onRetryInvoice={handleRetryInvoice}
                onDownloadInvoice={handleDownloadInvoice}
                retryingInvoiceId={retryingInvoiceId}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="payment" className="m-0 h-full">
            <div className="pr-4 pb-6">
              <PaymentMethodsTab
                paymentMethods={portalData?.paymentMethods || []}
                onAddPaymentMethod={handleAddPaymentMethod}
                onSetDefault={handleSetDefault}
                onRemove={handleRemovePaymentMethod}
                settingDefaultId={settingDefaultId}
                removingId={removingPaymentId}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="m-0 h-full">
            <div className="pr-4 pb-6">
              <SettingsTab
                customer={portalData?.customer ?? { id: '', email: '', name: '' }}
                onSave={handleSaveSettings}
                isSaving={updateCustomerBilling.isPending}
                isLoading={isLoading || !portalData?.customer}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals */}
      <ChangePlanModal
        open={showChangePlan}
        onOpenChange={setShowChangePlan}
        currentSubscription={portalData?.subscription || null}
        availablePlans={portalData?.availablePlans || []}
        onSelectPlan={handleSelectPlan}
        isChanging={updateSubscription.isPending}
        selectedPlanId={selectedPlanId}
      />

      {portalData?.subscription && (
        <CancelSubscriptionModal
          open={showCancelSubscription}
          onOpenChange={setShowCancelSubscription}
          periodEndDate={portalData.subscription.currentPeriodEnd}
          onConfirm={handleConfirmCancel}
          isCanceling={cancelSubscription.isPending}
        />
      )}

      <AddPaymentMethodModal
        open={showAddPaymentMethod}
        onOpenChange={setShowAddPaymentMethod}
        onSuccess={handlePaymentMethodAdded}
        clientSecret={setupIntent.data?.clientSecret}
        stripePublishableKey={setupIntent.data?.stripePublishableKey}
        isLoading={setupIntent.isFetching}
      />
    </div>
  )
}

export function CustomerPortal({
  isOpen = true,
  onClose,
  mode = 'drawer',
  defaultTab = 'subscription',
  theme,
  className,
}: CustomerPortalProps) {
  // Apply theme class
  const themeClass = theme === 'dark' ? 'dark' : ''

  // Drawer mode
  if (mode === 'drawer') {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent side="right" className={cn('w-[450px] sm:max-w-lg flex flex-col', themeClass, className)}>
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Subscription</SheetTitle>
          </SheetHeader>
          <ScrollArea className="mt-6 flex-1 min-h-0 pr-4">
            <PortalContent defaultTab={defaultTab} />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  // Modal mode
  if (mode === 'modal') {
    const [activeTab, setActiveTab] = React.useState<PortalTab>(defaultTab)

    // Modal states
    const [showChangePlan, setShowChangePlan] = React.useState(false)
    const [showCancelSubscription, setShowCancelSubscription] = React.useState(false)
    const [showAddPaymentMethod, setShowAddPaymentMethod] = React.useState(false)

    // Action states
    const [retryingInvoiceId, setRetryingInvoiceId] = React.useState<string | undefined>()
    const [settingDefaultId, setSettingDefaultId] = React.useState<string | undefined>()
    const [removingPaymentId, setRemovingPaymentId] = React.useState<string | undefined>()
    const [selectedPlanId, setSelectedPlanId] = React.useState<string | undefined>()

    // Fetch portal data
    const { data: portalData, isLoading, error } = usePortalData()

    // Mutations
    const updateSubscription = useUpdatePortalSubscription(
      portalData?.subscription?.id || '',
      {
        onSuccess: () => {
          setShowChangePlan(false)
          setSelectedPlanId(undefined)
        },
      }
    )

    const cancelSubscription = useCancelPortalSubscription(
      portalData?.subscription?.id || '',
      {
        onSuccess: () => {
          setShowCancelSubscription(false)
        },
      }
    )

    const reactivateSubscription = useReactivatePortalSubscription(
      portalData?.subscription?.id || ''
    )

    const setupIntent = useSetupIntent()

    const addPaymentMethod = useAddPaymentMethod({
      onSuccess: () => {
        setShowAddPaymentMethod(false)
      },
    })

    const removePaymentMethod = useRemovePaymentMethod({
      onSuccess: () => {
        setRemovingPaymentId(undefined)
      },
    })

    const setDefaultPaymentMethod = useSetDefaultPaymentMethod({
      onSuccess: () => {
        setSettingDefaultId(undefined)
      },
    })

    const retryInvoice = useRetryInvoice({
      onSuccess: () => {
        setRetryingInvoiceId(undefined)
      },
    })

    const updateCustomerBilling = useUpdateCustomerBilling()

    // Handlers
    const handleChangePlan = () => {
      setShowChangePlan(true)
    }

    const handleSelectPlan = (planId: string) => {
      setSelectedPlanId(planId)
      const plan = portalData?.availablePlans.find((p) => p.id === planId)
      if (plan) {
        updateSubscription.mutate({
          newPriceId: planId,
          prorationBehavior: 'always_invoice',
        })
      }
    }

    const handleCancelSubscription = () => {
      setShowCancelSubscription(true)
    }

    const handleConfirmCancel = (input: PortalCancelSubscriptionInput) => {
      cancelSubscription.mutate(input)
    }

    const handleReactivate = () => {
      reactivateSubscription.mutate()
    }

    const handleAddPaymentMethod = async () => {
      setShowAddPaymentMethod(true)
      setupIntent.refetch()
    }

    const handlePaymentMethodAdded = (paymentMethodId: string, setAsDefault: boolean) => {
      addPaymentMethod.mutate({
        paymentMethodId,
        setAsDefault,
      })
    }

    const handleSetDefault = (id: string) => {
      setSettingDefaultId(id)
      setDefaultPaymentMethod.mutate(id)
    }

    const handleRemovePaymentMethod = (id: string) => {
      setRemovingPaymentId(id)
      removePaymentMethod.mutate(id)
    }

    const handleRetryInvoice = (invoiceId: string) => {
      setRetryingInvoiceId(invoiceId)
      retryInvoice.mutate({ invoiceId })
    }

    const handleDownloadInvoice = (pdfUrl: string) => {
      window.open(pdfUrl, '_blank')
    }

    const handleSaveSettings = (data: {
      name?: string
      email?: string
      billingAddress?: PortalAddress
    }) => {
      updateCustomerBilling.mutate(data)
    }

    if (error) {
      return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
          <DialogContent className={cn('max-w-2xl max-h-[90vh] flex flex-col', themeClass, className)}>
            <DialogHeader className="flex-shrink-0 pb-4">
              <DialogTitle>Manage Subscription</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center py-12 text-center text-muted-foreground">
              <div>
                <p>Failed to load billing information.</p>
                <p className="text-sm mt-1">Please try again later.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className={cn('max-w-2xl max-h-[90vh] flex flex-col', themeClass, className)}>
          <DialogHeader className="flex-shrink-0 pb-4">
            <DialogTitle>Manage Subscription</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-6 pb-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as PortalTab)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="subscription" className="mt-0">
                <SubscriptionTab
                  subscription={portalData?.subscription || null}
                  availablePlans={portalData?.availablePlans || []}
                  onChangePlan={handleChangePlan}
                  onCancelSubscription={handleCancelSubscription}
                  onReactivate={handleReactivate}
                  onAddPaymentMethod={handleAddPaymentMethod}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="invoices" className="mt-0">
                <InvoicesTab
                  invoices={portalData?.invoices || []}
                  onRetryInvoice={handleRetryInvoice}
                  onDownloadInvoice={handleDownloadInvoice}
                  retryingInvoiceId={retryingInvoiceId}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="payment" className="mt-0">
                <PaymentMethodsTab
                  paymentMethods={portalData?.paymentMethods || []}
                  onAddPaymentMethod={handleAddPaymentMethod}
                  onSetDefault={handleSetDefault}
                  onRemove={handleRemovePaymentMethod}
                  settingDefaultId={settingDefaultId}
                  removingId={removingPaymentId}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <SettingsTab
                  customer={portalData?.customer ?? { id: '', email: '', name: '' }}
                  onSave={handleSaveSettings}
                  isSaving={updateCustomerBilling.isPending}
                  isLoading={isLoading || !portalData?.customer}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Modals */}
          <ChangePlanModal
            open={showChangePlan}
            onOpenChange={setShowChangePlan}
            currentSubscription={portalData?.subscription || null}
            availablePlans={portalData?.availablePlans || []}
            onSelectPlan={handleSelectPlan}
            isChanging={updateSubscription.isPending}
            selectedPlanId={selectedPlanId}
          />

          {portalData?.subscription && (
            <CancelSubscriptionModal
              open={showCancelSubscription}
              onOpenChange={setShowCancelSubscription}
              periodEndDate={portalData.subscription.currentPeriodEnd}
              onConfirm={handleConfirmCancel}
              isCanceling={cancelSubscription.isPending}
            />
          )}

          <AddPaymentMethodModal
            open={showAddPaymentMethod}
            onOpenChange={setShowAddPaymentMethod}
            onSuccess={handlePaymentMethodAdded}
            clientSecret={setupIntent.data?.clientSecret}
            stripePublishableKey={setupIntent.data?.stripePublishableKey}
            isLoading={setupIntent.isFetching}
          />
        </DialogContent>
      </Dialog>
    )
  }

  // Page mode
  return (
    <div className={cn('container mx-auto max-w-4xl py-8', themeClass, className)}>
      <h1 className="text-2xl font-bold mb-6">Billing & Subscription</h1>
      <PortalContent defaultTab={defaultTab} />
    </div>
  )
}

export type { CustomerPortalProps }
