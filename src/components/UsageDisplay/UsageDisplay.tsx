import { useUsageMetrics } from '../../hooks/useFeature'

export interface UsageDisplayProps {
  /**
   * Optional feature key to show usage for specific feature
   */
  featureKey?: string

  /**
   * Custom title
   */
  title?: string

  /**
   * Whether to show a progress bar
   */
  showProgress?: boolean

  /**
   * Whether to show reset timer
   */
  showResetTimer?: boolean

  /**
   * Custom className for styling
   */
  className?: string
}

/**
 * Component to display usage metrics for features
 *
 * @example
 * ```tsx
 * // Show all usage metrics
 * <UsageDisplay />
 *
 * // Show specific feature usage
 * <UsageDisplay featureKey="api_calls" />
 * ```
 */
export function UsageDisplay({
  featureKey,
  title = 'Usage Metrics',
  showProgress = true,
  showResetTimer = true,
  className = '',
}: UsageDisplayProps) {
  const { data, isLoading, isError } = useUsageMetrics(featureKey)

  if (isLoading) {
    return (
      <div className={`p-4 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (isError || !data?.metrics || data.metrics.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        No usage data available
      </div>
    )
  }

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {data.metrics.map((metric) => (
          <UsageMetricCard
            key={metric.feature_key}
            metric={metric}
            showProgress={showProgress}
            showResetTimer={showResetTimer}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual usage metric card
 */
function UsageMetricCard({
  metric,
  showProgress,
  showResetTimer,
}: {
  metric: any
  showProgress: boolean
  showResetTimer: boolean
}) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{metric.feature_title}</h4>
          <p className="text-sm text-gray-500">{metric.product_name}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">
            {metric.consumed.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            of {metric.limit.toLocaleString()}
          </div>
        </div>
      </div>

      {showProgress && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(
                metric.percentage_used
              )}`}
              style={{ width: `${Math.min(100, metric.percentage_used)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {metric.percentage_used}% used
            </span>
            <span className="text-xs text-gray-500">
              {metric.remaining.toLocaleString()} remaining
            </span>
          </div>
        </div>
      )}

      {showResetTimer && metric.resets_in_days > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <svg
            className="inline-block w-3 h-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Resets in {metric.resets_in_days} day{metric.resets_in_days !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

/**
 * Compact usage display for inline use
 */
export function CompactUsageDisplay({
  featureKey,
  className = '',
}: {
  featureKey: string
  className?: string
}) {
  const { data, isLoading } = useUsageMetrics(featureKey)

  if (isLoading || !data?.metrics?.[0]) {
    return null
  }

  const metric = data.metrics[0]
  const getColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-500">Usage:</span>
      <span className={`text-sm font-medium ${getColor(metric.percentage_used)}`}>
        {metric.consumed.toLocaleString()} / {metric.limit.toLocaleString()}
      </span>
      {metric.percentage_used >= 90 && (
        <svg
          className="w-4 h-4 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  )
}