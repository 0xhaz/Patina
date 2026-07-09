'use client'

import { useState } from 'react'
import {
  FileText,
  AlertTriangle,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  memoryItems,
  memoryTypeLabel,
  type MemoryItem,
  type MemoryType,
} from '@/lib/data'

const typeIcon: Record<MemoryType, typeof FileText> = {
  format: FileText,
  exception: AlertTriangle,
  entity: Building2,
}

const stateMeta = {
  reinforced: { label: 'Reinforced', icon: TrendingUp, className: 'text-verdigris' },
  stable: { label: 'Stable', icon: Minus, className: 'text-muted-foreground' },
  decaying: { label: 'Decaying', icon: TrendingDown, className: 'text-tertiary' },
} as const

function RelevanceBar({ value }: { value: number }) {
  // Stronger relevance = full verdigris; fading items render dimmer (decay visual).
  const opacity = Math.max(0.3, value / 100)
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className="h-full rounded-full bg-verdigris transition-all"
        style={{ width: `${value}%`, opacity }}
      />
    </div>
  )
}

function MemoryRow({
  item,
  active,
  onSelect,
}: {
  item: MemoryItem
  active: boolean
  onSelect: () => void
}) {
  const Icon = typeIcon[item.type]
  const decaying = item.state === 'decaying'
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-colors',
        active
          ? 'border-bronze bg-secondary/60'
          : 'border-border bg-card hover:border-bronze/40',
        decaying && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {item.title}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {item.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <RelevanceBar value={item.relevance} />
        <span className="w-9 shrink-0 text-right text-xs font-medium text-muted-foreground">
          {item.relevance}%
        </span>
      </div>
      <p className="text-xs text-tertiary">Last used {item.lastUsed}</p>
    </button>
  )
}

export function MemoryExplorer({ items }: { items?: MemoryItem[] }) {
  const data = items && items.length ? items : memoryItems
  const [selectedId, setSelectedId] = useState<string>(data[0].id)
  const selected = data.find((m) => m.id === selectedId) ?? data[0]
  const types: MemoryType[] = ['format', 'exception', 'entity']

  const StateIcon = stateMeta[selected.state].icon
  const SelectedIcon = typeIcon[selected.type]

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-7">
        {types.map((type) => {
          const items = data.filter((m) => m.type === type)
          const TypeIcon = typeIcon[type]
          return (
            <section key={type}>
              <div className="mb-3 flex items-center gap-2">
                <TypeIcon className="size-4 text-bronze" />
                <h2 className="text-sm font-medium text-foreground">
                  {memoryTypeLabel[type]}
                </h2>
                <span className="text-xs text-tertiary">
                  {items.length} item{items.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <MemoryRow
                    key={item.id}
                    item={item}
                    active={selected.id === item.id}
                    onSelect={() => setSelectedId(item.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* detail panel */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-bronze">
              <SelectedIcon className="size-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-tertiary">
                {memoryTypeLabel[selected.type]}
              </p>
              <p className="text-sm font-medium text-foreground">
                {selected.title}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {selected.description}
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Relevance strength</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-medium',
                  stateMeta[selected.state].className,
                )}
              >
                <StateIcon className="size-3.5" />
                {stateMeta[selected.state].label}
              </span>
            </div>
            <div className="mt-2">
              <RelevanceBar value={selected.relevance} />
            </div>
          </div>

          <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                <History className="size-3.5" />
                Times recalled
              </dt>
              <dd className="font-medium text-foreground">
                {selected.recalled}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" />
                Last used
              </dt>
              <dd className="font-medium text-foreground">
                {selected.lastUsed}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">First learned</dt>
              <dd className="font-medium text-foreground">{selected.learned}</dd>
            </div>
          </dl>

          {selected.state === 'decaying' && (
            <p className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
              This memory is fading — it hasn&apos;t been recalled recently. If
              it isn&apos;t reinforced by a matching case, its relevance will
              continue to decay until it&apos;s forgotten.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
