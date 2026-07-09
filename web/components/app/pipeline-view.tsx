'use client'

import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import { PipelineStepper } from '@/components/app/pipeline-stepper'
import { FieldTable } from '@/components/app/field-table'
import { ExceptionCard } from '@/components/app/exception-card'
import { StatusPill } from '@/components/patina/status-pill'
import { cn } from '@/lib/utils'
import {
  firstPassExceptions,
  firstPassFields,
  secondPassFields,
  secondPassMemory,
} from '@/lib/data'

type Pass = 'first' | 'second'

const vendorMeta: Record<
  Pass,
  { name: string; latin: string; flag: string; format: string }
> = {
  first: {
    name: '上海精密机械有限公司',
    latin: 'Shanghai Precision Machinery',
    flag: '🇨🇳',
    format: 'Chinese business license · 营业执照',
  },
  second: {
    name: '深圳華強電子有限公司',
    latin: 'Shenzhen Huaqiang Electronics',
    flag: '🇨🇳',
    format: 'Chinese business license · 营业执照',
  },
}

export function PipelineView() {
  const [pass, setPass] = useState<Pass>('first')
  const meta = vendorMeta[pass]
  const isFirst = pass === 'first'

  return (
    <div className="flex flex-col gap-6">
      {/* demo toggle — the "it learned" moment, surfaced inside the pipeline */}
      <div className="rounded-xl border border-verdigris/25 bg-verdigris-soft p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-verdigris" />
            <div>
              <p className="text-sm font-medium text-verdigris-deep">
                Watch the memory compound
              </p>
              <p className="text-sm leading-relaxed text-verdigris-deep/80">
                Same document format, two vendors. Toggle to see how the agent
                improves after learning the layout.
              </p>
            </div>
          </div>
          <div className="inline-flex shrink-0 rounded-lg border border-verdigris/30 bg-card p-1">
            <button
              type="button"
              onClick={() => setPass('first')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                isFirst
                  ? 'bg-bronze text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Vendor #1 — first time
            </button>
            <button
              type="button"
              onClick={() => setPass('second')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                !isFirst
                  ? 'bg-verdigris text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Vendor #2 — recognized
            </button>
          </div>
        </div>
      </div>

      {/* vendor header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none" aria-hidden>
            {meta.flag}
          </span>
          <div>
            <p className="text-base font-medium text-foreground">{meta.name}</p>
            <p className="text-sm text-muted-foreground">
              {meta.latin} · {meta.format}
            </p>
          </div>
        </div>
        <StatusPill status={isFirst ? 'flagged' : 'auto-approved'} />
      </div>

      {/* stepper */}
      <div className="rounded-xl border border-border bg-card p-5">
        <PipelineStepper activeIndex={isFirst ? 5 : 6} />
      </div>

      {/* recognized callout for second pass */}
      {!isFirst && (
        <div className="flex items-start gap-2.5 rounded-xl border border-verdigris/30 bg-verdigris-soft p-4">
          <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-verdigris text-primary-foreground">
            <Check className="size-3" />
          </span>
          <div>
            <p className="text-sm font-medium text-verdigris-deep">
              {secondPassMemory.summary}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-verdigris-deep/80">
              {secondPassMemory.detail}
            </p>
          </div>
        </div>
      )}

      {/* extracted fields */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">
            Extracted fields
          </h2>
          <p className="text-xs text-tertiary">
            {isFirst
              ? '2 fields below threshold'
              : 'All fields above threshold'}
          </p>
        </div>
        <FieldTable fields={isFirst ? firstPassFields : secondPassFields} />
      </div>

      {/* exceptions */}
      <div>
        <h2 className="mb-3 text-base font-medium text-foreground">
          {isFirst ? 'Exceptions to resolve' : 'Exceptions'}
        </h2>
        {isFirst ? (
          <div className="flex flex-col gap-3">
            {firstPassExceptions.map((e) => (
              <ExceptionCard key={e.id} exception={e} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-success/25 bg-success/5 p-5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
              <Check className="size-4" />
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                No exceptions.
              </span>{' '}
              The format was recognized from memory and every field cleared
              validation — onboarded in one pass, no human needed.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
