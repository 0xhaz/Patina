import { Check, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Row = { label: string; value: string; confidence: 'high' | 'medium' }

const rows: Row[] = [
  { label: 'Legal entity name', value: '深圳華強電子有限公司', confidence: 'high' },
  { label: 'Unified social credit code', value: '91440300MA5DA2X41B', confidence: 'high' },
  { label: 'Registered capital', value: 'RMB 10,000,000', confidence: 'high' },
  { label: 'Bank account holder', value: 'Shenzhen Huaqiang Electronics', confidence: 'high' },
]

export function ProductVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5',
        className,
      )}
    >
      {/* doc header */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-bronze">
            <FileText className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">营业执照.pdf</p>
            <p className="text-xs text-muted-foreground">
              Chinese business license
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
          <Check className="size-3" />
          Auto-approved
        </span>
      </div>

      {/* extracted fields */}
      <div className="mt-3 flex flex-col gap-0.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm"
          >
            <span className="text-muted-foreground">{r.label}</span>
            <span className="flex items-center gap-2">
              <span className="max-w-[14rem] truncate font-medium text-foreground">
                {r.value}
              </span>
              <span className="size-1.5 rounded-full bg-success" />
            </span>
          </div>
        ))}
      </div>

      {/* memory callout */}
      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-verdigris/25 bg-verdigris-soft p-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-verdigris" />
        <p className="text-sm font-medium text-verdigris-deep">
          Recognized from memory — onboarded in one pass.
        </p>
      </div>
    </div>
  )
}
