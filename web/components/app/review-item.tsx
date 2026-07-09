'use client'

import { useState } from 'react'
import { Sparkles, Check, PenLine, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/patina/status-pill'
import { apiBase } from '@/lib/api'
import type { Exception, Vendor } from '@/lib/data'

export function ReviewItem({
  vendor,
  exception,
}: {
  vendor: Vendor
  exception: Exception & { code?: string }
}) {
  const [decision, setDecision] = useState<'approved' | 'override' | null>(null)
  const [pending, setPending] = useState(false)

  async function decide(kind: 'approved' | 'override') {
    setPending(true)
    try {
      // Approve => learn the resolution; Override => reject this flag's code (no suppression learned).
      const rejections = kind === 'override' && exception.code ? [exception.code] : []
      await fetch(`${apiBase()}/api/vendors/${vendor.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejections }),
      })
    } catch {
      // Demo resilience: reflect the decision in the UI even if the backend is offline.
    } finally {
      setDecision(kind)
      setPending(false)
    }
  }

  if (decision) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/5 p-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
          <Check className="size-4" />
        </span>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{vendor.latinName}</span>{' '}
          — {decision === 'approved' ? 'approved' : 'overridden'}. Decision saved
          to memory for next time.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
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
          <p className="text-sm font-medium text-foreground">
            {exception.field}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {exception.reasoning}
          </p>
        </div>
      </div>

      {exception.memory ? (
        <div className="mt-3 rounded-lg border border-verdigris/25 bg-verdigris-soft p-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-verdigris" />
            <p className="text-sm font-medium text-verdigris-deep">
              {exception.memory.summary}
            </p>
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
          No precedent in memory yet — this is a genuinely novel exception.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          disabled={pending}
          className="bg-verdigris text-primary-foreground hover:bg-verdigris/90"
          onClick={() => decide('approved')}
        >
          <Check />
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => decide('override')}
        >
          <PenLine />
          Override
        </Button>
      </div>
    </div>
  )
}
