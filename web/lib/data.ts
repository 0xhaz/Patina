export type VendorStatus = 'auto-approved' | 'needs-review' | 'flagged'
export type Confidence = 'high' | 'medium' | 'low'
export type DocType = 'registration' | 'bank' | 'insurance'

export type Vendor = {
  id: string
  name: string
  latinName: string
  country: string
  flag: string
  status: VendorStatus
  submitted: string
  humanTouches: number
  docFormat: string
}

export type Field = {
  label: string
  value: string
  confidence: Confidence
  source: DocType
}

export type MemorySuggestion = {
  summary: string
  detail: string
  seenCount: number
}

export type Exception = {
  id: string
  field: string
  severity: VendorStatus
  reasoning: string
  memory?: MemorySuggestion
}

export const statusLabel: Record<VendorStatus, string> = {
  'auto-approved': 'Auto-approved',
  'needs-review': 'Needs review',
  flagged: 'Flagged',
}

export const vendors: Vendor[] = [
  {
    id: 'v-1042',
    name: '東京精密工業株式会社',
    latinName: 'Tokyo Precision Industries',
    country: 'Japan',
    flag: '🇯🇵',
    status: 'auto-approved',
    submitted: '12 minutes ago',
    humanTouches: 0,
    docFormat: 'JP — 履歴事項全部証明書',
  },
  {
    id: 'v-1041',
    name: '上海精密机械有限公司',
    latinName: 'Shanghai Precision Machinery',
    country: 'China',
    flag: '🇨🇳',
    status: 'flagged',
    submitted: '38 minutes ago',
    humanTouches: 2,
    docFormat: 'CN — 营业执照',
  },
  {
    id: 'v-1040',
    name: 'Brightpath Industrial Sdn Bhd',
    latinName: 'Brightpath Industrial',
    country: 'Malaysia',
    flag: '🇲🇾',
    status: 'needs-review',
    submitted: '1 hour ago',
    humanTouches: 1,
    docFormat: 'MY — SSM registration',
  },
  {
    id: 'v-1039',
    name: 'Keppel Logistics Pte Ltd',
    latinName: 'Keppel Logistics',
    country: 'Singapore',
    flag: '🇸🇬',
    status: 'auto-approved',
    submitted: '2 hours ago',
    humanTouches: 0,
    docFormat: 'SG — ACRA bizfile',
  },
  {
    id: 'v-1038',
    name: '深圳華強電子有限公司',
    latinName: 'Shenzhen Huaqiang Electronics',
    country: 'China',
    flag: '🇨🇳',
    status: 'auto-approved',
    submitted: '3 hours ago',
    humanTouches: 0,
    docFormat: 'CN — 营业执照',
  },
  {
    id: 'v-1037',
    name: 'Công ty TNHH Thành Đạt',
    latinName: 'Thanh Dat Co.',
    country: 'Vietnam',
    flag: '🇻🇳',
    status: 'needs-review',
    submitted: '5 hours ago',
    humanTouches: 1,
    docFormat: 'VN — tax certificate',
  },
  {
    id: 'v-1036',
    name: '대성정밀 주식회사',
    latinName: 'Daesung Precision',
    country: 'South Korea',
    flag: '🇰🇷',
    status: 'auto-approved',
    submitted: '6 hours ago',
    humanTouches: 0,
    docFormat: 'KR — 사업자등록증',
  },
]

export const dashboardMetrics = [
  {
    label: 'Vendors onboarded',
    value: '1,284',
    unit: '',
    trend: 'up' as const,
    delta: '+126 this month',
    series: [38, 41, 44, 49, 53, 58, 66, 72],
    accent: 'neutral' as const,
  },
  {
    label: 'Avg. human touches per vendor',
    value: '0.4',
    unit: '',
    trend: 'down' as const,
    delta: '−38% vs. last quarter',
    series: [1.9, 1.7, 1.4, 1.2, 0.9, 0.7, 0.5, 0.4],
    accent: 'good' as const,
  },
  {
    label: 'False flags this week',
    value: '11',
    unit: '',
    trend: 'down' as const,
    delta: '−61% vs. peak',
    series: [42, 38, 31, 27, 22, 18, 14, 11],
    accent: 'good' as const,
  },
  {
    label: 'Avg. time to onboard',
    value: '6m',
    unit: '',
    trend: 'down' as const,
    delta: '−72% vs. manual',
    series: [52, 44, 33, 26, 19, 14, 9, 6],
    accent: 'good' as const,
  },
]

