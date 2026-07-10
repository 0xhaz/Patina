import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { MetricCard } from '@/components/app/metric-card'
import { StatusPill } from '@/components/patina/status-pill'
import { Button } from '@/components/ui/button'
import { getMetrics, getVendors } from '@/lib/api'

export default async function DashboardPage() {
  const [dashboardMetrics, vendors] = await Promise.all([getMetrics(), getVendors()])
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Onboarding that gets sharper every time. The numbers that fall are the point — the agent is learning."
        action={
          <Button
            nativeButton={false}
            className="bg-bronze text-primary-foreground hover:bg-bronze-hover"
            render={<Link href="/dashboard/intake">New vendor</Link>}
          />
        }
      />

      <div className="p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardMetrics.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-verdigris/25 bg-verdigris-soft p-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-verdigris" />
          <p className="text-sm leading-relaxed text-verdigris-deep">
            <span className="font-medium">Memory is paying off.</span> Human
            touches per vendor are down 38% this quarter as Patina recognizes
            more document formats and recalls how past exceptions were resolved.
          </p>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">
              Recent activity
            </h2>
            <Link
              href="/dashboard/review"
              className="inline-flex items-center gap-1 text-sm text-bronze hover:text-bronze-hover"
            >
              View review queue
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
            {vendors.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No vendors onboarded yet. Go to{' '}
                <span className="font-medium text-foreground">Vendor intake</span> to upload a packet.
              </p>
            )}
            <ul className="divide-y divide-border">
              {vendors.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/50"
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {v.flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {v.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {v.latinName} · {v.docFormat}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">
                      {v.humanTouches === 0
                        ? 'No human touches'
                        : `${v.humanTouches} human touch${
                            v.humanTouches > 1 ? 'es' : ''
                          }`}
                    </p>
                    <p className="text-xs text-tertiary">{v.submitted}</p>
                  </div>
                  <StatusPill status={v.status} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
