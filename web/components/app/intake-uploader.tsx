'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UploadCloud,
  Building2,
  Landmark,
  ShieldCheck,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { apiBase } from '@/lib/api'

type Slot = 'registration' | 'bank' | 'insurance'

const slotMeta: Record<Slot, { label: string; icon: typeof Building2 }> = {
  registration: { label: 'Business registration', icon: Building2 },
  bank: { label: 'Bank letter', icon: Landmark },
  insurance: { label: 'Insurance certificate', icon: ShieldCheck },
}

const COUNTRIES = [
  { code: 'CN', label: '🇨🇳 China' },
  { code: 'JP', label: '🇯🇵 Japan' },
  { code: 'MY', label: '🇲🇾 Malaysia' },
  { code: 'SG', label: '🇸🇬 Singapore' },
]

const SLOTS: Slot[] = ['registration', 'bank', 'insurance']

function classify(name: string): Slot {
  const n = name.toLowerCase()
  if (/(bank|account|letter|账户|銀行)/.test(n)) return 'bank'
  if (/(insur|policy|liab|保险|保険|cert)/.test(n)) return 'insurance'
  return 'registration'
}

export function IntakeUploader() {
  const router = useRouter()
  const [files, setFiles] = useState<Partial<Record<Slot, File>>>({})
  const [country, setCountry] = useState('CN')
  const [name, setName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return
    setFiles((prev) => {
      const next = { ...prev }
      for (const f of Array.from(list)) next[classify(f.name)] = f
      return next
    })
  }, [])

  const ready = Boolean(files.registration && files.bank && files.insurance)

  // Upload the packet, run the pipeline, and hand off to the Pipeline page where the
  // stepper, extracted fields, exceptions, and Approve live.
  async function submit() {
    if (!ready) return
    setRunning(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('registration', files.registration!)
      fd.append('bank', files.bank!)
      fd.append('insurance', files.insurance!)
      fd.append('country', country)
      if (name) fd.append('name', name)
      const res = await fetch(`${apiBase()}/api/onboard`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = (await res.json()) as { vendor: { id: string } }
      router.push(`/dashboard/pipeline?vendor=${encodeURIComponent(data.vendor.id)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onboarding failed')
      setRunning(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* ---- Upload column ---- */}
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            addFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
            dragging ? 'border-bronze bg-bronze/5' : 'border-border bg-card hover:border-bronze/50',
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-bronze">
            <UploadCloud className="size-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">Drop the vendor&apos;s documents here</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registration, bank letter, insurance — any language. Auto‑sorted by filename.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => inputRef.current?.click()}>
            Browse files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {/* Slot checklist */}
        <div className="mt-5 flex flex-col gap-2.5">
          {SLOTS.map((slot) => {
            const meta = slotMeta[slot]
            const Icon = meta.icon
            const f = files[slot]
            return (
              <div
                key={slot}
                className={cn(
                  'flex items-center gap-3 rounded-xl border bg-card p-3.5',
                  f ? 'border-border' : 'border-dashed border-border/70',
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{meta.label}</p>
                  <p className="truncate text-xs text-tertiary">{f ? f.name : 'Waiting for file…'}</p>
                </div>
                {f ? (
                  <button
                    type="button"
                    aria-label={`Remove ${meta.label}`}
                    onClick={() => setFiles((p) => ({ ...p, [slot]: undefined }))}
                    className="text-tertiary transition-colors hover:text-danger"
                    disabled={running}
                  >
                    <X className="size-4" />
                  </button>
                ) : (
                  <span className="text-xs text-tertiary">Missing</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ---- Control column ---- */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-foreground">Onboard vendor</p>

          <label className="mt-4 block text-xs font-medium text-muted-foreground">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={running}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>

          <label className="mt-3 block text-xs font-medium text-muted-foreground">
            Vendor name <span className="text-tertiary">(optional)</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={running}
            placeholder="e.g. Shanghai Precision Machinery"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />

          <Button
            className="mt-5 w-full bg-bronze text-primary-foreground hover:bg-bronze-hover"
            disabled={!ready || running}
            onClick={submit}
          >
            {running ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            {running ? 'Onboarding…' : 'Run onboarding'}
          </Button>

          {running ? (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Extracting with Qwen‑VL, validating, and checking memory — taking you to the pipeline…
            </p>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-tertiary">
              {ready
                ? 'Patina will extract fields, validate, and check memory — then open the run in the pipeline.'
                : 'Add all three documents to enable onboarding.'}
            </p>
          )}
          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </div>
      </aside>
    </div>
  )
}
