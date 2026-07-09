import { FileInput, ScanLine, Brain, UserCheck } from 'lucide-react'

const steps = [
  {
    icon: FileInput,
    title: 'Documents arrive',
    body: 'Any format, any language — PDF, photo, or scan. Registration docs, bank letters, insurance certificates.',
  },
  {
    icon: ScanLine,
    title: 'Patina extracts and validates',
    body: 'Fields are pulled and checked against your policy — coverage minimums, name matches, expiry windows.',
  },
  {
    icon: Brain,
    title: 'It checks its memory',
    body: 'Has it seen this format, this exception, or this vendor before? Recognized cases pass without a human.',
    memory: true,
  },
  {
    icon: UserCheck,
    title: 'Only genuine exceptions reach a human',
    body: 'A reviewer approves in one tap — and that decision teaches Patina for next time.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-bronze">How it works</p>
          <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            A loop that improves itself.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Every human decision feeds back into memory, so the next vendor of
            the same kind moves faster than the last.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex flex-col rounded-xl border border-border bg-card p-6"
            >
              <span
                className={`flex size-10 items-center justify-center rounded-lg ${
                  step.memory
                    ? 'bg-verdigris-soft text-verdigris'
                    : 'bg-secondary text-bronze'
                }`}
              >
                <step.icon className="size-5" />
              </span>
              <span className="mt-4 text-xs font-medium text-tertiary">
                Step {i + 1}
              </span>
              <h3 className="mt-1 text-base font-medium text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
