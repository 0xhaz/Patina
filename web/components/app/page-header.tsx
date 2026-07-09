import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
      <div className="min-w-0">
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
