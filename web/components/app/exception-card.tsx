'use client'

import { useState } from 'react'
import { AlertTriangle, Sparkles, Check, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/patina/status-pill'
import { cn } from '@/lib/utils'
import type { Exception } from '@/lib/data'

export function ExceptionCard({ exception }: { exception: Exception }) {
  const [decision, setDecision] = useState<'approved' | 'override' | null>(null)

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5',
        exception.severity === 'flagged'
          ? 'border-danger/30'
          : 'border-warning/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
              exception.severity === 'flagged'
                ? 'bg-danger/10 text-danger'
                : 'bg-warning/10 text-warning',
            )}
          >
            <AlertTriangle className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              {exception.field}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {exception.reasoning}
            </p>
          </div>
        </div>
        <StatusPill status={exception.severity} />
      </div>

      {exception.memory && (
        <div className="mt-4 rounded-lg border border-verdigris/25 bg-verdigris-soft p-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-verdigris" />
            <p className="text-sm font-medium text-verdigris-deep">
              Memory suggestion · {exception.memory.summary}
            </p>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-verdigris-deep/80">
            {exception.memory.detail}
          </p>
          <p className="mt-2 text-xs font-medium text-verdigris">
            Seen {exception.memory.seenCount}× previously
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {decision ? (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-medium',
              decision === 'approved' ? 'text-success' : 'text-info',
            )}
          >
            <Check className="size-4" />
            {decision === 'approved'
              ? 'Approved — saved to memory'
              : 'Overridden — saved to memory'}
          </span>
        ) : (
          <>
            <Button
              size="sm"
              className="bg-verdigris text-primary-foreground hover:bg-verdigris/90"
              onClick={() => setDecision('approved')}
            >
              <Check />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDecision('override')}
            >
              <PenLine />
              Override
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
