import { ShieldCheck, ScrollText, Lock } from 'lucide-react'

const langs = [
  { script: '营业执照', name: 'Chinese' },
  { script: '履歴事項全部証明書', name: 'Japanese' },
  { script: '사업자등록증', name: 'Korean' },
  { script: 'السجل التجاري', name: 'Arabic' },
  { script: 'Giấy phép', name: 'Vietnamese' },
  { script: 'Bizfile', name: 'Roman script' },
]

const trust = [
  {
    icon: ShieldCheck,
    title: 'Never acts unilaterally',
    body: 'A human approves every genuine exception. Patina handles the routine and routes the rest.',
  },
  {
    icon: ScrollText,
    title: 'Fully auditable',
    body: 'Every extraction, flag, and decision is logged with the reasoning behind it.',
  },
  {
    icon: Lock,
    title: 'Your memory, owned by you',
    body: 'The memory your team builds is an asset that stays with your organization.',
  },
]

export function CrossBorder() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-bronze">Cross-border ready</p>
          <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Built for documents in every language.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Patina reads documents in many languages and scripts natively —
            where a US-centric tool chokes on a Chinese business license.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {langs.map((l) => (
            <div
              key={l.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="text-lg font-medium text-foreground">
                {l.script}
              </span>
              <span className="text-sm text-muted-foreground">{l.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-2xl">
          <p className="text-sm font-medium text-bronze">
            Human-in-the-loop
          </p>
          <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            The judgment stays with your team.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {trust.map((t) => (
            <div
              key={t.title}
              className="rounded-xl border border-border bg-card p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-bronze">
                <t.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-medium text-foreground">
                {t.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
