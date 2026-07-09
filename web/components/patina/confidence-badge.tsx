import { cn } from '@/lib/utils'
import type { Confidence } from '@/lib/data'

const styles: Record<Confidence, { dot: string; text: string; label: string }> =
  {
    high: { dot: 'bg-success', text: 'text-success', label: 'High' },
    medium: { dot: 'bg-warning', text: 'text-warning', label: 'Medium' },
    low: { dot: 'bg-danger', text: 'text-danger', label: 'Low' },
  }

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: Confidence
  className?: string
}) {
  const s = styles[confidence]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        s.text,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}
