import { PageHeader } from '@/components/app/page-header'
import { PipelineView } from '@/components/app/pipeline-view'

export default function PipelinePage() {
  return (
    <div>
      <PageHeader
        title="Onboarding pipeline"
        description="A single vendor moving through extraction, validation, and memory checks — with human-in-the-loop on genuine exceptions."
      />
      <div className="p-6 lg:p-8">
        <PipelineView />
      </div>
    </div>
  )
}
