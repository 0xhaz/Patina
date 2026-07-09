import { cn } from '@/lib/utils'

export function Logo({
  className,
  showWord = true,
}: {
  className?: string
  showWord?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="relative inline-flex size-6 items-center justify-center rounded-md bg-bronze"
      >
        <span className="absolute inset-0 rounded-md bg-verdigris opacity-60 [clip-path:polygon(0_55%,100%_25%,100%_100%,0_100%)]" />
        <span className="relative size-2 rounded-full bg-primary-foreground" />
      </span>
      {showWord && (
        <span className="text-[0.95rem] font-medium tracking-tight text-foreground">
          Patina
        </span>
      )}
    </span>
  )
}
