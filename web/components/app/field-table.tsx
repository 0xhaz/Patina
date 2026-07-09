import { ConfidenceBadge } from '@/components/patina/confidence-badge'
import type { Field, DocType } from '@/lib/data'

const sourceLabel: Record<DocType, string> = {
  registration: 'Registration',
  bank: 'Bank letter',
  insurance: 'Insurance',
}

export function FieldTable({ fields }: { fields: Field[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-tertiary">
            <th className="px-5 py-3 font-medium">Field</th>
            <th className="px-5 py-3 font-medium">Value</th>
            <th className="hidden px-5 py-3 font-medium sm:table-cell">
              Source
            </th>
            <th className="px-5 py-3 text-right font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {fields.map((f) => (
            <tr key={f.label} className="hover:bg-secondary/40">
              <td className="px-5 py-3 text-muted-foreground">{f.label}</td>
              <td className="px-5 py-3 font-medium text-foreground">
                {f.value}
              </td>
              <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">
                {sourceLabel[f.source]}
              </td>
              <td className="px-5 py-3 text-right">
                <ConfidenceBadge
                  confidence={f.confidence}
                  className="justify-end"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
