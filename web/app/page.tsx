import { SiteNav } from '@/components/marketing/site-nav'
import { Hero } from '@/components/marketing/hero'
import { Problem } from '@/components/marketing/problem'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Differentiator } from '@/components/marketing/differentiator'
import { CrossBorder } from '@/components/marketing/cross-border'
import { Closing } from '@/components/marketing/closing'

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background">
      <SiteNav />
      <Hero />
      <Problem />
      <HowItWorks />
      <Differentiator />
      <CrossBorder />
      <Closing />
    </main>
  )
}
