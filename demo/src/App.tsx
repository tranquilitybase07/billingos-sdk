import { useState } from 'react'
import { BillingOSProvider, CustomerPortal, PaymentBottomSheet, PricingTable, UpgradeNudge } from '../../src'
import { mockUsageCheck80, mockUsageCheck95, mockUsageCheckFeature } from './mockData'

type PortalMode = 'drawer' | 'modal' | 'page'
type DemoComponent = 'portal' | 'payment' | 'pricing' | 'nudge'
type NudgeStyle = 'banner' | 'toast' | 'modal'
type NudgeScenario = '80%' | '95%' | 'feature'

function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<PortalMode>('drawer')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [activeComponent, setActiveComponent] = useState<DemoComponent>('portal')
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isUpgrade, setIsUpgrade] = useState(false)
  const [nudgeStyle, setNudgeStyle] = useState<NudgeStyle>('toast')
  const [nudgeScenario, setNudgeScenario] = useState<NudgeScenario>('80%')
  const [showNudge, setShowNudge] = useState(false)

  // Get mock data based on scenario
  const getNudgeTrigger = () => {
    switch (nudgeScenario) {
      case '95%':
        return mockUsageCheck95.trigger!
      case 'feature':
        return mockUsageCheckFeature.trigger!
      default:
        return mockUsageCheck80.trigger!
    }
  }

  // Toggle dark class on document for theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <BillingOSProvider
      apiKey="pk_test_demo123"
      customerId="cust_demo123"
      options={{
        baseUrl: window.location.origin, // Uses same origin - mock API served by Vite
        environment: 'sandbox'
      }}
    >
      <div className={`min-h-screen bg-background text-foreground transition-colors ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="container mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">BillingOS SDK Demo</h1>
            <p className="text-muted-foreground">
              Test the CustomerPortal component in different modes
            </p>
          </div>

          {/* Component Selection */}
          <div className="bg-card rounded-lg border p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Select Component</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveComponent('portal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeComponent === 'portal'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                CustomerPortal
              </button>
              <button
                onClick={() => setActiveComponent('payment')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeComponent === 'payment'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                PaymentBottomSheet
              </button>
              <button
                onClick={() => setActiveComponent('pricing')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeComponent === 'pricing'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                PricingTable
              </button>
              <button
                onClick={() => setActiveComponent('nudge')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeComponent === 'nudge'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                UpgradeNudge
              </button>
            </div>
          </div>

          {/* CustomerPortal Controls */}
          {activeComponent === 'portal' && (
            <div className="bg-card rounded-lg border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">CustomerPortal Controls</h2>

              {/* Mode Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Display Mode</label>
                <div className="flex gap-2">
                  {(['drawer', 'modal', 'page'] as PortalMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        mode === m
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Theme</label>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </button>
              </div>

              {/* Open Portal Button */}
              {mode !== 'page' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Actions</label>
                  <button
                    onClick={() => setIsOpen(true)}
                    className="px-6 py-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Open Customer Portal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PaymentBottomSheet Controls */}
          {activeComponent === 'payment' && (
            <div className="bg-card rounded-lg border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">PaymentBottomSheet Controls</h2>

              {/* Theme Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Theme</label>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </button>
              </div>

              {/* Upgrade Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Scenario</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsUpgrade(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !isUpgrade
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    New Subscription
                  </button>
                  <button
                    onClick={() => setIsUpgrade(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isUpgrade
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Upgrade (with Proration)
                  </button>
                </div>
              </div>

              {/* Open Payment Sheet Button */}
              <div>
                <label className="block text-sm font-medium mb-2">Actions</label>
                <button
                  onClick={() => setIsPaymentOpen(true)}
                  className="px-6 py-3 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  {isUpgrade ? 'Upgrade to Enterprise' : 'Subscribe to Enterprise'}
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-muted rounded-lg p-4 mb-8">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This demo uses mock API endpoints. In a real application,
              you would connect to the BillingOS API with valid credentials.
              {activeComponent === 'payment' && (
                <span className="block mt-2">
                  <strong>PaymentBottomSheet:</strong> The Stripe payment form requires a valid Stripe publishable key.
                  In this demo, you'll see the checkout session data but actual payment processing won't work.
                </span>
              )}
            </p>
          </div>

          {/* CustomerPortal Components */}
          {activeComponent === 'portal' && (
            <>
              {/* Page Mode Container */}
              {mode === 'page' && (
                <div className="bg-card rounded-lg border">
                  <CustomerPortal
                    mode="page"
                    defaultTab="subscription"
                    theme={theme}
                  />
                </div>
              )}

              {/* Drawer/Modal Mode */}
              {mode !== 'page' && (
                <CustomerPortal
                  isOpen={isOpen}
                  onClose={() => setIsOpen(false)}
                  mode={mode}
                  defaultTab="subscription"
                  theme={theme}
                />
              )}
            </>
          )}

          {/* PaymentBottomSheet Component */}
          {activeComponent === 'payment' && (
            <PaymentBottomSheet
              priceId="price_enterprise_monthly"
              isOpen={isPaymentOpen}
              onClose={() => setIsPaymentOpen(false)}
              onSuccess={(subscriptionId) => {
                console.log('Payment successful! Subscription ID:', subscriptionId)
                setIsPaymentOpen(false)
                alert(`Payment successful! Subscription ID: ${subscriptionId}`)
              }}
              existingSubscriptionId={isUpgrade ? 'sub_demo123' : undefined}
              theme={theme}
            />
          )}

          {/* PricingTable Controls */}
          {activeComponent === 'pricing' && (
            <div className="bg-card rounded-lg border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">PricingTable Controls</h2>

              {/* Theme Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Theme</label>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </button>
              </div>
            </div>
          )}

          {/* UpgradeNudge Controls */}
          {activeComponent === 'nudge' && (
            <div className="bg-card rounded-lg border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">UpgradeNudge Controls</h2>

              {/* Style Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Display Style</label>
                <div className="flex gap-2">
                  {(['banner', 'toast', 'modal'] as NudgeStyle[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setNudgeStyle(s)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        nudgeStyle === s
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scenario Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Scenario</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNudgeScenario('80%')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      nudgeScenario === '80%'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    80% Usage (Warning)
                  </button>
                  <button
                    onClick={() => setNudgeScenario('95%')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      nudgeScenario === '95%'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    95% Usage (Urgent)
                  </button>
                  <button
                    onClick={() => setNudgeScenario('feature')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      nudgeScenario === 'feature'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Feature Access
                  </button>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Theme</label>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </button>
              </div>

              {/* Show Nudge Button */}
              <div>
                <label className="block text-sm font-medium mb-2">Actions</label>
                <button
                  onClick={() => setShowNudge(true)}
                  className="px-6 py-3 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  Show Upgrade Nudge
                </button>
              </div>
            </div>
          )}

          {/* PricingTable Component */}
          {activeComponent === 'pricing' && (
            <div className="bg-card rounded-lg border p-6">
              <PricingTable
                title="Choose Your Plan"
                description="Select the perfect plan for your needs. All plans include a 30-day money-back guarantee."
                showIntervalToggle={true}
                defaultInterval="month"
                theme={theme}
                onSelectPlan={(priceId) => {
                  console.log('Selected plan:', priceId)
                  alert(`Selected plan: ${priceId}`)
                }}
              />
            </div>
          )}

          {/* UpgradeNudge Component */}
          {activeComponent === 'nudge' && showNudge && (
            <UpgradeNudge
              trigger={getNudgeTrigger()}
              style={nudgeStyle}
              autoDismiss={nudgeStyle === 'toast' ? 10000 : 0}
              onUpgrade={() => {
                console.log('Upgrade clicked! Redirecting to:', getNudgeTrigger().suggestedPlan)
                setShowNudge(false)
                alert(`Upgrade to ${getNudgeTrigger().suggestedPlan.name} - Price ID: ${getNudgeTrigger().suggestedPlan.priceId}`)
              }}
              onDismiss={() => {
                console.log('Nudge dismissed')
                setShowNudge(false)
              }}
              theme={theme}
            />
          )}

          {/* UpgradeNudge Info */}
          {activeComponent === 'nudge' && !showNudge && (
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Nudge Preview Info</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Style:</strong> {nudgeStyle}</p>
                <p><strong>Scenario:</strong> {nudgeScenario}</p>
                <p><strong>Title:</strong> {getNudgeTrigger().message.title}</p>
                <p><strong>Body:</strong> {getNudgeTrigger().message.body}</p>
                <p><strong>CTA:</strong> {getNudgeTrigger().message.cta}</p>
                <p><strong>Suggested Plan:</strong> {getNudgeTrigger().suggestedPlan.name} - ${(getNudgeTrigger().suggestedPlan.price.amount / 100).toFixed(2)}/{getNudgeTrigger().suggestedPlan.price.interval}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </BillingOSProvider>
  )
}

export default App
