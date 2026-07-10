'use client'

import { useCallback, useRef, useState } from 'react'
import {
  UploadCloud,
  Building2,
  Landmark,
  ShieldCheck,
  X,
  Check,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusPill } from '@/components/patina/status-pill'
import { FieldTable } from '@/components/app/field-table'
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

type Detail = {
  vendor: { id: string; name: string; latinName: string; status: string; docFormat: string }
  fields: { label: string; value: string; confidence: 'high' | 'medium' | 'low'; source: Slot }[]
  exceptions: {
    id: string
    code?: string
    field: string
    severity: 'flagged' | 'needs-review'
    reasoning: string
    memory?: { summary: string; detail: string; seenCount: number }
  }[]
  notes: string[]
  formatRecognized: boolean | null
}

export function IntakeUploader() {
  const [files, setFiles] = useState<Partial<Record<Slot, File>>>({})
  const [country, setCountry] = useState('CN')
  const [name, setName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Detail | null>(null)
  const [approved, setApproved] = useState(false)
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

  async function runOnboarding() {
    if (!ready) return
    setRunning(true)
    setError(null)
    setResult(null)
    setApproved(false)
    try {
      const fd = new FormData()
      fd.append('registration', files.registration!)
      fd.append('bank', files.bank!)
      fd.append('insurance', files.insurance!)
      fd.append('country', country)
      if (name) fd.append('name', name)
      const res = await fetch(`${apiBase()}/api/onboard`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setResult((await res.json()) as Detail)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onboarding failed')
    } finally {
      setRunning(false)
    }
  }

  async function approve() {
    if (!result) return
    try {
      await fetch(`${apiBase()}/api/vendors/${result.vendor.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejections: [] }),
      })
    } catch {
      /* reflect in UI regardless */
    }
    setApproved(true)
  }

  const flagged = result && result.exceptions.length > 0

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

      {/* ---- Control / result column ---- */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-foreground">Onboard vendor</p>

          <label className="mt-4 block text-xs font-medium text-muted-foreground">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
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
            placeholder="e.g. Shanghai Precision Machinery"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />

          <Button
            className="mt-5 w-full bg-bronze text-primary-foreground hover:bg-bronze-hover"
            disabled={!ready || running}
            onClick={runOnboarding}
          >
            {running ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            {running ? 'Onboarding…' : 'Run onboarding'}
          </Button>
          {!ready && (
            <p className="mt-3 text-xs leading-relaxed text-tertiary">
              Add all three documents to enable onboarding.
            </p>
          )}
          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </div>

        {/* Live result summary */}
        {running && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-bronze" />
            Extracting with Qwen‑VL, validating, and checking memory…
          </div>
        )}

        {result && !running && (
          <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{result.vendor.name || result.vendor.id}</p>
              <StatusPill status={(approved ? 'auto-approved' : result.vendor.status) as never} />
            </div>
            {result.formatRecognized === true && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-verdigris">
                <Sparkles className="size-3" /> Format recognized from memory
              </p>
            )}
            {result.notes.map((n, i) => (
              <p key={i} className="mt-2 text-xs text-muted-foreground">
                {n}
              </p>
            ))}
          </div>
        )}
      </aside>

      {/* ---- Full-width result detail ---- */}
      {result && !running && (
        <div className="lg:col-span-2">
          <h2 className="mb-3 mt-2 text-base font-medium text-foreground">Extracted fields</h2>
          <FieldTable fields={result.fields as never} />

          {flagged && !approved && (
            <div className="mt-6 flex flex-col gap-4">
              {result.exceptions.map((exc) => (
                <div key={exc.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start gap-2.5 rounded-lg bg-secondary/60 p-3.5">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{exc.field}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{exc.reasoning}</p>
                    </div>
                  </div>
                  {exc.memory ? (
                    <div className="mt-3 rounded-lg border border-verdigris/25 bg-verdigris-soft p-3.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-verdigris" />
                        <p className="text-sm font-medium text-verdigris-deep">{exc.memory.summary}</p>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-verdigris-deep/80">{exc.memory.detail}</p>
                      <p className="mt-2 text-xs font-medium text-verdigris">Seen {exc.memory.seenCount}× previously</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs font-medium text-tertiary">
                      No precedent in memory yet — this is a genuinely novel exception.
                    </p>
                  )}
                </div>
              ))}
              <div>
                <Button className="bg-verdigris text-primary-foreground hover:bg-verdigris/90" onClick={approve}>
                  <Check /> Approve &amp; teach memory
                </Button>
              </div>
            </div>
          )}

          {approved && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-success/25 bg-success/5 p-5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
                <Check className="size-4" />
              </span>
              <p className="text-sm text-muted-foreground">
                Approved. Decision saved to memory — the next similar vendor will onboard in one pass.
              </p>
            </div>
          )}

          {!flagged && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-success/25 bg-success/5 p-5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
                <Check className="size-4" />
              </span>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Auto‑approved</span> — no human touches. Patina
                validated the packet and recognized everything it needed to.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
