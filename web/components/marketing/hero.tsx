import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductVisual } from '@/components/marketing/product-visual'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-10 lg:py-24">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-verdigris/25 bg-verdigris-soft px-3 py-1 text-xs font-medium text-verdigris-deep">
            <span className="size-1.5 rounded-full bg-verdigris" />
            Onboarding that gets sharper every time
          </span>
          <h1 className="mt-5 text-pretty text-4xl font-medium leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            Vendor onboarding that gets sharper every time.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Patina reads, validates, and onboards supplier documents — and
            improves with every one, so your team only reviews what genuinely
            needs a human.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              className="bg-bronze text-primary-foreground hover:bg-bronze-hover"
              render={<Link href="/dashboard">Request a demo</Link>}
            />
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={
                <a href="#how">
                  See how it works
                  <ArrowRight />
                </a>
              }
            />
          </div>
          <p className="mt-5 text-sm text-tertiary">
            Built for cross-border onboarding — reads documents in any language.
          </p>
        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-3xl bg-verdigris-soft/60 blur-2xl"
          />
          <ProductVisual />
        </div>
      </div>
    </section>
  )
}
