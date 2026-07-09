import Link from 'next/link'
import { Logo } from '@/components/patina/logo'
import { Button } from '@/components/ui/button'

const columns = [
  {
    heading: 'Product',
    links: ['How it works', 'Memory', 'Pricing', 'Docs'],
  },
  {
    heading: 'Company',
    links: ['About', 'Customers', 'Careers', 'Contact'],
  },
  {
    heading: 'Legal',
    links: ['Privacy', 'Terms', 'Security', 'DPA'],
  },
]

export function Closing() {
  return (
    <>
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#1c1a17] px-6 py-16 text-center sm:py-20">
          <p className="text-sm font-medium text-[#6bb3a0]">
            Onboarding that gets sharper every time
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-medium tracking-tight text-[#ede9e1] sm:text-4xl">
            Stop onboarding the 500th supplier like the first.
          </h2>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              nativeButton={false}
              className="bg-[#c39a63] text-[#1c1a17] hover:bg-[#d4ac76]"
              render={<Link href="/dashboard">Request a demo</Link>}
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                An AI vendor-onboarding agent with a memory that improves with
                every supplier.
              </p>
            </div>
            {columns.map((col) => (
              <div key={col.heading}>
                <p className="text-sm font-medium text-foreground">
                  {col.heading}
                </p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-border pt-6 text-sm text-tertiary">
            © {new Date().getFullYear()} Patina. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
