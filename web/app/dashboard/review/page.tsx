import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { ReviewItem } from '@/components/app/review-item'
import { getReviewQueue } from '@/lib/api'

export default async function ReviewPage() {
  const reviewQueue = await getReviewQueue()
  return (
    <div>
      <PageHeader
        title="Review queue"
        description="Only genuine, novel exceptions reach a human. Auto-passed items never appear here."
      />
      <div className="p-6 lg:p-8">
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-card p-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-verdigris" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">
              {reviewQueue.length} items need a decision.
            </span>{' '}
            Patina cleared the rest on its own. Each decision you make here
            teaches the agent for next time.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {reviewQueue.map((item) => (
            <ReviewItem
              key={item.exception.id}
              vendor={item.vendor}
              exception={item.exception}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
