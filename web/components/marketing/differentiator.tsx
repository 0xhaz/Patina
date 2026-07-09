import { Flag, Check, Sparkles, ArrowRight } from 'lucide-react'

const memories = [
  'It learns document formats.',
  'It remembers which flags were false alarms.',
  'It recalls how exceptions were resolved.',
]

export function Differentiator() {
  return (
    <section id="memory" className="scroll-mt-20 bg-verdigris-soft">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-verdigris">
            The differentiator
          </p>
          <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight text-verdigris-deep sm:text-4xl">
            Memory that compounds.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-verdigris-deep/80">
            The first Vietnamese tax certificate takes a human. The fourth
            doesn&apos;t. Patina remembers formats, false alarms, and how your
            team resolves exceptions — so accuracy climbs with every vendor.
          </p>
        </div>

        {/* before / after */}
        <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
          {/* before */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-tertiary">
                Vendor #1 — first time seeing this format
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/25 bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">
                <Flag className="size-3" />
                Flagged
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {[
                { l: 'Tax identification no.', c: 'low' },
                { l: 'Legal entity name', c: 'medium' },
                { l: 'Registered address', c: 'low' },
              ].map((r) => (
                <div
                  key={r.l}
                  className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{r.l}</span>
                  <span
                    className={`flex items-center gap-1.5 text-xs font-medium ${
                      r.c === 'low' ? 'text-danger' : 'text-warning'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        r.c === 'low' ? 'bg-danger' : 'bg-warning'
                      }`}
                    />
                    {r.c === 'low' ? 'Low' : 'Medium'}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Sent to a human for review — unfamiliar layout, low confidence.
            </p>
          </div>

          {/* arrow */}
          <div className="flex items-center justify-center lg:px-2">
            <span className="flex size-10 items-center justify-center rounded-full border border-verdigris/30 bg-card text-verdigris">
              <ArrowRight className="size-5" />
            </span>
          </div>

          {/* after */}
          <div className="rounded-2xl border border-verdigris/30 bg-card p-5 ring-1 ring-verdigris/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-tertiary">
                Vendor #4 — same format, recognized
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                <Check className="size-3" />
                Auto-approved
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {['Tax identification no.', 'Legal entity name', 'Registered address'].map(
                (l) => (
                  <div
                    key={l}
                    className="flex items-center justify-between rounded-md bg-verdigris-soft px-3 py-2 text-sm"
                  >
                    <span className="text-verdigris-deep/80">{l}</span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                      <span className="size-1.5 rounded-full bg-success" />
                      High
                    </span>
                  </div>
                ),
              )}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-verdigris/25 bg-verdigris-soft p-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-verdigris" />
              <p className="text-sm font-medium text-verdigris-deep">
                Recognized from memory — onboarded in one pass.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {memories.map((m) => (
            <div
              key={m}
              className="flex items-center gap-2.5 rounded-xl border border-verdigris/20 bg-card/70 px-4 py-3"
            >
              <Sparkles className="size-4 shrink-0 text-verdigris" />
              <span className="text-sm font-medium text-verdigris-deep">
                {m}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
