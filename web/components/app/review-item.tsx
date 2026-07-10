import Link from 'next/link'
import { Sparkles, AlertTriangle, ArrowRight } from 'lucide-react'
import { StatusPill } from '@/components/patina/status-pill'
import type { Exception, Vendor } from '@/lib/data'

// A triage-list row: it summarizes the exception and links into the vendor's
// Pipeline run, which is the single place to inspect and Approve/Override.
export function ReviewItem({
  vendor,
  exception,
}: {
  vendor: Vendor
  exception: Exception & { code?: string }
}) {
  return (
    <Link
      href={`/dashboard/pipeline?vendor=${encodeURIComponent(vendor.id)}`}
      className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-bronze/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none" aria-hidden>
            {vendor.flag}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{vendor.name}</p>
            <p className="text-xs text-muted-foreground">
              {vendor.latinName} · {vendor.docFormat}
            </p>
          </div>
        </div>
        <StatusPill status={exception.severity} />
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-secondary/60 p-3.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-medium text-foreground">{exception.field}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {exception.reasoning}
          </p>
        </div>
      </div>

      {exception.memory ? (
        <div className="mt-3 rounded-lg border border-verdigris/25 bg-verdigris-soft p-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-verdigris" />
            <p className="text-sm font-medium text-verdigris-deep">{exception.memory.summary}</p>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-verdigris-deep/80">
            {exception.memory.detail}
          </p>
          <p className="mt-2 text-xs font-medium text-verdigris">
            Seen {exception.memory.seenCount}× previously
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs font-medium text-tertiary">
          No precedent in memory yet — a genuinely novel exception.
        </p>
      )}

      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-bronze">
        Review in pipeline
        <ArrowRight className="size-3.5" />
      </div>
    </Link>
  )
}
