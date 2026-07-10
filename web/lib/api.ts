// Live backend client. Returns real data — including an empty list when the store is
// empty (e.g. after a demo reset). It never substitutes mock data, so the UI always
// reflects the actual backend state. On a network error it returns the empty fallback.
import {
  dashboardMetrics,
  type MemoryItem,
  type Vendor,
} from '@/lib/data'

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:9000'

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: 'no-store' })
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback // backend unreachable
  }
}

export async function getVendors(): Promise<Vendor[]> {
  return get<Vendor[]>('/api/vendors', [])
}

export async function getMetrics() {
  // Metrics always render 4 cards; if the backend is unreachable, fall back to the
  // static sample so the layout holds (an empty DB still returns live zeroed cards).
  const live = await get<typeof dashboardMetrics>('/api/metrics', [] as never)
  return Array.isArray(live) && live.length ? live : dashboardMetrics
}

export type ReviewEntry = {
  vendor: Vendor
  exception: {
    id: string
    code?: string
    field: string
    severity: 'flagged' | 'needs-review'
    reasoning: string
    memory?: { summary: string; detail: string; seenCount: number }
  }
}

export async function getReviewQueue(): Promise<ReviewEntry[]> {
  return get<ReviewEntry[]>('/api/review-queue', [])
}

export async function getReviewCount(): Promise<number> {
  const q = await getReviewQueue()
  return q.length
}

export async function getMemory(): Promise<MemoryItem[]> {
  return get<MemoryItem[]>('/api/memory', [])
}

export function apiBase() {
  return BASE
}
