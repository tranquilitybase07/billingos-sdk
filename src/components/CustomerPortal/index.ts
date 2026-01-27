// Main component
export { CustomerPortal } from './CustomerPortal'
export type { CustomerPortalProps } from './CustomerPortal'

// Hooks
export {
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
  portalKeys,
} from './hooks/usePortalData'

// Sub-components (for advanced customization)
export { SubscriptionTab } from './tabs/SubscriptionTab'
export { InvoicesTab } from './tabs/InvoicesTab'
export { PaymentMethodsTab } from './tabs/PaymentMethodsTab'
export { SettingsTab } from './tabs/SettingsTab'

export { UsageBar } from './components/UsageBar'
export { FeatureList } from './components/FeatureList'
export { InvoiceCard } from './components/InvoiceCard'
export { PaymentMethodCard } from './components/PaymentMethodCard'
export { WarningBanner } from './components/WarningBanner'

export { ChangePlanModal } from './modals/ChangePlanModal'
export { CancelSubscriptionModal } from './modals/CancelSubscriptionModal'
export { AddPaymentMethodModal } from './modals/AddPaymentMethodModal'