export const pipelineStages = [
  'Intake',
  'Extraction',
  'Validation',
  'Memory check',
  'Exception routing',
  'Human review',
  'Decision',
] as const

// Vendor #1 — struggles, low confidence, flagged (first time seeing this format)
export const firstPassFields: Field[] = [
  {
    label: 'Legal entity name',
    value: '上海精密机械有限公司',
    confidence: 'medium',
    source: 'registration',
  },
  {
    label: 'Unified social credit code',
    value: '91310000MA1FL... (partial)',
    confidence: 'low',
    source: 'registration',
  },
  {
    label: 'Registered capital',
    value: 'RMB 5,000,000',
    confidence: 'medium',
    source: 'registration',
  },
  {
    label: 'Trading name',
    value: 'SPM Machinery',
    confidence: 'low',
    source: 'bank',
  },
  {
    label: 'Bank account holder',
    value: 'Shanghai Precision Mach. Co.',
    confidence: 'low',
    source: 'bank',
  },
  {
    label: 'Insurance policy no.',
    value: 'PICC-2024-88213',
    confidence: 'medium',
    source: 'insurance',
  },
]

export const firstPassExceptions: Exception[] = [
  {
    id: 'e-1',
    field: 'Unified social credit code',
    severity: 'flagged',
    reasoning:
      'Credit code could not be read with confidence. The layout places it in the document header, which the agent has not seen before for this jurisdiction.',
  },
  {
    id: 'e-2',
    field: 'Trading name mismatch',
    severity: 'needs-review',
    reasoning:
      'Bank letter shows "SPM Machinery" while registration shows "Shanghai Precision Machinery". No prior precedent for this entity type — escalating to a human.',
  },
]

// Vendor #2 — same format, now recognized, high confidence, auto-approved
export const secondPassFields: Field[] = [
  {
    label: 'Legal entity name',
    value: '深圳華強電子有限公司',
    confidence: 'high',
    source: 'registration',
  },
  {
    label: 'Unified social credit code',
    value: '91440300MA5DA2X41B',
    confidence: 'high',
    source: 'registration',
  },
  {
    label: 'Registered capital',
    value: 'RMB 10,000,000',
    confidence: 'high',
    source: 'registration',
  },
  {
    label: 'Trading name',
    value: 'Huaqiang Electronics',
    confidence: 'high',
    source: 'bank',
  },
  {
    label: 'Bank account holder',
    value: 'Shenzhen Huaqiang Electronics Co.',
    confidence: 'high',
    source: 'bank',
  },
  {
    label: 'Insurance policy no.',
    value: 'PICC-2024-90551',
    confidence: 'high',
    source: 'insurance',
  },
]

export const secondPassMemory: MemorySuggestion = {
  summary: 'Recognized from memory — onboarded in one pass.',
  detail:
    'Chinese business license (营业执照): unified social credit code is in the document header. Format learned from 4 prior vendors. Trading-name abbreviation on bank letters accepted for this entity type (seen 3× previously).',
  seenCount: 4,
}

