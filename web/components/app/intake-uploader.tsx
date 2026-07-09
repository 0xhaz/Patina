'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import {
  UploadCloud,
  FileText,
  Building2,
  Landmark,
  ShieldCheck,
  X,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DocType } from '@/lib/data'

type UploadedFile = {
  id: string
  name: string
  size: string
  type: DocType
}

const typeMeta: Record<
  DocType,
  { label: string; icon: typeof Building2; tint: string }
> = {
  registration: {
    label: 'Business registration',
    icon: Building2,
    tint: 'bg-bronze/10 text-bronze',
  },
  bank: {
    label: 'Bank letter',
    icon: Landmark,
    tint: 'bg-info/10 text-info',
  },
  insurance: {
    label: 'Insurance certificate',
    icon: ShieldCheck,
    tint: 'bg-verdigris/10 text-verdigris',
  },
}

// Seed examples representing auto-detected docs for a CN vendor.
const seedFiles: UploadedFile[] = [
  { id: 's1', name: '营业执照.pdf', size: '1.2 MB', type: 'registration' },
  { id: 's2', name: 'bank-confirmation-letter.pdf', size: '460 KB', type: 'bank' },
  { id: 's3', name: 'PICC-liability-policy.jpg', size: '2.1 MB', type: 'insurance' },
]

const detectType = (name: string): DocType => {
  const n = name.toLowerCase()
  if (/(bank|账户|account|letter)/.test(n)) return 'bank'
  if (/(insur|policy|picc|liab|保险)/.test(n)) return 'insurance'
  return 'registration'
}

export function IntakeUploader() {
  const [files, setFiles] = useState<UploadedFile[]>(seedFiles)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return
    const next: UploadedFile[] = Array.from(list).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      type: detectType(f.name),
    }))
    setFiles((prev) => [...prev, ...next])
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors',
            dragging
              ? 'border-bronze bg-bronze/5'
              : 'border-border bg-card hover:border-bronze/50',
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-bronze">
            <UploadCloud className="size-6" />
          </span>
          <p className="mt-4 text-sm font-medium text-foreground">
            Drag and drop documents here
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF or image — registration, bank letter, insurance certificate.
            Any language.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => inputRef.current?.click()}
          >
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

        <div className="mt-5 flex flex-col gap-2.5">
          {files.map((f) => {
            const meta = typeMeta[f.type]
            const Icon = meta.icon
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {f.name}
                  </p>
                  <p className="text-xs text-tertiary">{f.size}</p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    meta.tint,
                  )}
                >
                  <Icon className="size-3" />
                  {meta.label}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() =>
                    setFiles((prev) => prev.filter((x) => x.id !== f.id))
                  }
                  className="text-tertiary transition-colors hover:text-danger"
                >
                  <X className="size-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-foreground">
            Ready to onboard
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Patina detected{' '}
            <span className="font-medium text-foreground">{files.length}</span>{' '}
            document{files.length === 1 ? '' : 's'} across{' '}
            {new Set(files.map((f) => f.type)).size} categories.
          </p>

          <dl className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
            {(['registration', 'bank', 'insurance'] as DocType[]).map((t) => {
              const present = files.some((f) => f.type === t)
              return (
                <div key={t} className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{typeMeta[t].label}</dt>
                  <dd
                    className={cn(
                      'text-xs font-medium',
                      present ? 'text-success' : 'text-tertiary',
                    )}
                  >
                    {present ? 'Detected' : 'Missing'}
                  </dd>
                </div>
              )
            })}
          </dl>

          <Button
            nativeButton={false}
            className="mt-5 w-full bg-bronze text-primary-foreground hover:bg-bronze-hover"
            disabled={files.length === 0}
            render={
              <Link href="/dashboard/pipeline">
                Start onboarding
                <ArrowRight />
              </Link>
            }
          />
          <p className="mt-3 text-xs leading-relaxed text-tertiary">
            Patina will extract fields, validate against your policy, and check
            its memory before routing anything to a human.
          </p>
        </div>
      </aside>
    </div>
  )
}
