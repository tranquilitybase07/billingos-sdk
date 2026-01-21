import { Progress } from '../../ui/progress'
import { cn } from '@/utils/cn'
import type { PortalUsageInfo } from '../../../client/types'

interface UsageBarProps {
  title: string
  usage: PortalUsageInfo
  unit?: string
  className?: string
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString()
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'bg-destructive'
  if (percentage >= 75) return 'bg-yellow-500'
  return 'bg-primary'
}

export function UsageBar({ title, usage, unit, className }: UsageBarProps) {
  const { consumed, limit, percentage, resetDate } = usage

  const formattedConsumed = formatNumber(consumed)
  const formattedLimit = formatNumber(limit)
  const progressColor = getProgressColor(percentage)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">
          {formattedConsumed} / {formattedLimit} {unit && `(${unit})`}
        </span>
      </div>
      <Progress
        value={percentage}
        max={100}
        className="h-2"
        indicatorClassName={progressColor}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{Math.round(percentage)}% used</span>
        {resetDate && (
          <span>
            Resets: {new Date(resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}
