import { useProducts } from '../../hooks/useProducts'

export interface UpgradePromptProps {
  /**
   * Feature that requires upgrade
   */
  feature?: string

  /**
   * Title text
   */
  title?: string

  /**
   * Description text
   */
  description?: string

  /**
   * Whether it's a quota exceeded prompt
   */
  isQuotaExceeded?: boolean

  /**
   * Current usage (for quota exceeded)
   */
  usage?: number

  /**
   * Usage limit (for quota exceeded)
   */
  limit?: number

  /**
   * Custom className for styling
   */
  className?: string

  /**
   * Click handler for upgrade button
   */
  onUpgradeClick?: () => void
}

/**
 * Component that prompts users to upgrade when they hit limits or access denied features
 *
 * @example
 * ```tsx
 * <UpgradePrompt
 *   feature="Advanced Analytics"
 *   description="Upgrade to Pro to access advanced analytics and reporting"
 * />
 * ```
 */
export function UpgradePrompt({
  feature,
  title = 'Upgrade Required',
  description,
  isQuotaExceeded = false,
  usage,
  limit,
  className = '',
  onUpgradeClick,
}: UpgradePromptProps) {
  const { data: productsData } = useProducts()

  const defaultDescription = isQuotaExceeded
    ? `You've reached your usage limit${feature ? ` for ${feature}` : ''}. Upgrade your plan to continue.`
    : `Upgrade your plan to access${feature ? ` ${feature}` : ' this feature'}.`

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick()
    } else {
      // Scroll to pricing table if it exists
      const pricingTable = document.querySelector('[data-pricing-table]')
      if (pricingTable) {
        pricingTable.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  return (
    <div className={`rounded-lg border-2 border-dashed border-gray-300 p-8 ${className}`}>
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-600">
          {description || defaultDescription}
        </p>

        {/* Usage Info (if quota exceeded) */}
        {isQuotaExceeded && usage !== undefined && limit !== undefined && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1">
            <svg
              className="h-4 w-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-red-800">
              {usage.toLocaleString()} / {limit.toLocaleString()} used
            </span>
          </div>
        )}

        {/* Upgrade Button */}
        <div className="mt-6">
          <button
            onClick={handleUpgradeClick}
            className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            Upgrade Plan
          </button>
        </div>

        {/* Available Plans Preview */}
        {productsData?.products && productsData.products.length > 0 && (
          <div className="mt-6 text-xs text-gray-500">
            Available plans:
            <div className="mt-1 flex justify-center gap-2">
              {productsData.products.slice(0, 3).map((product) => (
                <span
                  key={product.id}
                  className="inline-block rounded-full bg-gray-100 px-2 py-1"
                >
                  {product.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Compact upgrade prompt for inline use
 */
export function CompactUpgradePrompt({
  feature,
  onUpgradeClick,
  className = '',
}: {
  feature?: string
  onUpgradeClick?: () => void
  className?: string
}) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-md bg-yellow-50 px-3 py-2 ${className}`}>
      <svg
        className="h-4 w-4 text-yellow-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-sm text-yellow-800">
        Upgrade to access{feature ? ` ${feature}` : ' this feature'}
      </span>
      <button
        onClick={onUpgradeClick}
        className="ml-1 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
      >
        Upgrade
      </button>
    </div>
  )
}