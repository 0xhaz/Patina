// Live backend client. Server components fetch these; falls back to static demo
// data (lib/data.ts) if the backend is unreachable, so the UI never breaks.
import {
  dashboardMetrics,
  memoryItems,
  reviewQueue,
  vendors,
  type MemoryItem,
  type Vendor,
} from '@/lib/data'

const BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:9000'

async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { cache: 'no-store' })
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback // backend down → static demo data
  }
}

export async function getVendors(): Promise<Vendor[]> {
  const live = await get<Vendor[]>('/api/vendors', [])
  return live.length ? live : vendors
}

export async function getMetrics() {
  const live = await get<typeof dashboardMetrics>('/api/metrics', [] as never)
  return Array.isArray(live) && live.length ? live : dashboardMetrics
}

export type ReviewEntry = { vendor: Vendor; exception: (typeof reviewQueue)[number]['exception'] & { code?: string } }

export async function getReviewQueue(): Promise<ReviewEntry[]> {
  return get<ReviewEntry[]>('/api/review-queue', reviewQueue as ReviewEntry[])
}

export async function getMemory(): Promise<MemoryItem[]> {
  const live = await get<MemoryItem[]>('/api/memory', [])
  return live.length ? live : memoryItems
}

export function apiBase() {
  return BASE
}
