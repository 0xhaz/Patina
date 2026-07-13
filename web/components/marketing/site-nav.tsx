import Link from 'next/link'
import { Logo } from '@/components/patina/logo'
import { ThemeToggle } from '@/components/patina/theme-toggle'
import { Button } from '@/components/ui/button'

const links = [
  { label: 'Product', href: '#how' },
  { label: 'How it works', href: '#how' },
  { label: 'Memory', href: '#memory' },
  { label: 'GitHub', href: 'https://github.com/0xhaz/Patina' },
]

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" aria-label="Patina home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...(l.href.startsWith('http')
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard">Sign in</Link>}
          />
          <Button
            size="sm"
            nativeButton={false}
            className="bg-bronze text-primary-foreground hover:bg-bronze-hover"
            render={<Link href="/dashboard">Request a demo</Link>}
          />
        </div>
      </div>
    </header>
  )
}
