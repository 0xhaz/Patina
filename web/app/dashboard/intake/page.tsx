import { PageHeader } from '@/components/app/page-header'
import { IntakeUploader } from '@/components/app/intake-uploader'

export default function IntakePage() {
  return (
    <div>
      <PageHeader
        title="Vendor intake"
        description="Drop a new supplier's documents. Patina auto-detects each document type and prepares the onboarding run."
      />
      <div className="p-6 lg:p-8">
        <IntakeUploader />
      </div>
    </div>
  )
}
