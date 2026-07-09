import { PageHeader } from '@/components/app/page-header'
import { MemoryExplorer } from '@/components/app/memory-explorer'
import { getMemory } from '@/lib/api'
import { Sparkles } from 'lucide-react'

export default async function MemoryPage() {
  const memory = await getMemory()
  return (
    <div>
      <PageHeader
        title="Memory explorer"
        description="What the agent has learned — document formats, resolved exceptions, and known entities. Fading items are decaying toward being forgotten."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-verdigris/25 bg-verdigris-soft px-2.5 py-1 text-xs font-medium text-verdigris-deep">
            <Sparkles className="size-3" />
            Advanced
          </span>
        }
      />
      <div className="p-6 lg:p-8">
        <MemoryExplorer items={memory} />
      </div>
    </div>
  )
}
