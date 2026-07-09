'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Upload, GitBranch, Inbox, Brain } from 'lucide-react'
import { Logo } from '@/components/patina/logo'
import { ThemeToggle } from '@/components/patina/theme-toggle'
import { cn } from '@/lib/utils'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Intake', href: '/dashboard/intake', icon: Upload },
  { label: 'Pipeline', href: '/dashboard/pipeline', icon: GitBranch },
  { label: 'Review', href: '/dashboard/review', icon: Inbox },
  { label: 'Memory', href: '/dashboard/memory', icon: Brain },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <div className="md:hidden">
      <div className="flex h-14 items-center justify-between border-b border-border bg-sidebar px-4">
        <Link href="/dashboard" aria-label="Patina home">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-border bg-background px-3 py-2">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-bronze text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
