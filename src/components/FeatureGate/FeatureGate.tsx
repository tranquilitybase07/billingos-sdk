import React from 'react'
import { useFeatureGate } from '../../hooks/useFeature'

export interface FeatureGateProps {
  /**
   * The feature key to check access for
   */
  feature: string

  /**
   * Content to render when user has access
   */
  children: React.ReactNode

  /**
   * Content to render when access is denied (optional)
   */
  fallback?: React.ReactNode

  /**
   * Content to render while loading (optional)
   */
  loading?: React.ReactNode

  /**
   * Callback when access is denied
   */
  onAccessDenied?: () => void

  /**
   * Callback when quota is exceeded
   */
  onQuotaExceeded?: (usage: number, limit: number) => void

  /**
   * Whether to show remaining usage in a badge
   */
  showUsageBadge?: boolean
}

/**
 * FeatureGate component for conditional rendering based on feature access
 *
 * @example
 * ```tsx
 * <FeatureGate
 *   feature="advanced_analytics"
 *   fallback={<UpgradePrompt feature="Advanced Analytics" />}
 * >
 *   <AdvancedAnalyticsDashboard />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  loading,
  onAccessDenied,
  onQuotaExceeded,
  showUsageBadge = false,
}: FeatureGateProps) {
  const {
    hasAccess,
    isLoading,
    isError,
    usage,
    limit,
    remaining,
  } = useFeatureGate(feature, {
    onAccessDenied,
    onQuotaExceeded,
  })

  if (isLoading) {
    return <>{loading || <FeatureGateLoading />}</>
  }

  if (isError || !hasAccess) {
    return <>{fallback || <FeatureGateDenied feature={feature} />}</>
  }

  // If user has access and usage badge is requested, wrap with usage indicator
  if (showUsageBadge && limit > 0) {
    return (
      <div className="relative">
        {children}
        <UsageBadge usage={usage} limit={limit} remaining={remaining} />
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Default loading component
 */
function FeatureGateLoading() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-pulse text-gray-400">
        Checking access...
      </div>
    </div>
  )
}

/**
 * Default access denied component
 */
function FeatureGateDenied({ feature }: { feature: string }) {
  return (
    <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Feature Locked
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Upgrade your plan to access {feature.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  )
}

/**
 * Usage badge component
 */
function UsageBadge({
  usage,
  limit,
  remaining,
}: {
  usage: number
  limit: number
  remaining: number
}) {
  const percentage = Math.min(100, Math.round((usage / limit) * 100))

  // Determine color based on usage
  let colorClass = 'bg-green-100 text-green-800'
  if (percentage >= 90) {
    colorClass = 'bg-red-100 text-red-800'
  } else if (percentage >= 75) {
    colorClass = 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {remaining.toLocaleString()} / {limit.toLocaleString()} remaining
    </div>
  )
}