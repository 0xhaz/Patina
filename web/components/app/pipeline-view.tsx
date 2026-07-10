'use client'

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, Check, AlertTriangle, Loader2, PenLine } from 'lucide-react'
import { PipelineStepper } from '@/components/app/pipeline-stepper'
import { FieldTable } from '@/components/app/field-table'
import { StatusPill } from '@/components/patina/status-pill'
import { Button } from '@/components/ui/button'
import {
  getVendorDetail,
  getVendors,
  resolveVendor,
  type VendorDetail,
} from '@/lib/api'
import type { Vendor } from '@/lib/data'

// Map the backend status to the stepper position (7 stages, index 0-6).
function activeStep(status: string): number {
  return status === 'auto-approved' ? 7 : 5 // done through Decision, or paused at Human review
}

export function PipelineView() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [detail, setDetail] = useState<VendorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)

  const loadVendors = useCallback(async () => {
    const list = await getVendors()
    setVendors(list)
    setSelectedId((cur) => {
      if (cur && list.some((v) => v.id === cur)) return cur // keep current selection
      // On first load, honor the vendor passed from Intake (?vendor=...), else the
      // most recent flagged one, else the latest.
      const preferred =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('vendor')
          : null
      if (preferred && list.some((v) => v.id === preferred)) return preferred
      const flagged = list.find((v) => v.status === 'flagged' || v.status === 'needs-review')
      return (flagged ?? list[0])?.id ?? ''
    })
    return list
  }, [])

  useEffect(() => {
    loadVendors().finally(() => setLoading(false))
  }, [loadVendors])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    getVendorDetail(selectedId).then(setDetail)
  }, [selectedId])

  async function approve(rejections: string[] = []) {
    if (!detail) return
    setResolving(true)
    await resolveVendor(detail.vendor.id, rejections)
    await loadVendors()
    setDetail(await getVendorDetail(detail.vendor.id))
    setResolving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-bronze" /> Loading vendors…
      </div>
    )
  }

  if (vendors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">No vendors in the pipeline yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a packet on <span className="font-medium">Vendor intake</span> and it will appear
          here, moving through the stages.
        </p>
      </div>
    )
  }

  const v = detail?.vendor
  // Only offer to resolve when the vendor is actually still pending — a resolved /
  // auto-approved vendor keeps its exceptions for audit, but shouldn't show Approve again.
  const pending = !!v && (v.status === 'flagged' || v.status === 'needs-review')
  const showExceptions = pending && !!detail && detail.exceptions.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* vendor picker */}
      <div className="rounded-xl border border-verdigris/25 bg-verdigris-soft p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-verdigris" />
            <div>
              <p className="text-sm font-medium text-verdigris-deep">Inspect a vendor&apos;s run</p>
              <p className="text-sm leading-relaxed text-verdigris-deep/80">
                Every vendor here is live. Pick a flagged one and a recognized one to see the agent
                improve after learning a format.
              </p>
            </div>
          </div>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="shrink-0 rounded-lg border border-verdigris/30 bg-card px-3 py-1.5 text-sm text-foreground"
          >
            {vendors.map((vd) => (
              <option key={vd.id} value={vd.id}>
                {vd.flag} {vd.name} — {vd.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!v ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-bronze" /> Loading run…
        </div>
      ) : (
        <>
          {/* vendor header */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl leading-none" aria-hidden>
                {v.flag}
              </span>
              <div>
                <p className="text-base font-medium text-foreground">{v.name}</p>
                <p className="text-sm text-muted-foreground">
                  {v.latinName} · {v.docFormat}
                </p>
              </div>
            </div>
            <StatusPill status={v.status} />
          </div>

          {/* stepper */}
          <div className="rounded-xl border border-border bg-card p-5">
            <PipelineStepper activeIndex={activeStep(v.status)} />
          </div>

          {/* recognized / notes callout */}
          {(detail?.formatRecognized || (detail?.notes.length ?? 0) > 0) && (
            <div className="flex items-start gap-2.5 rounded-xl border border-verdigris/30 bg-verdigris-soft p-4">
              <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-verdigris text-primary-foreground">
                <Check className="size-3" />
              </span>
              <div>
                {detail?.formatRecognized && (
                  <p className="text-sm font-medium text-verdigris-deep">
                    Document format recognized from memory.
                  </p>
                )}
                {detail?.notes.map((n, i) => (
                  <p key={i} className="mt-1 text-sm leading-relaxed text-verdigris-deep/80">
                    {n}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* extracted fields */}
          <div>
            <h2 className="mb-3 text-base font-medium text-foreground">Extracted fields</h2>
            <FieldTable fields={detail?.fields ?? []} />
          </div>

          {/* exceptions */}
          <div>
            <h2 className="mb-3 text-base font-medium text-foreground">
              {showExceptions ? 'Exceptions to resolve' : 'Exceptions'}
            </h2>
            {showExceptions ? (
              <div className="flex flex-col gap-3">
                {detail!.exceptions.map((exc) => (
                  <div key={exc.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-start gap-2.5 rounded-lg bg-secondary/60 p-3.5">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{exc.field}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {exc.reasoning}
                        </p>
                      </div>
                    </div>
                    {exc.memory ? (
                      <div className="mt-3 rounded-lg border border-verdigris/25 bg-verdigris-soft p-3.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4 text-verdigris" />
                          <p className="text-sm font-medium text-verdigris-deep">
                            {exc.memory.summary}
                          </p>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-verdigris-deep/80">
                          {exc.memory.detail}
                        </p>
                        <p className="mt-2 text-xs font-medium text-verdigris">
                          Seen {exc.memory.seenCount}× previously
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs font-medium text-tertiary">
                        No precedent in memory yet — a genuinely novel exception.
                      </p>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-verdigris text-primary-foreground hover:bg-verdigris/90"
                    disabled={resolving}
                    onClick={() => approve()}
                  >
                    {resolving ? <Loader2 className="animate-spin" /> : <Check />} Approve &amp; teach memory
                  </Button>
                  <Button
                    variant="outline"
                    disabled={resolving}
                    onClick={() => approve(detail!.exceptions.map((e) => e.code || '').filter(Boolean))}
                  >
                    <PenLine /> Override
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl border border-success/25 bg-success/5 p-5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Check className="size-4" />
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {v.humanTouches > 0 ? (
                    <>
                      <span className="font-medium text-foreground">Resolved.</span> The exception
                      was approved and written to memory — the next similar vendor won&apos;t need a human.
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">No exceptions.</span> Onboarded
                      in one pass — the format was recognized and every field cleared validation.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