export const reviewQueue: {
  vendor: Vendor
  exception: Exception
}[] = [
  {
    vendor: vendors[1],
    exception: {
      id: 'rq-1',
      field: 'Trading name mismatch',
      severity: 'needs-review',
      reasoning:
        'Bank letter shows "SPM Machinery"; registration shows "Shanghai Precision Machinery".',
      memory: {
        summary: 'Similar case resolved before',
        detail:
          'Trading-name abbreviation on bank letters was accepted for this entity type (private LLC, CN). Seen and approved 3× previously.',
        seenCount: 3,
      },
    },
  },
  {
    vendor: vendors[2],
    exception: {
      id: 'rq-2',
      field: 'Insurance expiry within 30 days',
      severity: 'needs-review',
      reasoning:
        'Liability cover expires in 21 days. Policy meets minimum coverage but renewal window is tight.',
      memory: {
        summary: 'Policy precedent on file',
        detail:
          'For logistics suppliers, a renewal confirmation letter has previously satisfied this exception. Seen 2× previously.',
        seenCount: 2,
      },
    },
  },
  {
    vendor: vendors[5],
    exception: {
      id: 'rq-3',
      field: 'Tax certificate — new format',
      severity: 'flagged',
      reasoning:
        'First Vietnamese tax certificate in this layout. Tax ID position differs from known templates; could not confirm with high confidence.',
    },
  },
]

export type MemoryType = 'format' | 'exception' | 'entity'

export type MemoryItem = {
  id: string
  type: MemoryType
  title: string
  description: string
  relevance: number // 0-100
  state: 'reinforced' | 'stable' | 'decaying'
  lastUsed: string
  learned: string
  recalled: number
  usedBy?: { id: string; name: string }[] // vendors this memory served
}

export const memoryItems: MemoryItem[] = [
  {
    id: 'm-1',
    type: 'format',
    title: 'Chinese business license — 营业执照',
    description: 'Unified social credit code located in the document header.',
    relevance: 96,
    state: 'reinforced',
    lastUsed: '12 minutes ago',
    learned: '4 months ago',
    recalled: 218,
  },
  {
    id: 'm-2',
    type: 'format',
    title: 'Japanese registry — 履歴事項全部証明書',
    description: 'Corporate number printed top-right; capital in tabular block.',
    relevance: 88,
    state: 'reinforced',
    lastUsed: '12 minutes ago',
    learned: '3 months ago',
    recalled: 154,
  },
  {
    id: 'm-3',
    type: 'exception',
    title: 'Trading-name abbreviation accepted',
    description:
      'Bank-letter trading name may abbreviate the registered name for private LLCs (CN).',
    relevance: 74,
    state: 'stable',
    lastUsed: '38 minutes ago',
    learned: '2 months ago',
    recalled: 41,
  },
  {
    id: 'm-4',
    type: 'exception',
    title: 'Insurance renewal letter satisfies short expiry',
    description:
      'A renewal confirmation has resolved tight-expiry flags for logistics vendors.',
    relevance: 58,
    state: 'stable',
    lastUsed: '1 hour ago',
    learned: '6 weeks ago',
    recalled: 23,
  },
  {
    id: 'm-5',
    type: 'entity',
    title: 'Keppel Logistics Pte Ltd',
    description: 'Known vendor. UEN, bank, and insurer on file and verified.',
    relevance: 81,
    state: 'reinforced',
    lastUsed: '2 hours ago',
    learned: '5 months ago',
    recalled: 12,
  },
  {
    id: 'm-6',
    type: 'format',
    title: 'Korean registration — 사업자등록증',
    description: 'Business registration number is dash-delimited, top section.',
    relevance: 33,
    state: 'decaying',
    lastUsed: '3 weeks ago',
    learned: '4 months ago',
    recalled: 9,
  },
  {
    id: 'm-7',
    type: 'exception',
    title: 'Stamped-only bank letter (no letterhead)',
    description:
      'Accepted for a regional bank where letterhead was replaced by an official chop.',
    relevance: 29,
    state: 'decaying',
    lastUsed: '1 month ago',
    learned: '3 months ago',
    recalled: 4,
  },
  {
    id: 'm-8',
    type: 'entity',
    title: 'Brightpath Industrial Sdn Bhd',
    description: 'Partial profile. SSM verified; insurance pending review.',
    relevance: 52,
    state: 'stable',
    lastUsed: '1 hour ago',
    learned: '1 week ago',
    recalled: 3,
  },
]

export const memoryTypeLabel: Record<MemoryType, string> = {
  format: 'Format memory',
  exception: 'Exception memory',
  entity: 'Entity memory',
}
