import type { ReactNode } from 'react'
import { Sidebar } from '@/components/app/sidebar'
import { MobileNav } from '@/components/app/mobile-nav'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
