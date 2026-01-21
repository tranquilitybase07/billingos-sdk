import { cn } from '@/utils/cn'
import type { PortalFeatureWithUsage } from '../../../client/types'

interface FeatureListProps {
  features: PortalFeatureWithUsage[]
  className?: string
}

function CheckIcon({ className }: { className?: string }) {
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function FeatureList({ features, className }: FeatureListProps) {
  // Filter to only show boolean features that are enabled
  const booleanFeatures = features.filter(
    (f) => f.type === 'boolean_flag' && f.enabled
  )

  if (booleanFeatures.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium text-muted-foreground">Included Features</h4>
      <ul className="space-y-1.5">
        {booleanFeatures.map((feature) => (
          <li key={feature.id} className="flex items-center gap-2 text-sm">
            <CheckIcon className="text-green-500" />
            <span>{feature.title}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
