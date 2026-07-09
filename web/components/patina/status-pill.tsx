import { CheckCircle2, CircleAlert, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { statusLabel, type VendorStatus } from '@/lib/data'

const styles: Record<VendorStatus, string> = {
  'auto-approved': 'bg-success/10 text-success border-success/20',
  'needs-review': 'bg-warning/10 text-warning border-warning/25',
  flagged: 'bg-danger/10 text-danger border-danger/25',
}

const icons: Record<VendorStatus, typeof CheckCircle2> = {
  'auto-approved': CheckCircle2,
  'needs-review': CircleAlert,
  flagged: Flag,
}

export function StatusPill({
  status,
  className,
}: {
  status: VendorStatus
  className?: string
}) {
  const Icon = icons[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[status],
        className,
      )}
    >
      <Icon className="size-3" />
      {statusLabel[status]}
    </span>
  )
}
