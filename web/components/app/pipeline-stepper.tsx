import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pipelineStages } from '@/lib/data'

// activeIndex = stage currently in progress. Stages before are done; after are waiting.
export function PipelineStepper({ activeIndex }: { activeIndex: number }) {
  return (
    <ol className="flex flex-col gap-2 md:flex-row md:items-center md:gap-0">
      {pipelineStages.map((stage, i) => {
        const done = i < activeIndex
        const active = i === activeIndex
        return (
          <li key={stage} className="flex items-center gap-2 md:flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                  done && 'border-verdigris bg-verdigris text-primary-foreground',
                  active && 'border-bronze bg-bronze text-primary-foreground',
                  !done &&
                    !active &&
                    'border-border bg-card text-tertiary',
                )}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : active ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-xs font-medium',
                  done && 'text-foreground',
                  active && 'text-bronze',
                  !done && !active && 'text-tertiary',
                )}
              >
                {stage}
              </span>
            </div>
            {i < pipelineStages.length - 1 && (
              <span
                className={cn(
                  'mx-2 hidden h-px flex-1 md:block',
                  done ? 'bg-verdigris/50' : 'bg-border',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
