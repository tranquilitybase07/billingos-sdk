import { useState } from 'react'
import { BillingOSProvider } from '../../src/providers/BillingOSProvider'
import { PricingTable } from '../../src/components/PricingTable'
import { CustomerPortal } from '../../src/components/CustomerPortal'
import { UpgradeNudge } from '../../src/components/UpgradeNudge'
import { FeatureGate } from '../../src/components/FeatureGate'
import { UsageDisplay } from '../../src/components/UsageDisplay'

const TABS = ['pricing', 'portal', 'upgrade-nudge', 'feature-gate', 'usage'] as const
type Tab = (typeof TABS)[number]

export default function App() {
  const [tab, setTab] = useState<Tab>('pricing')
  const [compactPricing, setCompactPricing] = useState(false)
  const token = import.meta.env.VITE_SESSION_TOKEN as string | undefined
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

  return (
    <BillingOSProvider sessionToken={token} apiUrl={apiUrl} appUrl='http://localhost:3000'>
      <div style={{ fontFamily: 'sans-serif', padding: '1rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
          BillingOS SDK Playground
        </h1>

        {!token && (
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #d97706',
              borderRadius: 6,
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: 13,
            }}
          >
            No <code>VITE_SESSION_TOKEN</code> set in{' '}
            <code>playground/.env.local</code>. Components will render but API
            calls will fail.
          </div>
        )}

        <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: tab === t ? '#1d4ed8' : '#fff',
                color: tab === t ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
              }}
            >
              {t}
            </button>
          ))}
        </nav>

        <div>
          {tab === 'pricing' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <label style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={compactPricing}
                    onChange={(e) => setCompactPricing(e.target.checked)}
                  />
                  compact mode
                </label>
              </div>
              <PricingTable theme='dark' useCheckoutModal compact={compactPricing} />
            </>
          )}
          {tab === 'portal' && <CustomerPortal />}
          {tab === 'upgrade-nudge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <UpgradeNudge featureKey="advanced-analytics" />
              <UpgradeNudge featureKey="team-seats" variant="banner" />
            </div>
          )}
          {tab === 'feature-gate' && (
            <FeatureGate featureKey="advanced-analytics">
              <div
                style={{
                  padding: '1rem',
                  background: '#dcfce7',
                  borderRadius: 6,
                }}
              >
                Feature is enabled — this content is visible.
              </div>
            </FeatureGate>
          )}
          {tab === 'usage' && <UsageDisplay meterId="api-calls" />}
        </div>
      </div>
    </BillingOSProvider>
  )
}
