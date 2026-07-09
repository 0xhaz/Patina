import { TrendingDown, TrendingUp } from 'lucide-react'
import { Sparkline } from '@/components/patina/sparkline'
import { cn } from '@/lib/utils'

type Metric = {
  label: string
  value: string
  trend: 'up' | 'down'
  delta: string
  series: number[]
  accent: 'good' | 'neutral'
}

export function MetricCard({ metric }: { metric: Metric }) {
  // "good" = the learning signal (verdigris). Down-trending touches/flags/time are good.
  const isLearning = metric.accent === 'good'
  const color = isLearning ? 'var(--verdigris)' : 'var(--bronze)'
  const TrendIcon = metric.trend === 'down' ? TrendingDown : TrendingUp

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{metric.label}</p>
        <Sparkline data={metric.series} color={color} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-medium tracking-tight text-foreground">
          {metric.value}
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            isLearning ? 'text-verdigris' : 'text-muted-foreground',
          )}
        >
          <TrendIcon className="size-3.5" />
          {metric.delta}
        </span>
      </div>
    </div>
  )
}
