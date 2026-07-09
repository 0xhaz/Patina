'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  GitBranch,
  Inbox,
  Brain,
  Sparkles,
} from 'lucide-react'
import { Logo } from '@/components/patina/logo'
import { ThemeToggle } from '@/components/patina/theme-toggle'
import { cn } from '@/lib/utils'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Vendor intake', href: '/dashboard/intake', icon: Upload },
  { label: 'Pipeline', href: '/dashboard/pipeline', icon: GitBranch },
  { label: 'Review queue', href: '/dashboard/review', icon: Inbox, count: 3 },
]

const advanced = [
  { label: 'Memory explorer', href: '/dashboard/memory', icon: Brain },
]

export function Sidebar() {
  const pathname = usePathname()

  const renderItem = (item: {
    label: string
    href: string
    icon: typeof Brain
    count?: number
  }) => {
    const active =
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href))
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-bronze text-primary-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
        )}
      >
        <Icon className="size-4" />
        <span className="flex-1">{item.label}</span>
        {item.count ? (
          <span
            className={cn(
              'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
              active
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-warning/15 text-warning',
            )}
          >
            {item.count}
          </span>
        ) : null}
      </Link>
    )
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
        <Link href="/dashboard" aria-label="Patina home">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {nav.map(renderItem)}

        <div className="mt-5 px-3">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-tertiary">
            <Sparkles className="size-3" />
            Advanced
          </span>
        </div>
        <div className="mt-1 flex flex-col gap-1">{advanced.map(renderItem)}</div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <div className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
            OM
          </div>
          <div className="leading-tight">
            <p className="text-xs font-medium text-foreground">Ops Mariko</p>
            <p className="text-xs text-tertiary">Procurement</p>
          </div>
        </Link>
      </div>
    </aside>
  )
}
