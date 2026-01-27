import * as React from 'react'
import { BannerNudge } from './BannerNudge'
import { ToastNudge } from './ToastNudge'
import { ModalNudge } from './ModalNudge'
import type { NudgeTrigger } from '../../client/types'

export interface UpgradeNudgeProps {
  /**
   * Nudge trigger data (from API or usage check)
   */
  trigger: NudgeTrigger

  /**
   * Display style
   * - 'banner': Top banner (non-intrusive)
   * - 'toast': Toast notification (bottom-right)
   * - 'modal': Modal dialog (more prominent)
   */
  style?: 'banner' | 'toast' | 'modal'

  /**
   * Auto-dismiss after N milliseconds (0 = no auto-dismiss)
   */
  autoDismiss?: number

  /**
   * Callback when user clicks upgrade
   */
  onUpgrade?: (priceId: string) => void

  /**
   * Callback when user dismisses nudge
   */
  onDismiss?: () => void

  /**
   * Optional: Custom theme
   */
  theme?: 'light' | 'dark'
}

// Store dismissal timestamp
function storeDismissal(trigger: NudgeTrigger): void {
  if (typeof window === 'undefined') return

  const dismissalKey = `nudge_dismissed_${trigger.type}_${trigger.feature || 'general'}`
  localStorage.setItem(dismissalKey, Date.now().toString())
}

export function UpgradeNudge({
  trigger,
  style = 'banner',
  autoDismiss = 0,
  onUpgrade,
  onDismiss,
  theme,
}: UpgradeNudgeProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  // Reset visibility when trigger changes (for demo purposes)
  React.useEffect(() => {
    setIsVisible(true)
  }, [trigger, style])

  // Auto-dismiss timer (autoDismiss is in milliseconds)
  React.useEffect(() => {
    if (autoDismiss > 0 && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoDismiss)

      return () => clearTimeout(timer)
    }
  }, [autoDismiss, isVisible])

  // Handle keyboard escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  const handleDismiss = () => {
    setIsVisible(false)
    storeDismissal(trigger)
    onDismiss?.()
  }

  const handleUpgrade = () => {
    onUpgrade?.(trigger.suggestedPlan.priceId)
  }

  if (!isVisible) return null

  switch (style) {
    case 'banner':
      return (
        <BannerNudge
          trigger={trigger}
          onUpgrade={handleUpgrade}
          onDismiss={handleDismiss}
          theme={theme}
        />
      )
    case 'toast':
      return (
        <ToastNudge
          trigger={trigger}
          onUpgrade={handleUpgrade}
          onDismiss={handleDismiss}
          theme={theme}
        />
      )
    case 'modal':
      return (
        <ModalNudge
          trigger={trigger}
          onUpgrade={handleUpgrade}
          onDismiss={handleDismiss}
          theme={theme}
        />
      )
    default:
      return null
  }
}
